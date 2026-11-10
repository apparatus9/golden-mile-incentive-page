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

Leads are handled by this site. Each one is saved as a private gmi_lead post
and then emailed with wp_mail(), in that order, so a mail problem cannot lose
an enquiry. They are listed under Offer Leads in wp-admin.

== No-install alternative ==

If you cannot install a plugin, `wordpress/paste/` in the project repo holds
the same two pages as self-contained blocks you paste into a Custom HTML
block. Same markup, same stylesheet, same script, all inlined. You still
need an Administrator login, because WordPress strips style and script tags
from that block for anyone without `unfiltered_html`.

The plugin is the better of the two where you can use it: it holds the
offers as data rather than markup, so the cards, the form's offer list and
the lead email cannot drift apart.

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
        $s['event_ends']    = '2026-11-30T23:59:59-05:00';
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

Submissions POST as JSON to `/wp-json/gmi/v1/lead` on this site. The handler
does two things, in this order:

1. **Saves** the lead as a private `gmi_lead` post.
2. **Emails** it with `wp_mail()` to `lead_to`, copying `lead_cc`, with
   Reply-To set to the customer.

Saving first is deliberate. A mail server that is down, throttled or simply
not configured cannot lose an enquiry: it is in Offer Leads > Leads either
way, with the phone number as a click-to-call link. If only the mail fails,
the visitor is still thanked - the dealership has their number - and the
failure is flagged on the lead and in a red admin notice shown to every
administrator until it is cleared.

The plugin never puts either address in the page. They stay on the server.

**Offer Leads > Test email** sends one test lead to both addresses at the
press of a button. Do this first, before any real traffic.

If the test says WordPress refused to send it, this site cannot send mail at
all. If it says WordPress accepted it but nothing arrives, it sent and was
filtered. Either way, install an SMTP plugin - WP Mail SMTP or Post SMTP -
and press the button again. This is the usual reason a WordPress form appears
not to work and is nothing to do with this plugin.

= Spam =

The endpoint is public and carries no nonce, on purpose: these pages sit
behind a page cache, and a cached nonce is a stale nonce that would fail for
exactly the visitors the page exists for. Instead there is a hidden honeypot
field, a limit of six submissions an hour from one IP (filter
`gmi_rate_limit`), and validation that rejects anything without a name, a
real email and a phone number of at least seven digits.

= The pasted blocks =

The blocks in `wordpress/paste/` POST to FormSubmit when no plugin is
present. Activating this plugin on the same site is enough to redirect them
here instead - it announces its endpoint on any page carrying the form, and
the block's script prefers it. No re-paste needed.

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
