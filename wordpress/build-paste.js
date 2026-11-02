/**
 * Build the paste-into-WordPress version.
 *
 * The plugin needs FTP or admin rights. This does not: each output file is
 * one self-contained block you paste into a Custom HTML block on a
 * WordPress page. The stylesheet and the script are inlined, so there is
 * nothing to upload and nothing to keep in sync afterwards.
 *
 *     node wordpress/build-paste.js
 *
 * Everything comes from the eDealer build, so a change there reaches all
 * three WordPress-facing outputs (plugin, paste blocks) by re-running this
 * and sync-from-edealer.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'edealer');
const OUT = path.join(ROOT, 'wordpress', 'paste');

/* Where the five creatives are served from. GitHub Pages by default; the
   readme explains swapping these for WordPress Media Library URLs, which is
   a single find-and-replace because every src shares this prefix. */
const IMG_BASE = 'https://apparatus9.github.io/golden-mile-incentive-page/assets';

fs.mkdirSync(OUT, { recursive: true });

const css = fs.readFileSync(path.join(SRC, 'gm-incentives.css'), 'utf8');

/* ---------- the script, with its config lifted to the top ---------- */
function buildScript() {
  let s = fs.readFileSync(path.join(SRC, 'gm-incentives.js'), 'utf8');

  const iife = s.indexOf('(function () {');
  if (iife === -1) throw new Error('IIFE not found');
  s = s.slice(iife);

  const start = s.indexOf('  /* ----------------------------------------------------------------\n     CONFIG');
  const end = s.indexOf('  /* ---------- offers page: countdown ---------- */');
  if (start === -1 || end === -1) throw new Error('config block not found');

  const config = `  /* ================================================================
     EDIT THESE TWO LINES

     Set them to the real permalinks of your two WordPress pages. They are
     the only things that must change for this to work on your site; every
     link on the page is rewritten from them.
     ================================================================ */
  var OFFERS_URL = '/offers/';        /* the page holding the offer cards  */
  var CLAIM_URL  = '/offers-claim/';  /* the page holding the claim form   */

  /* ----------------------------------------------------------------
     The rest only changes when the offers or the mailbox change.

     Leads go to LEAD_TO with LEAD_CC copied, through FormSubmit, which
     needs a one-time activation click sent to LEAD_TO before anything is
     delivered. Once activated, swap LEAD_TO for the hashed alias
     FormSubmit issues, so the address is not sitting in public HTML.

     EVENT_ENDS drives the countdown, which hides itself once the date has
     passed. Set it to '' to switch the countdown off.
  ---------------------------------------------------------------- */
  var LEAD_TO = 'ejay@goldenmilechrysler.ca';
  var LEAD_CC = 'mitch@goldenmilechrysler.ca';
  var PHONE = '647-288-5337';
  var PHONE_HREF = '+16472885337';
  var MAIL_ENDPOINT = 'https://formsubmit.co/ajax/' + LEAD_TO;
  var EVENT_ENDS = '2026-11-02T23:59:59-04:00';

  var OFFERS = ${JSON.stringify(offerMap(), null, 4).replace(/\n/g, '\n  ')};

  /* The cards carry a placeholder claim path so they still work if this
     script never runs. Point them at the real page, keeping the ?offer=. */
  var PLACEHOLDER = '/offers-claim';
  Array.prototype.forEach.call(
    document.querySelectorAll('a[href^="' + PLACEHOLDER + '"]'),
    function (a) {
      var href = a.getAttribute('href');
      a.setAttribute('href', CLAIM_URL + href.slice(PLACEHOLDER.length).replace(/^\\//, ''));
    }
  );

`;

  s = s.slice(0, start) + config + s.slice(end);

  s = s.replace(/resolvePath\(OFFERS_PATH\)/g, 'OFFERS_URL');
  s = s.replace(
    "  var countdown = document.getElementById('gmi-countdown');\n  if (countdown) {",
    "  var countdown = document.getElementById('gmi-countdown');\n  if (countdown && EVENT_ENDS) {"
  );
  s = s.replace(
    `        '<a href="tel:+16472885337">647-288-5337</a> or email ' +`,
    `        '<a href="tel:' + PHONE_HREF + '">' + PHONE + '</a> or email ' +`
  );

  const leftovers = ['PREVIEW_FILES', 'resolvePath', 'CLAIM_PATH', 'isPreview', 'github.io']
    .filter((t) => s.includes(t));
  if (leftovers.length) throw new Error('eDealer-only code left in: ' + leftovers.join(', '));

  return s;
}

