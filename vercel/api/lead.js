/**
 * Lead delivery through Resend, hosted on Vercel.
 *
 *     POST https://<project>.vercel.app/api/lead
 *
 * This exists so the pasted WordPress block can send through Resend without
 * anything being installed on goldenmilechrysler.ca. The Resend key lives in
 * this Vercel project's environment (RESEND_API_KEY) and nowhere else: not in
 * the repo, not in the pasted block, not on the WordPress site.
 *
 * It takes the same JSON the WordPress plugin's /wp-json/gmi/v1/lead route
 * takes (buildLead() in edealer/gm-incentives.js). The email is the styled
 * card the fleet and financing leads use, with the plain text version
 * wordpress/golden-mile-incentives/lead.php sends carried alongside it.
 *
 * One difference from the plugin, and it matters: nothing is stored here.
 * So when Resend refuses or is unreachable this answers with an error, and
 * the page falls back to FormSubmit rather than showing a success for a lead
 * nobody received.
 *
 * Environment (Vercel > Project > Settings > Environment Variables):
 *
 *   RESEND_API_KEY   required. A Resend key with sending access.
 *   LEAD_FROM        optional. Must be on a domain verified in Resend.
 *   LEAD_TO          optional. Who receives the lead.
 *   LEAD_CC          optional. Comma separated copies.
 *   ALLOWED_ORIGINS  optional. Comma separated origins allowed to post.
 */

const DEFAULTS = {
  from: 'Golden Mile Chrysler <offers@goldenmiledeals.ca>',
  to: 'ejay@goldenmilechrysler.ca',
  cc: 'mitch@goldenmilechrysler.ca,nav@goldenmilechrysler.ca',
  origins: [
    'https://goldenmilechrysler.ca',
    'https://www.goldenmilechrysler.ca',
    'https://apparatus9.github.io',
  ].join(','),
};

/* In the order they are emailed. Same list as gmi_lead_fields() in lead.php. */
const FIELDS = [
  ['offerName', 'Offer', 300],
  ['offerEnds', 'Offer ends', 120],
  ['firstName', 'First name', 80],
  ['lastName', 'Last name', 80],
  ['email', 'Email', 200],
  ['phone', 'Phone', 40],
  ['contactMethod', 'Preferred contact', 40],
  ['vehicle', 'Vehicle of interest', 200],
  ['timeline', 'Purchase timeline', 80],
  ['tradeIn', 'Trade-in', 80],
  ['financeType', 'Buying method', 80],
  ['loyaltyVehicle', 'Currently owns', 200],
  ['loyaltySince', 'Registered since', 80],
  ['comments', 'Comments', 4000],
  ['consent', 'Consent to contact', 10],
  ['pageUrl', 'Page', 500],
];

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

/* A handful an hour from one address, as the plugin does. Serverless
   instances do not share memory, so this is best effort: it stops one
   visitor hammering a warm instance, not a determined sender. */
const RATE_LIMIT = 6;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map();

function rateOk(ip) {
  if (!ip) { return true; }
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (t) { return now - t < RATE_WINDOW_MS; });
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) { hits.clear(); }
  return true;
}

function list(value) {
  return String(value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}

/* One line, no control characters. Comments keep their line breaks. */
function clean(value, max, multiline) {
  if (value === undefined || value === null || typeof value === 'object') { return ''; }
  let out = String(value);
  out = multiline
    ? out.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    : out.replace(/[\u0000-\u001F\u007F]+/g, ' ');
  return out.trim().slice(0, max);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve(null); }
  }
  return new Promise(function (resolve) {
    let raw = '';
    req.on('data', function (chunk) {
      raw += chunk;
      if (raw.length > 100000) { req.destroy(); resolve(null); }
    });
    req.on('end', function () {
      try { resolve(JSON.parse(raw)); } catch (e) { resolve(null); }
    });
    req.on('error', function () { resolve(null); });
  });
}

