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

## Where the leads go — set this before launch

The form currently has **no backend**. Open `index.html`, find the CONFIG block near the
bottom, and set an endpoint:

```js
var FORM_ENDPOINT = null;                           // <-- set this
var LEAD_EMAIL    = 'sales@goldenmilechrysler.ca';  // <-- and confirm this
```

`FORM_ENDPOINT` takes any URL that accepts a JSON `POST` — Formspree, a Zapier catch
hook, a serverless function, or a bridge into the CRM. While it is `null`, submitting
opens a prefilled email to `LEAD_EMAIL` instead, so the page is never a dead end — but
that depends on the visitor having a mail client, so don't ship it that way for long.

The JSON body looks like:

```json
{
  "offer": "loyalty",
  "offerName": "Double Loyalty — up to $3,000 Savings",
  "offerEnds": "November 2, 2026",
  "firstName": "...", "lastName": "...", "email": "...", "phone": "...",
  "contactMethod": "Text message",
  "vehicle": "...", "timeline": "...", "tradeIn": "No", "financeType": "...",
  "loyaltyVehicle": "...", "loyaltySince": "...",
  "comments": "...", "consent": "Yes",
  "submittedAt": "2026-10-15T...Z", "pageUrl": "..."
}
```

Offer-specific keys only appear when that offer is selected:
`loyaltyVehicle` / `loyaltySince` (loyalty), `responderRole` / `responderEmployer`
(first responders), `accessories` (accessory credit).

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

- `FORM_ENDPOINT` is unset — see above.
- The inventory buttons point at `goldenmilechrysler.ca` model URLs that were assumed,
  not verified. Check each one resolves before launch.
- The consent checkbox links to `/privacy-policy` — confirm that is the real path.
- If this gets embedded in D2C rather than hosted standalone, it needs the usual
  treatment: strip HTML comments, move the `<style>` block to an external stylesheet,
  and make every asset URL absolute. See the team-page notes in the vault.
