# Golden Mile — Incentive Page

A single-page offers/incentives landing page for Golden Mile Chrysler Dodge Jeep Ram.
Six live offers, each with a "Claim This Offer" button that drops the visitor into one
form with that offer already selected and the eligibility questions for it revealed.

There are **two builds** of the same thing:

```
index.html              STANDALONE — one page, offers + form together.
                        Inline CSS/JS, no dependencies. Open it off disk and it runs.

edealer/offers.html     EDEALER — two pages. Paste these into two eDealer
edealer/claim.html      custom pages. See "Importing into eDealer" below.
edealer/gm-incentives.css   served from GitHub Pages, referenced by both
edealer/gm-incentives.js    served from GitHub Pages, referenced by both

assets/*.webp       the six banners, optimized — these are what the pages load
assets/*.png        the original banner exports, kept so the webp can be regenerated
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
for u in /edealer/gm-incentives.css /edealer/gm-incentives.js /assets/offer-wrangler.webp; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L $B$u) $u"
done
```

### Asset hosting

CSS, JS and banners are served from **GitHub Pages** off this repo's `main` branch:
`https://apparatus9.github.io/golden-mile-incentive-page/`. A push to `main` republishes
within a minute or so. Because the repo is public these URLs resolve — the private-repo
problem that forced the staff page onto Netlify does not apply here.

---

## Keeping the two builds in sync

`index.html` and the `edealer/` pair duplicate the offer content. A change to one does
not reach the other. When offers change, update both, or retire whichever build you are
not using. The duplicated parts are the six offer blocks, the `OFFERS` object, and the
legal footer.

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
> **Offer ends** November 2, 2026
> **Name** / **Email** / **Phone** / **Preferred contact**
> **Vehicle of interest** / **Purchase timeline** / **Trade-in** / **Buying method**
> **Comments** / **Consent to contact** / **Submitted** (Toronto time) / **Page**

Offer-specific rows only appear when that offer was chosen — *Currently owns* and
*Registered since* for loyalty, *First responder role* and *Service or employer* for
first responders, *Accessories wanted* for the accessory credit.

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
/?offer=wrangler  /?offer=ram      /?offer=cherokee
/?offer=loyalty   /?offer=accessories   /?offer=first-responders
```

## Updating the offers

Each offer is one `<article class="gm-offer">` in `index.html`. To change one, edit the
banner, the headline, the `.gm-facts` chips and the fine print in `<details>`. The accent
colour is the inline `style="--accent:#..."` on the article — it tints the eyebrow tag
and the chip borders, and is sampled from that banner's own artwork.

When you add or remove an offer, update **three** places or the form drifts out of sync
with the cards:

1. the `<article>` itself,
2. the `<option>` in the `#gm-offer` select,
3. the `OFFERS` object in the script (the name and end date shown back to the customer).

### Swapping a banner

The page loads **`.webp`, not `.png`** — dropping in a new `.png` alone changes nothing.
Regenerate after any swap (same settings the current set was built with: width 1600,
quality 82):

```bash
node -e "require('sharp')('assets/offer-NAME.png').resize({width:1600,withoutEnlargement:true}).webp({quality:82}).toFile('assets/offer-NAME.webp')"
```

This took the six banners from 9.1 MB to 898 KB.

## Dates

Offer end dates are hardcoded in three places: the top event bar, each card's
`.gm-expiry` line, and the `OFFERS` object. The hero countdown reads `endsAt` in the
script (`2026-11-02`) and hides itself once that date passes. The accessory offer ends
earlier (October 31) and is labelled separately.

## Local preview

```bash
node -e "const h=require('http'),f=require('fs'),p=require('path'),t={'.html':'text/html','.webp':'image/webp','.png':'image/png'};h.createServer((q,s)=>{const r=q.url==='/'?'/index.html':q.url.split('?')[0];f.readFile('.'+r,(e,b)=>e?s.writeHead(404).end():(s.writeHead(200,{'Content-Type':t[p.extname(r)]||'text/plain'}),s.end(b)))}).listen(8777,()=>console.log('http://127.0.0.1:8777'))"
```

## Not done yet

- **FormSubmit has not been activated** — see above. Until Ejay clicks the link, nothing
  is delivered.
- The eDealer page paths (`/offers`, `/offers-claim`) are assumed — confirm the real
  slugs and update the six card hrefs plus `OFFERS_PATH`.
- Set the claim page to **noindex** in eDealer and keep it out of the nav.
- The inventory buttons point at `goldenmilechrysler.ca` model URLs that were assumed,
  not verified. Check each one resolves before launch.
- The consent checkbox links to `/privacy-policy` — confirm that is the real path.
