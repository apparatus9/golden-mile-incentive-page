# Golden Mile — Incentive Page

A single-page offers/incentives landing page for Golden Mile Chrysler Dodge Jeep Ram.
Seven live offers, each with a "Claim This Offer" button that drops the visitor into one
form with that offer already selected and the eligibility questions for it revealed.

There are **three builds** of the same thing:

```
index.html              STANDALONE — one page, offers + form together.
                        Inline CSS/JS, no dependencies. Open it off disk and it runs.

edealer/offers.html     EDEALER — two pages. Paste these into two eDealer
edealer/claim.html      custom pages. See "Importing into eDealer" below.
edealer/gm-incentives.css   served from GitHub Pages, referenced by both
edealer/gm-incentives.js    served from GitHub Pages, referenced by both

wordpress/paste/one-page-block.html WORDPRESS, no install, ONE page — cards
                        and form together. Nothing to configure. Start here.
wordpress/paste/offers-block.html   WORDPRESS, no install, two pages — only
wordpress/paste/claim-block.html    if you want the form on its own URL.
wordpress/golden-mile-incentives/   WORDPRESS, as a plugin — two shortcodes,
                        [gm_offers] and [gm_claim], offers held as data.
edealer/footer.html                 the dealership block, shared source
wordpress/build-paste.js            regenerates the two paste blocks
wordpress/sync-from-edealer.js      keeps the plugin's assets in step

assets/*.webp       the seven creatives, optimized — these are what the pages load
assets/*.png/.jpg   the original exports, kept so the webp can be regenerated
                    (retired 1920x599 banners from the previous offer set are still
                     in assets/ but nothing references them)
preview/            reference screenshots
```

Both builds email leads the same way. Edits to one do **not** reach the other —
there is no shared source. See "Keeping the two builds in sync".

---

## Importing into eDealer

Two custom pages. The offer cards live on the first; clicking one carries the offer
across to the form on the second.

| Page | Paste | Default path |
|---|---|---|
| Offers listing | `edealer/offers.html` | `/offers` |
| Claim form | `edealer/claim.html` | `/offers-claim` |

### If your paths differ

The six **Claim This Offer** hrefs are hardcoded in `offers.html` as
`/offers-claim?offer=<key>` — deliberately, so the buttons still work if the script
fails to load. If eDealer assigns different slugs, update:

1. those six hrefs in `offers.html`, and
2. `OFFERS_PATH` at the top of `gm-incentives.js` (used for the "back to offers" links).

### The claim page is gated

Landing on the claim page without a valid `?offer=` shows a "Choose an offer first"
panel with a link back, instead of a form with nothing attached. Arriving via an offer
button shows the form with that offer named, locked into a hidden field, and only that
offer's eligibility questions revealed.

**This is a usability gate, not access control.** An eDealer page is public HTML —
anyone with the URL can open it, and a hand-typed `?offer=ram` works fine. It stops
people wandering onto a bare form; it does not stop anyone determined.

Set the claim page to **noindex** in eDealer's page SEO settings and leave it out of the
nav, so it is only ever reached from an offer button.

### Why the CSS and JS are external

Per the staff-page notes, the eDealer/D2C editor renders the contents of an inline
`<style>` block and any HTML comment as visible body text. So both fragments carry zero
`<!--` comments and zero inline `<style>`; everything is pulled in via `<link>` and
`<script src>` from GitHub Pages, which the editor leaves alone.

The happy side effect: **CSS and JS changes go live on push, with no re-pasting.** Only a
change to the markup itself needs another paste into eDealer.

### Pre-paste checks

```bash
cd edealer
for f in offers.html claim.html; do
  echo "$f  comments:$(grep -c '<!--' $f)  style:$(grep -c '<style' $f)  relative-src:$(grep -o 'src="[^"]*"' $f | grep -vc 'src="http')"
done
```

All three counts must be `0`. Then confirm the hosted assets actually resolve:

```bash
B=https://apparatus9.github.io/golden-mile-incentive-page
for u in /edealer/gm-incentives.css /edealer/gm-incentives.js /assets/offer-durango.webp; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L $B$u) $u"
done
```

### Asset hosting

CSS, JS and banners are served from **GitHub Pages** off this repo's `main` branch:
`https://apparatus9.github.io/golden-mile-incentive-page/`. A push to `main` republishes
within a minute or so. Because the repo is public these URLs resolve — the private-repo
problem that forced the staff page onto Netlify does not apply here.

