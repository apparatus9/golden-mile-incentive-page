/**
 * Build the one-page WordPress block: the offer cards and the claim form on
 * a single page, with each Claim button scrolling down to the form and
 * selecting that offer.
 *
 *     node wordpress/build-onepage.js
 *
 * Why this and not the two-page pair: on WordPress the two-page version
 * needs a second page created, its permalink pasted into two places, and
 * the claim page set to noindex. This needs none of that - one Custom HTML
 * block on one page, nothing to configure.
 *
 * Everything is taken from the eDealer build, so this stays in step with
 * the other outputs. Re-run after any change there.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'edealer');
const OUT = path.join(ROOT, 'wordpress', 'paste');

const IMG_BASE = 'https://apparatus9.github.io/golden-mile-incentive-page/assets';

fs.mkdirSync(OUT, { recursive: true });

/* ---------- the offer list, from the eDealer script ---------- */
function offerMap() {
  const js = fs.readFileSync(path.join(SRC, 'gm-incentives.js'), 'utf8');
  const block = js.match(/var OFFERS = \{([\s\S]*?)\n  \};/);
  if (!block) throw new Error('OFFERS map not found');
  const map = {};
  for (const m of block[1].matchAll(/'([a-z-]+)':\s*\{ name: '(.*?)', ends: '(.*?)' \}/g)) {
    map[m[1]] = { name: m[2], ends: m[3] };
  }
  if (!Object.keys(map).length) throw new Error('no offers parsed');
  return map;
}

/* ---------- the cards ---------- */
function offersSection() {
  let s = fs.readFileSync(path.join(SRC, 'offers.html'), 'utf8');

  s = s
    .replace(/<link rel="stylesheet"[^>]*>\n?/g, '')
    .replace(/<script src="[^"]*"><\/script>\n?/g, '')
    .replace(/src="https:\/\/apparatus9[^"]*\/assets\//g, `src="${IMG_BASE}/`);

  // the Claim buttons stay on the page now: an anchor to the form, which
  // works with no script at all, plus the key for the script to read
  s = s.replace(
    /<a class="gmi-btn" href="\/offers-claim\?offer=([a-z-]+)">([^<]*)<\/a>/g,
    '<a class="gmi-btn gmi-claim-link" href="#gmi-claim" data-offer="$1">$2</a>'
  );

  // the legal note belongs once, at the very bottom, under the form
  s = s.replace(/<p class="gmi-legal">[\s\S]*?<\/p>\n?/, '');

  // Unwrap: we re-wrap the whole page ourselves. Trim first — stripping the
  // <link> tags above leaves a leading newline, and an anchored regex then
  // quietly fails to match, leaving a second .gmi wrapper nested inside ours
  // and the div count unbalanced. Assert rather than silently skip.
  s = s.trim();
  const opened = /^<div class="gmi">\s*<div class="gmi-wrap">\s*/;
  const closed = /\s*<\/div>\s*<\/div>$/;
  if (!opened.test(s) || !closed.test(s)) {
    throw new Error('offers.html wrapper is not where expected — check edealer/offers.html');
  }
  s = s.replace(opened, '').replace(closed, '');

  return s.trim();
}

/* ---------- the form, with the gate replaced by a select ---------- */
function formSection(offers) {
  let s = fs.readFileSync(path.join(SRC, 'claim.html'), 'utf8');

  s = s
    .replace(/<link rel="stylesheet"[^>]*>\n?/g, '')
    .replace(/<script src="[^"]*"><\/script>\n?/g, '');

  // keep only the inside of the claim wrapper
  const open = s.indexOf('<div class="gmi-claimwrap" id="gmi-claimwrap">');
  if (open === -1) throw new Error('claimwrap not found');
  s = s.slice(open + '<div class="gmi-claimwrap" id="gmi-claimwrap">'.length);
  const close = s.indexOf('<p class="gmi-legal">');
  if (close === -1) throw new Error('legal note not found');
  s = s.slice(0, close);
  // The slice already balances: .gmi-claimwrap is closed after the legal
  // note, not before it, so everything opened inside this slice is also
  // closed inside it. Stripping a trailing </div> here would remove the one
  // that closes .gmi-formcard.
  s = s.trim();

  // the page already carries an h1
  s = s.replace('<h1>Claim Your Offer</h1>', '<h2>Claim Your Offer</h2>');

  // no second page to come from, so the offer is picked here
  const options = Object.entries(offers)
    .map(([k, o]) => `<option value="${k}">${o.name}</option>`)
    .join('\n');

  s = s.replace(
    '<input type="hidden" name="offer" id="gmi-offer-key" value="">',
    '<!-- the select below carries the offer -->'
  );

  // the "not this one? see all offers" link pointed at the other page
  s = s.replace(
    /<a class="gmi-offers-link" href="\/offers">Not this one\? See all offers<\/a>/,
    '<a class="gmi-offers-link" href="#gmi-offers">Not this one? Back to the offers</a>'
  );

  s = s.replace(
    '<div class="gmi-grid">',
    `<div class="gmi-grid">

<div class="gmi-field gmi-field-full">
<label for="gmi-offer-select">Which offer are you claiming? <span class="gmi-req">*</span></label>
<select id="gmi-offer-select" name="offer" required>
<option value="">Select an offer&hellip;</option>
${options}
<option value="other">Something else / not sure yet</option>
</select>
</div>`
  );

  return s.trim();
}

