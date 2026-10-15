/* Golden Mile incentives - eDealer embed behaviour.
   Served from GitHub Pages and referenced with <script src>, so the offers
   and claim pages inside eDealer stay as plain markup. Safe to load on both
   pages: each block no-ops if its elements are not on the page. */
(function () {
  'use strict';

  /* ----------------------------------------------------------------
     CONFIG

     OFFERS_PATH is the eDealer path of the offers page. It is used for
     the "see all offers" links on the claim page, and for the link shown
     to anyone who lands on the claim page without picking an offer.

     The claim page path is NOT set here - the offer cards link to it
     directly in the offers-page markup, so the buttons still work if this
     script ever fails to load. If eDealer gives the pages different slugs
     than planned, update OFFERS_PATH here and the six card hrefs there.

     Leads are emailed to LEAD_TO with LEAD_CC copied, through FormSubmit.
     FormSubmit needs a one-time activation click sent to LEAD_TO before
     anything is delivered. Once activated, swap LEAD_TO for the hashed
     alias FormSubmit issues, so the address is not sitting in public HTML.
  ---------------------------------------------------------------- */
  var OFFERS_PATH = '/offers';
  var LEAD_TO = 'ejay@goldenmilechrysler.ca';
  var LEAD_CC = 'mitch@goldenmilechrysler.ca';
  var MAIL_ENDPOINT = 'https://formsubmit.co/ajax/' + LEAD_TO;
  var EVENT_ENDS = '2026-11-02T23:59:59-04:00';

  var OFFERS = {
    'wrangler':         { name: '0% Financing — 2026 Jeep Wrangler 4-Door Rubicon', ends: 'Offer ends November 2, 2026' },
    'ram':              { name: '0% Financing — 2026 Ram 1500 Big Horn Crew Cab 4x4', ends: 'Offer ends November 2, 2026' },
    'cherokee':         { name: '1.99% Lease — 2026 Jeep Cherokee', ends: 'Offer ends November 2, 2026' },
    'loyalty':          { name: 'Double Loyalty — up to $3,000 Savings', ends: 'Offer ends November 2, 2026' },
    'accessories':      { name: '$1,000 No-Charge Accessories — 2026/2027 Ram', ends: 'Offer ends October 31, 2026' },
    'first-responders': { name: 'First Responder Preferred Pricing', ends: 'Ongoing program' }
  };

  /* ---------- offers page: countdown ---------- */
  var countdown = document.getElementById('gmi-countdown');
  if (countdown) {
    var daysLeft = Math.ceil((new Date(EVENT_ENDS) - new Date()) / 86400000);
    if (daysLeft > 0) {
      countdown.innerHTML = 'All-Out Clearout ends in <b>' + daysLeft + '</b> ' +
        (daysLeft === 1 ? 'day' : 'days');
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
      a.setAttribute('href', OFFERS_PATH);
    });
    if (gate) { gate.classList.add('is-on'); }
    return;
  }

  document.getElementById('gmi-chosen-name').textContent = offer.name;
  document.getElementById('gmi-chosen-ends').textContent = offer.ends;
  document.getElementById('gmi-offer-key').value = key;
  Array.prototype.forEach.call(document.querySelectorAll('.gmi-offers-link'), function (a) {
    a.setAttribute('href', OFFERS_PATH);
  });

  /* Only the eligibility questions belonging to this offer. */
  Array.prototype.forEach.call(document.querySelectorAll('.gmi-conditional'), function (block) {
    block.classList.toggle('is-on', block.getAttribute('data-for') === key);
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
      'First responder role': data.responderRole,
      'Service or employer': data.responderEmployer,
      'Accessories wanted': data.accessories,
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