---

## WordPress

Two ways in. Pick on access, not on taste: if you can install a plugin, the
plugin is better; if all you have is an editor login, paste the blocks.

| | Paste the blocks | Install the plugin |
|---|---|---|
| Needs | an Administrator login | FTP, or Plugins → Add New |
| Setup | paste, edit two lines, publish | upload, activate, one filter |
| Offers live in | the pasted markup | `offers.php`, as data |
| Updating offers | re-paste both pages | edit one array |
| Images | GitHub Pages, or your Media Library | bundled with the plugin |
| Survives a theme change | yes | yes |

### Option A — paste one block, one page

`wordpress/paste/one-page-block.html` is the whole thing: the seven cards,
and the claim form at the bottom of the same page. Each **Claim This Offer**
button scrolls down to the form and selects that offer on the way.

1. Edit the page, add a **Custom HTML** block, paste the file in.
2. Publish.

That is all of it. No second page, no permalinks to set, nothing to mark
`noindex`, nothing to configure. `?offer=<key>` still works for an ad or an
email pointed at one offer, and the buttons are real anchors to `#gmi-claim`,
so they work with the script disabled.

Regenerate after any change to the eDealer build:

```bash
node wordpress/build-onepage.js
```

### Option A2 — paste two blocks, two pages

Only worth it if the form has to live on its own URL. Two self-contained
blocks, stylesheet and script inlined.

1. Edit the offers page, add a **Custom HTML** block, paste
   `offers-block.html` into it.
2. Do the same on the claim page with `claim-block.html`.
3. In each, near the bottom of the script, set the two permalinks:

   ```js
   var OFFERS_URL = '/offers/';        /* the page holding the offer cards */
   var CLAIM_URL  = '/offers-claim/';  /* the page holding the claim form  */
   ```

   Those two lines are the only thing that must change. Every link on the
   page is rewritten from them.
4. Publish, and set the claim page to **noindex** in your SEO plugin.

**You must be an Administrator.** WordPress strips style and script tags out
of a Custom HTML block for anyone without the `unfiltered_html` capability,
and on multisite only Super Admins have it. An unstyled page means exactly
that — use the plugin instead.

The creatives are served from GitHub Pages. To serve them from your own
Media Library, upload the seven `.webp` files and replace every
`https://apparatus9.github.io/golden-mile-incentive-page/assets` with the
Media Library URL — one find-and-replace, they all share the prefix.

Regenerate the blocks after any change to the eDealer build:

```bash
node wordpress/build-paste.js
```

The blocks are generated. Never edit them directly; edit `edealer/` and
re-run that.

### Option B — install the plugin

`wordpress/golden-mile-incentives/` gives two shortcodes and nothing else:
no admin screens, no database tables, no options rows.

| Shortcode | Put it on |
|---|---|
| `[gm_offers]` | the offers page |
| `[gm_claim]` | the claim page |

#### Installing

Zip the `golden-mile-incentives` folder and upload it under **Plugins → Add
New → Upload Plugin**, or drop the folder straight into `wp-content/plugins/`.
Activate it, create the two pages, and put one shortcode on each.

Then point it at those pages. Until you do it assumes `/offers/` and
`/offers-claim/`:

```php
add_filter( 'gmi_settings', function ( $s ) {
    $s['offers_url'] = home_url( '/current-offers/' );
    $s['claim_url']  = home_url( '/claim-your-offer/' );
    return $s;
} );
```

`readme.txt` inside the plugin lists every setting. The claim page is set to
`noindex` automatically — still keep it out of the menu.

#### Why the plugin is the better of the two

Both routes render the same page. The plugin is worth the install for three
reasons:

- **The offers are data, not markup.** `offers.php` is one array; the cards,
  the claim form's offer list and the lead email all read it, so they cannot
  drift apart. In the other two builds the same copy is written out three
  times by hand.
- **Assets are local and versioned.** No dependency on GitHub Pages staying
  up, and the cache busts on `filemtime` so a CSS change goes live without
  anyone clearing anything.
- **It survives the theme.** Styling is scoped under `.gmi`, assets load only
  on pages that use a shortcode, and a theme change does not take the offers
  page with it.

#### Keeping the plugin in step with eDealer

The stylesheet, the script and the creatives are shared. `sync-from-edealer.js`
copies them across, rewriting the script's config block — eDealer hardcodes
the paths and addresses, the plugin reads them from `window.GMI_CONFIG`, which
WordPress prints:

