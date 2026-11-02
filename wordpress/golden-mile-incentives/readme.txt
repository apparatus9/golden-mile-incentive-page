=== Golden Mile Incentives ===
Contributors: goldenmilechrysler
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.2
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Current offers and a claim form for Golden Mile Chrysler Dodge Jeep Ram, as
two shortcodes.

== Description ==

Two shortcodes:

* `[gm_offers]` — the offers listing. Each offer is a card: the creative on
  the left, the figure at display size on the right, and a Claim button that
  carries the offer across to the form.
* `[gm_claim]` — the claim form. It reads `?offer=` from the URL, names the
  offer back to the customer, locks it into a hidden field and reveals only
  that offer's eligibility questions.

Leads are emailed through FormSubmit. There is no server-side handling and
nothing is stored in the database, so the plugin adds no tables, no options
and no admin screens.

== Installation ==

1. Copy the `golden-mile-incentives` folder into `wp-content/plugins/`, or
   zip it and upload it under **Plugins → Add New → Upload Plugin**.
2. Activate it.
3. Create two pages. Put `[gm_offers]` on one and `[gm_claim]` on the other,
   each in its own Shortcode block (or a Custom HTML block, or anywhere a
   page builder accepts a shortcode).
4. Tell the plugin where those two pages are — see **Configuration**. Until
   you do, it assumes `/offers/` and `/offers-claim/`.

The claim page is set to `noindex` automatically. Leave it out of the menu
too: it is only meant to be reached from an offer button.

== Configuration ==

Everything is set with one filter. Put this in your child theme's
`functions.php` or a site-specific plugin:

    add_filter( 'gmi_settings', function ( $s ) {
        $s['offers_url']    = home_url( '/current-offers/' );
        $s['claim_url']     = home_url( '/claim-your-offer/' );
        $s['inventory_url'] = 'https://www.goldenmilechrysler.ca';
        $s['privacy_url']   = home_url( '/privacy-policy/' );
        $s['lead_to']       = 'ejay@goldenmilechrysler.ca';
        $s['lead_cc']       = 'mitch@goldenmilechrysler.ca';
        $s['event_ends']    = '2026-11-02T23:59:59-04:00';
        return $s;
    } );

`event_ends` drives the countdown in the hero, which hides itself once the
date has passed. Set it to an empty string to switch the countdown off.

Shortcode attributes override the heading and intro per page:

    [gm_offers heading="h2" title="November Offers" lede="…"]

Use `heading="h2"` when the theme already prints the page title as an `h1`,
so the page does not end up with two.

== Changing the offers ==

Edit `offers.php`. One array entry per offer, in the order they appear. The
comment at the top of that file explains each key. Both shortcodes and the
script all read it, so the cards, the form's offer list and the lead email
cannot drift apart.

Creatives live in `assets/`. They are 1080×1080 squares; keep the `width`
and `height` in `offers.php` in step with the real file so the page does not
shift as images load. Regenerate the webp after swapping a source image:

    node -e "require('sharp')('in.png').resize({width:1080,withoutEnlargement:true}).webp({quality:82}).toFile('assets/offer-NAME.webp')"

To change offers without editing plugin files — so an update cannot
overwrite them — use the `gmi_offers` filter instead.

== Leads ==

Submissions POST as JSON to `https://formsubmit.co/ajax/<lead_to>` and
FormSubmit sends the mail, with `lead_cc` copied.

**Before launch:** FormSubmit will not deliver anything until the address is
activated. Send one test submission, have the recipient click the activation
link FormSubmit emails them, then send a second and confirm both addresses
receive it. Until that is done the visitor sees the success panel and the
lead is silently dropped.

After activation FormSubmit issues a hashed alias for the primary address.
Swap it into `lead_to`, so the real address is not sitting in public HTML.
The cc address cannot be aliased and stays visible either way. If that
matters, route the mail through something you control instead and point
`MAIL_ENDPOINT` in `assets/gm-incentives.js` at it.

A hidden `_honey` honeypot is included; bots that fill it are discarded. If
the POST fails, the visitor is shown the dealership phone number and the
lead address rather than losing the enquiry.

== Notes ==

* **Caching.** The claim page varies on the `?offer=` query string. Most
  caching plugins treat a query string as a separate entry, but a few strip
  them — if the form starts showing "Choose an offer first" when arriving
  from a card, exclude the claim page from the cache. The script also
  accepts `#offer-key` as a fallback.
* **Oswald** is loaded from Google Fonts as a dependency of the plugin
  stylesheet. If the theme already loads it, or the site must not call
  Google, dequeue it: `wp_dequeue_style( 'gmi-oswald' );`
* **Styling** is scoped under `.gmi` so it will not leak into the theme, and
  the theme has a harder time leaking in. If a theme still overrides
  something, add rules after the plugin's stylesheet rather than editing it.
* **Assets** are enqueued only on pages that use a shortcode.

== Changelog ==

= 1.0.0 =
* First release. Five offers: Durango, Compass, Wrangler, Grand Cherokee,
  Cherokee.