/* ---------- the script ---------- */
function script(offers) {
  const src = fs.readFileSync(path.join(SRC, 'gm-incentives.js'), 'utf8');

  // reuse the motion layer verbatim
  const mStart = src.indexOf('  /* ---------- motion ----------');
  const mEnd = src.indexOf('  /* ----------------------------------------------------------------\n     CONFIG');
  if (mStart === -1 || mEnd === -1) throw new Error('motion block not found');
  const motion = src.slice(mStart, mEnd).trimEnd();

  // and the submit handler, with the offer read from the select
  const sStart = src.indexOf('  function collect() {');
  if (sStart === -1) throw new Error('collect() not found');
  let tail = src.slice(sStart);
  tail = tail.replace(/\n\}\)\(\);\s*$/, '\n');
  tail = tail.replace(/\boffer\.name\b/g, 'current().name');
  tail = tail.replace(/\boffer\.ends\b/g, 'current().ends');
  tail = tail.replace(
    "        '<a href=\"tel:+16472885337\">647-288-5337</a> or email ' +",
    "        '<a href=\"tel:' + PHONE_HREF + '\">' + PHONE + '</a> or email ' +"
  );

  return `(function () {
  'use strict';

${motion}

  /* ================================================================
     CONFIG

     Nothing here has to change for the page to work. Leads go to LEAD_TO
     with LEAD_CC copied, through FormSubmit, which needs a one-time
     activation click sent to LEAD_TO before anything is delivered. Once
     activated, swap LEAD_TO for the hashed alias FormSubmit issues, so the
     address is not sitting in public HTML.

     EVENT_ENDS drives the countdown, which hides itself once the date has
     passed. Set it to '' to switch the countdown off.
     ================================================================ */
  var LEAD_TO = 'ejay@goldenmilechrysler.ca';
  var LEAD_CC = 'mitch@goldenmilechrysler.ca';
  var PHONE = '647-288-5337';
  var PHONE_HREF = '+16472885337';
  var MAIL_ENDPOINT = 'https://formsubmit.co/ajax/' + LEAD_TO;
  var EVENT_ENDS = '2026-11-02T23:59:59-04:00';

  var OFFERS = ${JSON.stringify(offers, null, 4).replace(/\n/g, '\n  ')};

  /* ---------- countdown ---------- */
  var countdown = document.getElementById('gmi-countdown');
  if (countdown && EVENT_ENDS) {
    var daysLeft = Math.ceil((new Date(EVENT_ENDS) - new Date()) / 86400000);
    if (daysLeft > 0) {
      countdown.innerHTML = '<span class="gmi-count-n">' + daysLeft + '</span>' +
        '<span class="gmi-count-l">' + (daysLeft === 1 ? 'day' : 'days') +
        ' left in the All-Out Clearout</span>';
    }
  }

  /* ---------- the form ---------- */
  var form = document.getElementById('gmi-form');
  if (!form) { return; }

  var select = document.getElementById('gmi-offer-select');
  var chosenName = document.getElementById('gmi-chosen-name');
  var chosenEnds = document.getElementById('gmi-chosen-ends');
  var status = document.getElementById('gmi-status');
  var submit = document.getElementById('gmi-submit');
  var success = document.getElementById('gmi-success');
  var successMsg = document.getElementById('gmi-success-msg');
  var conditionals = Array.prototype.slice.call(document.querySelectorAll('.gmi-conditional'));

  function current() {
    return OFFERS[select.value] ||
      { name: select.value === 'other' ? 'Something else / not sure yet' : '', ends: '' };
  }

  /* Name the offer back to them, and show only the eligibility questions
     that belong to it. A conditional block can serve several offers, so
     data-for holds a space-separated list. */
  function syncOffer() {
    var key = select.value;
    var offer = current();
    chosenName.textContent = offer.name || 'Choose an offer below';
    chosenEnds.textContent = offer.ends || '';
    conditionals.forEach(function (block) {
      var owners = (block.getAttribute('data-for') || '').split(/\\s+/);
      block.classList.toggle('is-on', owners.indexOf(key) > -1);
    });
  }

  select.addEventListener('change', function () {
    syncOffer();
    status.textContent = '';
  });

  /* The Claim buttons are anchors to the form, so they work with no script
     at all. With script, they also pick the offer on the way down. */
  Array.prototype.forEach.call(document.querySelectorAll('.gmi-claim-link'), function (a) {
    a.addEventListener('click', function () {
      var key = a.getAttribute('data-offer');
      if (OFFERS[key]) {
        select.value = key;
        syncOffer();
      }
    });
  });

  /* ?offer=key still works, for an ad or an email pointed at one offer. */
  var deep = new URLSearchParams(window.location.search).get('offer') ||
    window.location.hash.replace('#', '');
  if (deep && OFFERS[deep]) { select.value = deep; }
  syncOffer();

${tail}}());
`;
}