```bash
node wordpress/sync-from-edealer.js            # check, exits 1 if out of sync
node wordpress/sync-from-edealer.js --write    # apply
```

Edit `edealer/gm-incentives.js`, never the plugin's copy — it is generated and
says so at the top.

It deliberately does **not** sync the offer copy. `edealer/offers.html` is flat
markup and `offers.php` is data; there is no safe mechanical translation
between them. When offers change, update both.

### What was not tested

The plugin's PHP has been parsed and every function call checked against the
WordPress API, and its CSS, script and `window.GMI_CONFIG` contract were
driven in a real browser against the markup the shortcodes emit — the class
and id sets are verified identical to the eDealer build, which is what the
shared stylesheet and script key off.

**It has not been run inside WordPress.** There is no PHP on the machine it
was written on. Before it goes near the live site, activate it on a staging
copy and check: both pages render, the Claim buttons carry `?offer=` across,
the form's eligibility questions appear for Wrangler and Grand Cherokee, and
one test lead arrives.

The **paste blocks** need no PHP, so those were tested properly: both were
loaded inside a deliberately hostile theme — content-box sizing, pink
underlined links, rounded shadowed images, bulleted lists, a serif heading
face, dashed borders on `details`, and the stray `<p>` and `<br>` that
`wpautop` leaves behind — and checked both ways: nothing of the theme reached
the block, and nothing of the block reached the theme's own copy. Two leaks
turned up that way and are fixed: the theme's image shadow, and its link
colour winning on the buttons, which needed a doubled `.gmi.gmi` class to
outrank `.entry-content a` without `!important`.

## Keeping the builds in sync

`index.html`, the `edealer/` pair and `wordpress/.../offers.php` each hold the offer
content separately. A change to one does not reach the others. When offers change,
update all three, or retire the builds you are not using. The duplicated parts are the
seven offer blocks, the `OFFERS` object and the legal footer.

The WordPress build is the only one where the offers are data rather than markup, so if
you are picking one to keep, keep that one.

Class prefixes differ on purpose: standalone uses `gm-`, the eDealer build uses `gmi-`
scoped under a `.gmi` root so eDealer's own stylesheet cannot collide with it.

## Where the leads go

Every submission is emailed to **both**:

| | |
|---|---|
| To | `ejay@goldenmilechrysler.ca` |
| Cc | `mitch@goldenmilechrysler.ca` |

