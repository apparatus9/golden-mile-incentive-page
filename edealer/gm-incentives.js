/* Golden Mile incentives - eDealer embed behaviour.
   Served from GitHub Pages and referenced with <script src>, so the offers
   and claim pages inside eDealer stay as plain markup. Safe to load on both
   pages: each block no-ops if its elements are not on the page. */
(function () {
  'use strict';

  /* ---------- motion ----------
     Nothing is hidden until the flag is set, so a failed script leaves a
     complete page. Parts of each section rise in on their own short delay;
     the observer disconnects once everything has appeared. */
  var motionRoot = document.querySelector('.gmi');
  if (motionRoot && 'IntersectionObserver' in window &&
      motionRoot.querySelector('.gmi-offer')) {
    motionRoot.classList.add('gmi-motion');

    var groups = [];
    var intro = motionRoot.querySelector('.gmi-intro, .gmi-hero');
    if (intro) {
      groups.push(intro.querySelectorAll('h1, .gmi-lede, .gmi-countdown'));
    }
    Array.prototype.forEach.call(motionRoot.querySelectorAll('.gmi-offer'), function (card) {
      groups.push([
        card.querySelector('.gmi-offer-img'),
        card.querySelector('.gmi-offer-main'),
        card.querySelector('.gmi-offer-cta')
      ]);
    });

    var watched = [];
    groups.forEach(function (group) {
      var step = 0;
      Array.prototype.forEach.call(group, function (el) {
        if (!el) { return; }
        el.classList.add('gmi-rise');
        el.style.transitionDelay = (step * 0.09).toFixed(2) + 's';
        watched.push(el);
        step++;
      });
    });

    var seen = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
        if (++seen >= watched.length) { io.disconnect(); }
      });
    }, { rootMargin: '0px', threshold: 0.01 });

    watched.forEach(function (el) { io.observe(el); });

    /* Safety net: reveal whatever is on screen now and on every scroll,
       so nothing is left invisible if the observer never fires for it
       (a short page can leave its last elements untriggered). */
    function sweep() {
      var pending = 0;
      watched.forEach(function (el) {
        if (el.classList.contains('is-in')) { return; }
        if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); }
        else { pending++; }
      });
      if (!pending) { window.removeEventListener('scroll', sweep); }
    }
    requestAnimationFrame(sweep);
    window.addEventListener('scroll', sweep, { passive: true });
  }

  /* ----------------------------------------------------------------
     CONFIG

     OFFERS_PATH is the eDealer path of the offers page. It is used for
     the "see all offers" links on the claim page, and for the link shown
     to anyone who lands on the claim page without picking an offer.

     CLAIM_PATH is the eDealer path of the claim page. The offer cards also
     carry it directly in the offers-page markup, so the buttons still work
     if this script ever fails to load. If eDealer gives the pages different
     slugs than planned, update both paths here and the six card hrefs there.

     Off eDealer - the GitHub Pages preview or a local file - those root
     paths do not resolve, so every link to them is rewritten to the sibling
     .html file. That keeps the pages clickable while we review them without
     changing what gets imported.

     Leads are emailed to LEAD_TO with LEAD_CC copied, through FormSubmit.
     FormSubmit needs a one-time activation click sent to LEAD_TO before
     anything is delivered. Once activated, swap LEAD_TO for the hashed
     alias FormSubmit issues, so the address is not sitting in public HTML.
  ---------------------------------------------------------------- */
  var OFFERS_PATH = '/offers';
  var CLAIM_PATH = '/offers-claim';
  var LEAD_TO = 'ejay@goldenmilechrysler.ca';
  var LEAD_CC = 'mitch@goldenmilechrysler.ca';
  var MAIL_ENDPOINT = 'https://formsubmit.co/ajax/' + LEAD_TO;
  var EVENT_ENDS = '2026-11-02T23:59:59-04:00';

  var OFFERS = {
    'durango':          { name: 'Up to $10,000 in Total Incentives — 2026 Dodge Durango', ends: 'Offer ends November 2, 2026' },
    'compass':          { name: 'Up to $7,500 in Total Incentives — 2026 Jeep Compass', ends: 'Offer ends November 2, 2026' },
    'wrangler':         { name: '0% Financing for 84 Months + $1,500 Loyalty — 2026 Jeep Wrangler 4-Door Rubicon', ends: 'Offer ends November 2, 2026' },
    'grand-cherokee':   { name: '0% Financing for up to 72 Months + $1,500 Loyalty — 2026 Jeep Grand Cherokee Summit', ends: 'Offer ends November 2, 2026' },
    'cherokee':         { name: '1.99% Lease for up to 24 Months — All-New 2026 Jeep Cherokee Hybrid', ends: 'Offer ends November 2, 2026' }
  };

  /* ---------- link paths ---------- */
  /* Inside eDealer the root paths are real pages. In the GitHub Pages
     preview or a local file they are not, so swap them for the sibling
     files and leave the markup alone. */
  var PREVIEW_FILES = {};
  PREVIEW_FILES[OFFERS_PATH] = 'offers.html';
  PREVIEW_FILES[CLAIM_PATH] = 'claim.html';

  var isPreview = window.location.protocol === 'file:' ||
    window.location.hostname.indexOf('github.io') > -1;

  function resolvePath(path) {
    return isPreview && PREVIEW_FILES[path] ? PREVIEW_FILES[path] : path;
  }

  /* The offer cards point at CLAIM_PATH with the offer key attached. Keep
     the query string, move only the path in front of it. */
  Array.prototype.forEach.call(
    document.querySelectorAll('a[href^="' + CLAIM_PATH + '"]'),
    function (a) {
      var href = a.getAttribute('href');
      a.setAttribute('href', resolvePath(CLAIM_PATH) + href.slice(CLAIM_PATH.length));
    }
  );

  /* ---------- offers page: countdown ---------- */
  var countdown = document.getElementById('gmi-countdown');
  if (countdown) {
    var daysLeft = Math.ceil((new Date(EVENT_ENDS) - new Date()) / 86400000);
    if (daysLeft > 0) {
      countdown.innerHTML = '<span class="gmi-count-n">' + daysLeft + '</span>' +
        '<span class="gmi-count-l">' + (daysLeft === 1 ? 'day' : 'days') +
        ' left in the All-Out Clearout</span>';
    }
  }

  /* ---------- claim page ---------- */
  var form = document.getElementById('gmi-form');
  if (!form) { return; }

  var gate = document.getElementById('gmi-gate');
  var claimwrap = document.getElementById('gmi-claimwrap');
  var status = document.getElementById('gmi-status');
  var submit = document.getElementById('gmi-submit');
  var success = document.getElementById('gmi-success');
  var successMsg = document.getElementById('gmi-success-msg');

  /* Which offer did they arrive with? Accept ?offer=key, and #key as a
     fallback in case eDealer strips the query string from internal links. */
  var params = new URLSearchParams(window.location.search);
  var key = params.get('offer') || window.location.hash.replace('#', '');
  var offer = OFFERS[key];

  /* No valid offer means they did not come through an offer button. Show
     the way back instead of a form with nothing attached to it. This is a
     usability gate, not access control - the page is public either way. */
  if (!offer) {
    Array.prototype.forEach.call(document.querySelectorAll('.gmi-offers-link'), function (a) {
      a.setAttribute('href', resolvePath(OFFERS_PATH));
    });
    if (gate) { gate.classList.add('is-on'); }
    return;
  }

  document.getElementById('gmi-chosen-name').textContent = offer.name;
  document.getElementById('gmi-chosen-ends').textContent = offer.ends;
  document.getElementById('gmi-offer-key').value = key;
  Array.prototype.forEach.call(document.querySelectorAll('.gmi-offers-link'), function (a) {
    a.setAttribute('href', resolvePath(OFFERS_PATH));
  });

  /* Only the eligibility questions belonging to this offer. */
  Array.prototype.forEach.call(document.querySelectorAll('.gmi-conditional'), function (block) {
    var owners = (block.getAttribute('data-for') || '').split(/\s+/);
    block.classList.toggle('is-on', owners.indexOf(key) > -1);
  });

  if (claimwrap) { claimwrap.classList.add('is-on'); }

  function collect() {
    var data = {};
    new FormData(form).forEach(function (value, name) { data[name] = value; });
    return data;
  }

  /* Keys become the row labels in the delivered email, so they read as
     plain English. Empty rows are dropped to keep the mail short, and the
     eligibility answers for other offers are never in the DOM to begin with. */
  function buildEmail(data) {
    var body = {
      _subject: 'Offer request: ' + offer.name + ' - ' + data.firstName + ' ' + data.lastName,
      _cc: LEAD_CC,
      _template: 'table',
      _captcha: 'false',
      _honey: data._honey || '',
      'Offer': offer.name,
      'Offer ends': offer.ends,
      'Name': data.firstName + ' ' + data.lastName,
      'Email': data.email,
      'Phone': data.phone,
      'Preferred contact': data.contactMethod,
      'Vehicle of interest': data.vehicle,
      'Purchase timeline': data.timeline,
      'Trade-in': data.tradeIn,
      'Buying method': data.financeType,
      'Currently owns': data.loyaltyVehicle,
      'Registered since': data.loyaltySince,
      'Comments': data.comments,
      'Consent to contact': form.consent.checked ? 'Yes' : 'No',
      'Submitted': new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
      'Page': window.location.href
    };
    Object.keys(body).forEach(function (k) {
      if (body[k] === undefined || body[k] === null || body[k] === '') { delete body[k]; }
    });
    return body;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';

    if (!form.checkValidity()) {
      var firstBad = form.querySelector(':invalid');
      status.textContent = 'Please complete the highlighted fields before sending.';
      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    var data = collect();
    submit.disabled = true;
    submit.textContent = 'Sending…';

    fetch(MAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildEmail(data))
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok || String(json.success) === 'false') {
          throw new Error(json.message || 'HTTP ' + res.status);
        }
        form.classList.add('gmi-hidden');
        successMsg.textContent = 'Thanks ' + data.firstName + ' — your request for the ' +
          offer.name + ' offer is in. A Golden Mile product advisor will contact you by ' +
          String(data.contactMethod).toLowerCase() + ' shortly.';
        success.classList.add('is-on');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }).catch(function () {
      submit.disabled = false;
      submit.textContent = 'Send My Request';
      status.innerHTML = 'Sorry — that did not go through. Please call ' +
        '<a href="tel:+16472885337">647-288-5337</a> or email ' +
        '<a href="mailto:' + LEAD_TO + '">' + LEAD_TO + '</a>, and we will pick it up from there.';
    });
  });
})();
