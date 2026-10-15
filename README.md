# Golden Mile — Incentive Page

A single-page offers/incentives landing page for Golden Mile Chrysler Dodge Jeep Ram.
Six live offers, each with a "Claim This Offer" button that drops the visitor into one
form with that offer already selected and the eligibility questions for it revealed.

```
index.html          the whole page (inline CSS + JS, no build step, no dependencies)
assets/*.webp       the six banners, optimized — these are what the page loads
assets/*.png        the original banner exports, kept so the webp can be regenerated
preview/            reference screenshots (desktop, mobile, form)
```

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
- The inventory buttons point at `goldenmilechrysler.ca` model URLs that were assumed,
  not verified. Check each one resolves before launch.
- The consent checkbox links to `/privacy-policy` — confirm that is the real path.
- If this gets embedded in D2C rather than hosted standalone, it needs the usual
  treatment: strip HTML comments, move the `<style>` block to an external stylesheet,
  and make every asset URL absolute. See the team-page notes in the vault.