function buildText(lead) {
  const name = (lead.firstName + ' ' + lead.lastName).trim();
  const width = Math.max.apply(null, FIELDS.map(function (f) { return f[1].length; })) + 3;
  const lines = [
    'New offer request from the website.',
    '',
    name.toUpperCase() + '   ' + lead.phone,
    '',
  ];
  FIELDS.forEach(function (f) {
    if (lead[f[0]] === '') { return; }
    lines.push((f[1] + ':').padEnd(width) + lead[f[0]]);
  });
  lines.push('');
  lines.push('Received:'.padEnd(width) + new Date().toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'full',
    timeStyle: 'short',
  }));
  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* The same card the fleet and financing leads arrive in: black header,
   label and value rows, notes and a footer. Two things are added for this
   page - the offer they asked for sits in its own red-ruled panel, and the
   name and phone are at the top, because that is what gets acted on.
   Inline styles only; mail clients drop everything else. */
function buildHtml(lead) {
  const F = 'Helvetica,Arial,sans-serif';
  const name = escapeHtml((lead.firstName + ' ' + lead.lastName).trim());
  const tel = lead.phone.replace(/[^0-9+]/g, '');
  const label = 'color:#767676;font:600 12px/1.5 ' + F + ';letter-spacing:.08em;text-transform:uppercase';

  const links = {
    email: 'mailto:' + lead.email,
    phone: 'tel:' + tel,
    pageUrl: /^https?:\/\//i.test(lead.pageUrl) ? lead.pageUrl : '',
  };
  /* Shown elsewhere on the card, so not repeated in the table. */
  const skip = ['offerName', 'offerEnds', 'firstName', 'lastName', 'phone', 'contactMethod', 'comments', 'consent'];

  const rows = FIELDS.filter(function (f) {
    return skip.indexOf(f[0]) === -1 && lead[f[0]] !== '';
  }).map(function (f) {
    let value = escapeHtml(lead[f[0]]);
    if (links[f[0]]) {
      value = '<a href="' + escapeHtml(links[f[0]]) + '" style="color:#c00000;text-decoration:none">' + value + '</a>';
    }
    return '<tr><td style="padding:8px 16px 8px 0;' + label + ';white-space:nowrap;vertical-align:top">' +
      escapeHtml(f[1]) +
      '</td><td style="padding:8px 0;color:#1a1a1a;font:400 15px/1.5 ' + F + ';word-break:break-word">' +
      value + '</td></tr>';
  }).join('');

  const received = new Date().toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const out = [
    '<div style="background:#f2f2f2;padding:32px">',
    '<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e2e2">',

    '<div style="background:#0d0d0d;color:#fff;padding:24px 28px">',
    '<div style="font:700 11px/1.4 ' + F + ';letter-spacing:.22em;text-transform:uppercase;color:#c9c9c9">',
    'Golden Mile Chrysler</div>',
    '<div style="font:700 22px/1.3 ' + F + ';margin-top:6px">Offer Request</div>',
    '</div>',

    '<div style="padding:28px">',

    '<div style="font:700 24px/1.25 ' + F + ';color:#0d0d0d">' + name + '</div>',
    '<div style="margin-top:4px;font:700 20px/1.3 ' + F + '">',
    '<a href="tel:' + escapeHtml(tel) + '" style="color:#c00000;text-decoration:none">' + escapeHtml(lead.phone) + '</a>',
    '</div>',
    lead.contactMethod
      ? '<div style="margin-top:6px;color:#767676;font:400 13px/1.5 ' + F + '">Prefers: ' +
        escapeHtml(lead.contactMethod) + '</div>'
      : '',

    '<div style="margin-top:22px;background:#f7f7f7;border-left:4px solid #c00000;padding:16px 18px">',
    '<div style="' + label + '">Offer requested</div>',
    '<div style="margin-top:6px;color:#0d0d0d;font:700 16px/1.4 ' + F + '">' +
      escapeHtml(lead.offerName || 'Golden Mile offer') + '</div>',
    lead.offerEnds
      ? '<div style="margin-top:4px;color:#767676;font:400 13px/1.5 ' + F + '">' + escapeHtml(lead.offerEnds) + '</div>'
      : '',
    '</div>',

    '<table style="width:100%;border-collapse:collapse;margin-top:20px">' + rows + '</table>',
  ];

  if (lead.comments) {
    out.push(
      '<div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e2e2">',
      '<div style="' + label + '">Comments</div>',
      '<div style="color:#1a1a1a;font:400 15px/1.6 ' + F + ';margin-top:8px">' +
        escapeHtml(lead.comments).replace(/\n/g, '<br>') + '</div>',
      '</div>'
    );
  }

  out.push(
    '<div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e2e2;color:#767676;font:400 13px/1.6 ' + F + '">',
    'Consent to contact: <strong>' + escapeHtml(lead.consent || 'Not given') + '</strong><br>',
    'Received ' + escapeHtml(received) + '<br>',
    'Reply directly to this email to reach the customer.',
    '</div>',
    '</div></div></div>'
  );

  return out.join('');
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const allowed = list(process.env.ALLOWED_ORIGINS || DEFAULTS.origins);
  const origin = req.headers.origin || '';
  const originOk = allowed.indexOf(origin) > -1;

  res.setHeader('Vary', 'Origin');
  if (originOk) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = originOk ? 204 : 403;
    return res.end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return send(res, 405, { success: false, message: 'POST only.' });
  }
  /* Browsers always send Origin on a cross-site POST, so a missing or
     foreign one is not the form. Not access control - a script can forge
     it - but it keeps other sites from borrowing this as their mailer. */
  if (!originOk) {
    return send(res, 403, { success: false, message: 'Not allowed from this site.' });
  }

  const body = await readBody(req);
  if (!body || typeof body !== 'object') {
    return send(res, 400, { success: false, message: 'Could not read the request.' });
  }

  /* The honeypot. Answer 200 so the bot believes it worked. */
  if (clean(body._honey, 200) !== '') {
    return send(res, 200, { success: true });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (!rateOk(ip)) {
    return send(res, 429, {
      success: false,
      message: 'Too many submissions from this connection. Please call us instead.',
    });
  }

  const lead = {};
  FIELDS.forEach(function (f) {
    lead[f[0]] = clean(body[f[0]], f[2], f[0] === 'comments');
  });
  lead.phone = lead.phone.replace(/[^0-9+()\-. x]/gi, '').trim();

  const missing = [];
  if (!lead.firstName) { missing.push('First name'); }
  if (!lead.lastName) { missing.push('Last name'); }
  if (!lead.phone) { missing.push('Phone'); }
  if (!EMAIL_RE.test(lead.email)) { missing.push('a valid email'); }
  if (lead.phone.replace(/\D/g, '').length < 7) { missing.push('a valid phone number'); }
  if (missing.length) {
    return send(res, 400, { success: false, message: 'Please check ' + missing.join(', ') + '.' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('gmi lead: RESEND_API_KEY is not set');
    return send(res, 503, { success: false, message: 'Mail is not configured.' });
  }

  const name = (lead.firstName + ' ' + lead.lastName).trim();
  const offer = lead.offerName || 'Golden Mile offer';
  const to = list(process.env.LEAD_TO || DEFAULTS.to).filter(function (a) { return EMAIL_RE.test(a); });
  const cc = list(process.env.LEAD_CC || DEFAULTS.cc).filter(function (a) {
    return EMAIL_RE.test(a) && to.indexOf(a) === -1;
  });
  if (!to.length) {
    console.error('gmi lead: LEAD_TO has no valid address');
    return send(res, 503, { success: false, message: 'Mail is not configured.' });
  }

  const message = {
    from: process.env.LEAD_FROM || DEFAULTS.from,
    to: to,
    reply_to: lead.email,
    subject: 'Offer request: ' + offer + ' - ' + name,
    text: buildText(lead),
    html: buildHtml(lead),
  };
  if (cc.length) { message.cc = cc; }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!r.ok) {
      /* Logged for the Vercel function log; never echoed to the visitor. */
      console.error('gmi lead: Resend answered ' + r.status + ' ' + (await r.text()).slice(0, 500));
      return send(res, 502, { success: false, message: 'Mail could not be sent.' });
    }
    const json = await r.json().catch(function () { return {}; });
    return send(res, 200, { success: true, delivered: true, id: json.id || null });
  } catch (err) {
    console.error('gmi lead: could not reach Resend - ' + (err && err.message));
    return send(res, 502, { success: false, message: 'Mail could not be sent.' });
  }
};
