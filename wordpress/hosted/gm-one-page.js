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
      groups.push(intro.querySelectorAll('.gmi-kicker, h1, .gmi-lede, .gmi-hero-facts, .gmi-countdown'));
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
  var LEAD_CC = 'mitch@goldenmilechrysler.ca,nav@goldenmilechrysler.ca';
  var PHONE = '647-288-5337';
  var PHONE_HREF = '+16472885337';
  var MAIL_ENDPOINT = 'https://formsubmit.co/ajax/' + LEAD_TO;
  /* Deliver through the site itself, which is what puts the lead in
     Offer Leads and sends it with wp_mail() - and therefore through
     whatever SMTP provider WordPress is configured with. Relative on
     purpose: it resolves against the site this block is pasted into.
     If the plugin is not installed the path 404s and the script falls
     back to FormSubmit, so leads keep arriving either way. */
  var LEAD_URL = '/wp-json/gmi/v1/lead';
  var EVENT_ENDS = '2026-11-30T23:59:59-05:00';
  var OFFERS = {
      "durango": {
          "name": "Up to $10,000 in Total Incentives — 2026 Dodge Durango",
          "ends": "Offer ends November 30, 2026"
      },
      "compass": {
          "name": "Up to $7,500 in Total Incentives — 2026 Jeep Compass",
          "ends": "Offer ends November 30, 2026"
      },
      "wrangler": {
          "name": "0% Financing for 84 Months + $4,500 in Black Friday Incentives — 2026 Jeep Wrangler 4-Door Rubicon 2.0L",
          "ends": "Offer ends November 30, 2026"
      },
      "grand-cherokee": {
          "name": "0% Financing for up to 72 Months + $4,500 in Black Friday Incentives — 2026 Jeep Grand Cherokee Summit 4x4",
          "ends": "Offer ends November 30, 2026"
      },
      "cherokee": {
          "name": "1.99% Lease for up to 24 Months — All-New 2026 Jeep Cherokee Hybrid",
          "ends": "Offer ends November 30, 2026"
      },
      "ram-1500": {
          "name": "0% Financing for 84 Months + Up to $5,000 Loyalty Bonus Cash — 2026 Ram 1500 Big Horn & RHO Crew Cab 4x4",
          "ends": "Offer ends November 30, 2026"
      },
      "ram-hd": {
          "name": "No-Charge Cummins Turbo Diesel ($11,000 Total Value) + $1,500 Loyalty Bonus Cash — 2026 Ram Heavy Duty Pickup",
          "ends": "Offer ends November 30, 2026"
      },
      "pacifica": {
          "name": "0% Financing for 36 Months or Lease from 3.99% — 2027 Chrysler Pacifica",
          "ends": "Offer ends November 30, 2026"
      },
      "grand-caravan": {
          "name": "Starting at $50,995 — 2027 Chrysler Grand Caravan",
          "ends": "Offer ends November 30, 2026"
      }
  };
  /* ---------- countdown ---------- */
  var countdown = document.getElementById('gmi-countdown');
  if (countdown && EVENT_ENDS) {
    var daysLeft = Math.ceil((new Date(EVENT_ENDS) - new Date()) / 86400000);
    if (daysLeft > 0) {
      countdown.innerHTML = '<span class="gmi-count-n">' + daysLeft + '</span>' +
        '<span class="gmi-count-l">' + (daysLeft === 1 ? 'day' : 'days') +
        ' left in the Black Friday Sales Event</span>';
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
      var owners = (block.getAttribute('data-for') || '').split(/\s+/);
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
      _subject: 'Offer request: ' + current().name + ' - ' + data.firstName + ' ' + data.lastName,
      _cc: LEAD_CC,
      /* FormSubmit reads Reply-To from _replyto only. Without it, hitting
         Reply in the inbox answers FormSubmit instead of the customer. */
      _replyto: data.email,
      _template: 'table',
      _captcha: 'false',
      _honey: data._honey || '',
      'Offer': current().name,
      'Offer ends': current().ends,
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
  /* The same answers, keyed the way the WordPress endpoint wants them.
     It labels and formats the mail itself, so what travels here is the
     raw form, not a pre-rendered email. */
  function buildLead(data) {
    return {
      offerName: current().name,
      offerEnds: current().ends,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      contactMethod: data.contactMethod,
      vehicle: data.vehicle,
      timeline: data.timeline,
      tradeIn: data.tradeIn,
      financeType: data.financeType,
      loyaltyVehicle: data.loyaltyVehicle,
      loyaltySince: data.loyaltySince,
      comments: data.comments,
      consent: form.consent.checked ? 'Yes' : 'No',
      pageUrl: window.location.href,
      _honey: data._honey || ''
    };
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
    /* When the WordPress plugin is active it prints its own endpoint, and
       that is always the better one: the lead is recorded on the site
       before any mail is attempted, so a mail server having a bad day
       cannot lose it. FormSubmit is the fallback for the builds that have
       no server behind them - the standalone page and the eDealer CMS. */
    /* LEAD_URL is set by the WordPress paste builds, which are pasted into a
       page the plugin did not render, so window.GMI_LEAD is not there to find.
       It is a relative path, so it resolves against whatever site the block
       is pasted into and carries no hostname to get stale. */
    var endpoint = (window.GMI_LEAD && window.GMI_LEAD.url) || LEAD_URL || MAIL_ENDPOINT;
    function send(url, isLast) {
      var onSite = url !== MAIL_ENDPOINT;
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(onSite ? buildLead(data) : buildEmail(data))
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok || String(json.success) === 'false') {
            throw new Error(json.message || 'HTTP ' + res.status);
          }
          form.classList.add('gmi-hidden');
          successMsg.textContent = 'Thanks ' + data.firstName + ' — your request for the ' +
            current().name + ' offer is in. A Golden Mile product advisor will contact you by ' +
            String(data.contactMethod).toLowerCase() + ' shortly.';
          success.classList.add('is-on');
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }).catch(function (err) {
        /* The on-site route is only there once the plugin is installed. Until
           then the path 404s, and a lead is far too expensive to drop over a
           deployment step, so fall back to FormSubmit and let the visitor see
           the same success they would have seen. */
        if (!isLast) { return send(MAIL_ENDPOINT, true); }
        throw err;
      });
    }
    send(endpoint, endpoint === MAIL_ENDPOINT).catch(function () {
      submit.disabled = false;
      submit.textContent = 'Send My Request';
      status.innerHTML = 'Sorry — that did not go through. Please call ' +
        '<a href="tel:' + PHONE_HREF + '">' + PHONE + '</a> or email ' +
        '<a href="mailto:' + LEAD_TO + '">' + LEAD_TO + '</a>, and we will pick it up from there.';
    });
  });
}());