Delivery runs through [FormSubmit](https://formsubmit.co) — no account, no server, no
API key. The page POSTs JSON to `formsubmit.co/ajax/<address>` and FormSubmit sends the
mail. Both addresses are set in the CONFIG block at the bottom of `index.html`:

```js
var LEAD_TO = 'ejay@goldenmilechrysler.ca';
var LEAD_CC = 'mitch@goldenmilechrysler.ca';
```

### ⚠️ One-time activation — do this before launch

**The first submission will not be delivered.** Instead FormSubmit emails Ejay an
activation link. Until someone clicks it, submissions are accepted by the page (the
visitor sees the success panel) and silently dropped.

So before this page goes anywhere near real traffic:

1. Open the page and send one test submission.
2. Have Ejay check his inbox for the FormSubmit activation email and click the link.
3. Send a second test submission and confirm it lands for **both** Ejay and Mitch.

### ⚠️ The addresses are visible in the page source

`index.html` is public, and so is this repo — both mailboxes are sitting in the markup
where scrapers can find them. After activation, FormSubmit issues a hashed alias for the
primary address. Swap it in:

```js
var LEAD_TO = 'a1b2c3d4e5f6...';   // the alias, not the raw address
```

`LEAD_CC` can't be aliased, so Mitch's address stays visible either way. If that matters,
the alternative is a mail route you control (a Cloudflare Worker or Firebase Function
holding the addresses server-side).

### What the email contains

Rows are plain English, and empty fields are dropped so the mail stays short:

> **Offer** Double Loyalty — up to $3,000 Savings
> **Offer ends** November 30, 2026
> **Name** / **Email** / **Phone** / **Preferred contact**
> **Vehicle of interest** / **Purchase timeline** / **Trade-in** / **Buying method**
> **Comments** / **Consent to contact** / **Submitted** (Toronto time) / **Page**

Offer-specific rows only appear when that offer was chosen. There is one such block
left: *Currently owns* and *Registered since*, shown for the two offers that carry
$1,500 loyalty bonus cash (`wrangler` and `grand-cherokee`). A conditional block can
now serve several offers — `data-for` takes a space-separated list of keys.

The subject line is `Offer request: <offer> - <name>`, so the inbox sorts itself.

A hidden `_honey` honeypot field is included; bots that fill it get silently discarded by
FormSubmit. If the POST fails, the visitor is shown the dealership phone number and
Ejay's address rather than losing the lead.

### Swapping to a different provider

Point `MAIL_ENDPOINT` at any URL that accepts a JSON `POST` and treats a non-`200` or
`{"success":"false"}` as failure. `buildEmail()` shapes the payload — change the keys
there to match whatever the new service expects.

## Deep links

`?offer=<key>` preselects an offer and jumps straight to the form — useful for email
blasts and paid ads pointed at one incentive:

```
/?offer=durango        /?offer=compass   /?offer=wrangler
/?offer=grand-cherokee  /?offer=cherokee
```

On WordPress the same keys hang off the claim page's own permalink, for
example `/claim-your-offer/?offer=durango`. The script also accepts
`#durango` as a fallback, for hosts or caches that strip query strings.

```
```

## Updating the offers

Each offer is one `<article class="gm-offer">` in `index.html`, laid out as the creative
on the left and the copy on the right. Its parts, in order:

| Part | Holds |
|---|---|
| `h2` | **the figure, and only the figure** — `Up to $10,000`, `0% for 84 months`. This is the card's display type (up to 56px) and the thing the eye lands on. Keep it under about 24 characters so it stays on one line. |
| `.gm-offer-sub` | one line saying what the figure buys: *In total incentives on every 2026 Dodge Durango*. |
| `.gm-facts` | two or three plain qualifiers, separated by a middot. Not boxes, not chips. |
| `<details>` | the fine print. |
| `.gm-offer-cta` | claim button, inventory link, end date. |

There is **no eyebrow label and no per-card accent colour**. An earlier version tinted each
card from its banner's artwork and put a coloured tag above the heading; both were dropped.
Five accents on one page reads as noise, and the creatives already carry the colour. The
page now runs one ground, one ink and one accent (brand red), and the red is reserved for
the actions and the countdown.

The card's own figure repeats what the creative shouts, on purpose: the creative is an
image, so the text has to say it too, and saying it at the same volume is what makes the
card and the poster read as one object rather than a shout followed by a whisper.

When you add or remove an offer, update **four** places per build or the form drifts out
of sync with the cards. Standalone:

1. the `<article class="gm-offer">` in `index.html`,
2. the `<option>` in the `#gm-offer` select in `claim.html`,
3. the `OFFERS` object in `claim.html` (the name and end date shown back to the customer),
4. the `data-for` list on any eligibility block the offer should reveal.

WordPress, as a plugin, is one place instead of four — `offers.php`, which
every part reads. (Pasted blocks are markup like the other builds, and are
regenerated with `node wordpress/build-paste.js` rather than edited.)

```php
array(
    'key'     => 'durango',          // the ?offer= slug
    'eyebrow' => 'Total Incentives', // the filled badge above the headline
    'amount'  => 'Up to $10,000 in Total Incentives',   // the headline
    'sub'     => '2026 Dodge Durango — all models',     // the model line
    'facts'   => array( 'Up to $10,000', 'All 2026 Durango models' ), // the chips
    'fine'    => array( '…' ),       // one entry per paragraph
    'name'    => '…',                // how it reads back to the customer
    'loyalty' => false,              // true reveals the ownership questions
),
```

eDealer, the same four:

1. the `<div class="gmi-offer">` in `edealer/offers.html`,
2. — (the eDealer claim page has no select; it is driven entirely by `?offer=`),
3. the `OFFERS` object in `edealer/gm-incentives.js`,
4. the `data-for` list in `edealer/claim.html`.

`data-for` holds a **space-separated list** of offer keys, so one eligibility block can
serve several offers — `data-for="wrangler grand-cherokee"` is how the loyalty questions
appear for both offers that carry loyalty bonus cash.

### Swapping a banner

The page loads **`.webp`, not `.png`** — dropping in a new `.png` alone changes nothing.
The current set is **1080x1080 square** social creatives, not the 1920x599 strips the
previous set used — the card is a two-column layout (creative left, copy right) that
stacks below 1040px. Regenerate after any swap (same settings the current set was built
with: width 1080, quality 82):

```bash
node -e "require('sharp')('assets/offer-NAME.png').resize({width:1080,withoutEnlargement:true}).webp({quality:82}).toFile('assets/offer-NAME.webp')"
```

This took the original five creatives from 6.5 MB to 519 KB. Keep the `width`/`height`
attributes on each `<img>` in step with the source so the page does not shift as the
images load — the Durango export is 1080x1045, the other three squares are 1080x1080,
and the two banners are 1024x320.

### Square creatives and banner creatives

Five of the creatives are 1080px squares and sit in the card's 400px side column.
Two — the Wrangler loyalty bonus and the Ram 3500 Cummins — were supplied as
1024x320 banners instead. Those cards carry `gm-offer-wide` / `gmi-offer-wide`,
which runs the picture the full width of the card with the copy underneath. The
alternative was a square crop, which throws the price lockup away and then upscales
what is left 3.4x. In the plugin the modifier comes from `'wide' => true` on the
offer. If a square version of either creative turns up, drop the flag and the card
goes back to the side-column layout with no other change.

## Motion

Each section's parts rise in as they are scrolled to: the hero's heading, lede and
countdown, then every card's creative, copy and buttons, on a 90ms stagger. It is set up
in the page script (`index.html`) and in `gm-incentives.js` for the eDealer build.

Two rules it is built around, both easy to break:

- **Nothing is hidden until the script says so.** The script adds a `gm-motion` /
  `gmi-motion` class to the root, and only then does the CSS hide anything. If the script
  fails to load, every part of the page is visible. Never move the hidden state into the
  stylesheet's default.
- **Anything on screen is revealed immediately,** and a scroll sweep catches whatever the
  IntersectionObserver misses, so the last card cannot be left invisible on a short page.
  There is also a `@media print` rule forcing everything visible, because a print or a
  full-page screenshot never scrolls.

`prefers-reduced-motion: reduce` drops the travel and shows everything at once.

## The card design

Each card carries, in order: a filled **eyebrow** naming the offer type, the
**headline**, the **model line**, the terms as **chips**, and `OFFER DETAILS +`.

This was briefly simplified — eyebrow and chips removed, the headline cut back
to just the figure — on the reasoning that the creative already shouts the
offer. The dealership asked for it back, and they were right: the eyebrow is
the only thing that says what *kind* of offer it is, and the chips carry the
terms without the visitor opening anything. Do not strip them again.

Each card sets its own `--accent`, keyed to the vehicle in its creative, the
way the original page did. It colours the eyebrow, the left edge of each chip,
and the + on OFFER DETAILS.

| offer | accent | taken from |
|---|---|---|
| Durango | `#c8102e` | Dodge red, off the badge in the creative — the vehicle is white |
| Compass | `#e4601c` | the orange paint |
| Wrangler | `#c9a227` | the gold paint |
| Grand Cherokee | `#44607a` | the slate of the bridge — the vehicle is white |
| Cherokee | `#2461db` | the blue paint |
| Wrangler loyalty | `#08383e` | the deep teal panel the offer sits on — the vehicle is sand |
| Ram 3500 | `#c9783c` | the orange of the rules and the CASH DISCOUNT type — the truck is white |

Orange and gold cannot carry white text at 4.5:1 without turning brown, which
is what made two of them read as the same colour on the first attempt. So each
card also sets `--accent-ink`, and those two take near-black text instead.
If you change an accent, keep its badge above 4.5:1 and keep it at least 60
apart in RGB from the others — `wordpress/build-onepage.js` does not check
this, but the script that set them did.

## Dates

All seven offers carry the same end date, currently **November 30, 2026**. It appears
in four kinds of place:

| Where | What |
|---|---|
| each card | the `.gm-expiry` / `.gmi-expiry` line |
| the `OFFERS` map | `ends:`, which the claim form and the lead email read back |
| the fine print | "until …" inside each offer's own paragraph, and the legal footer |
| the countdown | `EVENT_ENDS` (`2026-11-30T23:59:59-05:00`), which hides itself once passed |

Note the offset: `-05:00`, not `-04:00`. Daylight time ends on 1 November 2026, so a
date later in that month is EST. Getting this wrong shifts the countdown by an hour,
which only shows on the final day.

Change them all at once rather than by hand — there are 61 of them across twelve
files. In the plugin, the date lives in `offers.php` and the `event_ends` setting
only, so those two are the whole job there.

> **This date is an assumption, not a program date.** The creatives are the *October
> 2026* program and state no end date anywhere. The previous offer set said November 2,
> which had already passed by the time the page was built, so it was moved to the end
> of the month to stop the page advertising expired offers. **Confirm the real November
> program dates with the manufacturer and change it before this goes public**, along
> with the unsourced fine print noted below.

## Local preview

```bash
node -e "const h=require('http'),f=require('fs'),p=require('path'),t={'.html':'text/html','.webp':'image/webp','.png':'image/png'};h.createServer((q,s)=>{const r=q.url==='/'?'/index.html':q.url.split('?')[0];f.readFile('.'+r,(e,b)=>e?s.writeHead(404).end():(s.writeHead(200,{'Content-Type':t[p.extname(r)]||'text/plain'}),s.end(b)))}).listen(8777,()=>console.log('http://127.0.0.1:8777'))"
```

## Not done yet

- **The Ram 3500 and Wrangler loyalty offers have no end date of their own.** Both
  creatives state a program code (2618F4 and 2646M1) but no expiry, so both cards
  carry the page-wide November 30, 2026. Confirm against the program sheet.
- **The sixth square creative never arrived.** The October set
  (`October_2026_MY26_*_1080x1080_ViewOffers`) supplied five: Durango, Compass,
  Wrangler Rubicon, Grand Cherokee and Cherokee. The two banners added since are a
  different format, not that sixth square. If it turns up, add it in the four places
  listed under "Updating the offers".
- **Three offers have unverified fine print.** The Wrangler rate paragraph and the
  Cherokee lease paragraph were carried over from the previous verified set. The
  **Durango**, **Compass** and **Grand Cherokee** paragraphs, and the shared **$1,500
  loyalty** paragraph, were written from what the creative states plus the standard
  Stellantis boilerplate — no payment examples were invented, but they are not the
  manufacturer's own legal copy. Replace them from the program sheet before launch.
- **The loyalty ownership cutoff is unstated on four of the five loyalty mentions.**
  Only the Wrangler loyalty banner gives one: registered on or before **November 3,
  2026**. The square creatives say "for eligible owners" and nothing more, so the
  cutoff is absent from the Wrangler Rubicon and Grand Cherokee paragraphs and from
  the form note. Confirm whether November 3 applies to all of them and put it back.
- **FormSubmit has never been activated, and this is the one blocker that
  loses enquiries.** Until the address is confirmed, FormSubmit delivers
  nothing. The submit handler does check the response — it treats
  `success: "false"` as a failure and shows the visitor the dealership phone
  number instead of the success panel — but **whether an unactivated address
  actually returns that, rather than a cheerful success, has not been
  tested**, so assume the lead is lost until proven otherwise. Fixing it takes
  about two minutes: send one submission, have the recipient click the
  activation link FormSubmit emails them, then send a second and confirm it
  arrives at both `lead_to` and `lead_cc`. Do this before the page is linked
  anywhere.
- ~~The paste blocks point at GitHub Pages for images~~ — **done.** `main` now
  carries the creatives and Pages serves all seven (verified 200, and verified
  loading in a browser from the real URLs). The blocks work as pasted, with no
  upload step. Moving them to the Media Library is still the more robust
  option, since it drops the GitHub dependency: upload the seven `.webp` and
  find-and-replace the shared prefix, as "WordPress" above describes.
- **The WordPress plugin has not been run inside WordPress.** There is no PHP on
  the machine it was written on, so it was verified by parsing rather than by
  executing. Activate it on staging first — see "What was not tested" above.
- **The November 30 end date is an assumption.** The creatives state no end date;
  the previous set's November 2 had already passed. Confirm the real program dates
  and change them as "Dates" above describes.
- The eDealer page paths (`/offers`, `/offers-claim`) are assumed — confirm the real
  slugs and update the seven card hrefs plus `OFFERS_PATH`.
- Set the claim page to **noindex** in eDealer and keep it out of the nav.
- The inventory buttons point at `goldenmilechrysler.ca` model URLs that were assumed,
  not verified. Check each one resolves before launch — `/new/Dodge/Durango`,
  `/new/Jeep/Compass` and `/new/Jeep/Grand-Cherokee` are new and entirely unverified.
- The consent checkbox links to `/privacy-policy` — confirm that is the real path.