/* The offer names and dates the claim form reads back, taken from the
   eDealer script so there is one source for them. */
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

/* ---------- assemble ---------- */
function build(fragmentName, outName, label) {
  let frag = fs.readFileSync(path.join(SRC, fragmentName), 'utf8');

  // the eDealer fragment links its CSS and JS from GitHub Pages; here they
  // are inlined, so those two tags go
  frag = frag
    .replace(/<link rel="stylesheet" href="https:\/\/apparatus9[^"]*">\n?/g, '')
    .replace(/<script src="https:\/\/apparatus9[^"]*"><\/script>\n?/g, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^"]*">\n?/g, '')
    .replace(/src="https:\/\/apparatus9[^"]*\/assets\//g, `src="${IMG_BASE}/`)
    .trim();

  const out = `<!--
  Golden Mile Chrysler - ${label}
  GENERATED by wordpress/build-paste.js. Do not edit here; edit the eDealer
  build and re-run it.

  HOW TO USE
  1. WordPress admin, edit the page, add a "Custom HTML" block.
  2. Paste this whole file into it. Nothing else on the page is needed.
  3. In the script near the bottom, set OFFERS_URL and CLAIM_URL to the real
     permalinks of your two pages.
  4. Publish.

  You must be an Administrator. WordPress strips style and script tags out
  of the Custom HTML block for any user without the unfiltered_html
  capability, and on multisite only Super Admins have it. If the page comes
  out unstyled, that is why - use the plugin in
  wordpress/golden-mile-incentives instead.

  IMAGES are served from GitHub Pages. To serve them from your own Media
  Library instead, upload the five .webp files and replace every
    ${IMG_BASE}
  with the Media Library URL. They all share that prefix, so it is one
  find-and-replace.
-->

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap">

<style>
${css.trim()}

/* ---------- WordPress ----------
   The editor wraps loose markup in its own <p> tags, themes put margins on
   everything, and some themes underline every link in content. Scoped to
   .gmi so none of this reaches the rest of the site. */
.gmi p:empty{display:none}
.gmi br:only-child{display:none}
.gmi *{box-sizing:border-box}
.gmi ul,.gmi ol{list-style:none;margin:0;padding:0}
.gmi li{margin:0;padding:0}
.gmi a,.gmi button{box-shadow:none}
.gmi .gmi-btn{text-decoration:none}
.gmi img{max-width:100%;height:auto;display:block;border-radius:0;box-shadow:none;border:0}
.gmi h1,.gmi h2,.gmi h3{padding:0}
.gmi details{border:0;padding:0;background:none}
.gmi details>summary{display:inline-block;background:none}
.gmi details>summary::marker,.gmi details>summary::-webkit-details-marker{display:none;content:""}
.gmi input,.gmi select,.gmi textarea,.gmi button{border-radius:0;box-shadow:none}

/* Themes colour every link in the content area, and '.entry-content a'
   outranks a single '.gmi' class. The doubled class wins that without
   resorting to !important. */
.gmi.gmi a:not(.gmi-btn){color:inherit}
.gmi.gmi .gmi-btn{color:#fff;text-decoration:none}
.gmi.gmi .gmi-btn-ghost{color:#000}
.gmi.gmi .gmi-btn:hover{color:#fff}
.gmi.gmi .gmi-btn-ghost:hover{color:#000}
.gmi.gmi .gmi-status,.gmi.gmi .gmi-status a,.gmi.gmi .gmi-req{color:var(--gm-red)}
.gmi.gmi .gmi-count-n{color:var(--gm-red)}
.gmi .gmi-field :is(input,select,textarea):focus{box-shadow:0 0 0 3px rgba(202,0,0,.14)}
</style>

${frag}

<script>
${buildScript()}
</script>
`;

  fs.writeFileSync(path.join(OUT, outName), out);
  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(0);
  console.log('  ' + outName.padEnd(22) + kb + ' KB');
}

console.log('wordpress/paste/');
build('offers.html', 'offers-block.html', 'offers page');
build('claim.html', 'claim-block.html', 'claim form page');
console.log('\nPaste each file into a Custom HTML block, then set OFFERS_URL and CLAIM_URL.');