/* ---------- assemble ---------- */
const offers = offerMap();
const css = fs.readFileSync(path.join(SRC, 'gm-incentives.css'), 'utf8').trim();

const legal = (fs.readFileSync(path.join(SRC, 'offers.html'), 'utf8')
  .match(/<p class="gmi-legal">[\s\S]*?<\/p>/) || [''])[0];

const out = `<!--
  Golden Mile Chrysler - offers and claim form, ONE PAGE
  GENERATED by wordpress/build-onepage.js. Do not edit here; edit the
  eDealer build and re-run it.

  HOW TO USE
  1. WordPress admin, edit the page, add a "Custom HTML" block.
  2. Paste this whole file into it.
  3. Publish. There is nothing to configure.

  Each "Claim This Offer" button scrolls down to the form at the bottom of
  the same page and selects that offer. No second page, no permalinks to
  set, nothing to mark noindex.

  You must be an Administrator. WordPress strips style and script tags out
  of the Custom HTML block for any user without the unfiltered_html
  capability, and on multisite only Super Admins have it. If the page comes
  out unstyled, that is why.

  IMAGES are served from GitHub Pages. To serve them from your own Media
  Library instead, upload the five .webp files and replace every
    ${IMG_BASE}
  with the Media Library URL. They all share that prefix, so it is one
  find-and-replace.

  LEADS will not be delivered until FormSubmit is activated - send one test
  submission, click the link it emails to ${'ejay@goldenmilechrysler.ca'}, then send a
  second and confirm it arrives.
-->

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap">

<style>
${css}

/* ---------- one-page build ---------- */
.gmi-claim{padding-top:10px;scroll-margin-top:24px}
.gmi-claim h2{font-family:var(--gm-head);font-weight:600;
  font-size:clamp(32px,4.2vw,56px);line-height:.98;letter-spacing:-.015em;
  text-transform:uppercase;margin:0 0 18px;color:#000}
.gmi-claim-intro{font-size:19px;line-height:1.55;color:#000;margin:0 0 30px;max-width:54ch}
</style>

<div class="gmi">
<div class="gmi-wrap">

<div id="gmi-offers"></div>
${offersSection()}

<div class="gmi-claim" id="gmi-claim">
${formSection(offers)}
</div>

${legal}

</div>
</div>

<script>
${script(offers)}
</script>
`;

/* Unbalanced markup is the one failure that presents as a styling bug: the
   WordPress editor silently rebalances broken HTML, moving or dropping
   nodes, and the page renders with the .gmi wrapper — and therefore every
   CSS custom property defined on it — no longer around the content. The
   result is a page with the layout applied but no colours and no card
   backgrounds. Fail the build instead of shipping that. */
const checkMarkup = out
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<style>[\s\S]*?<\/style>/g, '')
  .replace(/<script>[\s\S]*?<\/script>/g, '');
const opens = (checkMarkup.match(/<div\b/g) || []).length;
const closes = (checkMarkup.match(/<\/div>/g) || []).length;
if (opens !== closes) {
  throw new Error('unbalanced markup: ' + opens + ' <div> vs ' + closes + ' </div>');
}
const wrappers = (checkMarkup.match(/<div class="gmi">/g) || []).length;
if (wrappers !== 1) {
  throw new Error('expected exactly one .gmi wrapper, found ' + wrappers);
}

const target = path.join(OUT, 'one-page-block.html');
fs.writeFileSync(target, out);
console.log('wordpress/paste/');
console.log('  one-page-block.html   ' + (Buffer.byteLength(out, 'utf8') / 1024).toFixed(0) + ' KB');
console.log('\nOne Custom HTML block, one page, nothing to configure.');
