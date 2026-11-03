<?php
/**
 * Markup for the two shortcodes.
 *
 * The classes and structure match the eDealer build exactly, so one
 * stylesheet serves both and a change made in one place looks the same in
 * the other. Everything that reaches the page is escaped: esc_html for
 * plain text, esc_url for links, wp_kses_post for the fine print and the
 * lede, which legitimately carry entities and the odd <strong>.
 *
 * @package GoldenMileIncentives
 */

defined( 'ABSPATH' ) || exit;

/**
 * Only the tags the offer copy is allowed to use.
 *
 * @return array
 */
function gmi_allowed_html() {
	return array(
		'strong' => array(),
		'em'     => array(),
		'b'      => array(),
		'i'      => array(),
		'br'     => array(),
		'sup'    => array(),
		'a'      => array(
			'href'   => array(),
			'target' => array(),
			'rel'    => array(),
		),
	);
}

/**
 * A heading tag name that is safe to print.
 *
 * @param string $tag Requested tag.
 * @return string
 */
function gmi_heading_tag( $tag ) {
	$tag = strtolower( (string) $tag );
	return in_array( $tag, array( 'h1', 'h2', 'h3' ), true ) ? $tag : 'h1';
}

/**
 * The offers listing.
 *
 * @param array $atts Title, lede and heading level.
 * @return string
 */
function gmi_render_offers( $atts ) {
	$offers    = gmi_offers();
	$claim_url = gmi_setting( 'claim_url' );
	$inventory = untrailingslashit( gmi_setting( 'inventory_url' ) );
	$h         = gmi_heading_tag( $atts['heading'] );

	ob_start();
	?>
<div class="gmi">
<div class="gmi-wrap">

<div class="gmi-intro">
<div class="gmi-hero-main">
<?php if ( ! empty( $atts['kicker'] ) ) : ?><p class="gmi-kicker"><?php echo esc_html( $atts['kicker'] ); ?></p><?php endif; ?>
<<?php echo esc_html( $h ); ?>><?php echo wp_kses( $atts['title'], gmi_allowed_html() ); ?></<?php echo esc_html( $h ); ?>>
<p class="gmi-lede"><?php echo wp_kses( $atts['lede'], gmi_allowed_html() ); ?></p>
</div>
</div>

	<?php foreach ( $offers as $i => $offer ) : ?>
<div class="gmi-offer" id="offer-<?php echo esc_attr( $offer['key'] ); ?>"<?php if ( ! empty( $offer['accent'] ) ) : ?> style="--accent:<?php echo esc_attr( $offer['accent'] ); ?>;--accent-ink:<?php echo esc_attr( isset( $offer['accent_ink'] ) ? $offer['accent_ink'] : '#ffffff' ); ?>"<?php endif; ?>>
<div class="gmi-offer-img"><img src="<?php echo esc_url( GMI_URL . 'assets/' . $offer['image'] ); ?>" width="<?php echo (int) $offer['width']; ?>" height="<?php echo (int) $offer['height']; ?>"<?php echo $i > 0 ? ' loading="lazy"' : ''; ?> alt="<?php echo esc_attr( $offer['alt'] ); ?>"></div>
<div class="gmi-offer-body">
<div class="gmi-offer-main">
<?php if ( ! empty( $offer['eyebrow'] ) ) : ?><p class="gmi-eyebrow"><?php echo esc_html( $offer['eyebrow'] ); ?></p><?php endif; ?>
<h2><?php echo esc_html( $offer['amount'] ); ?></h2>
<p class="gmi-offer-sub"><?php echo wp_kses( $offer['sub'], gmi_allowed_html() ); ?></p>
<ul class="gmi-facts"><?php foreach ( $offer['facts'] as $fact ) : ?><li><?php echo esc_html( $fact ); ?></li><?php endforeach; ?></ul>
<details><summary>Offer details</summary>
		<?php foreach ( $offer['fine'] as $para ) : ?>
<p class="gmi-fine"><?php echo wp_kses( $para, gmi_allowed_html() ); ?></p>
		<?php endforeach; ?>
</details>
</div>
<div class="gmi-offer-cta">
<a class="gmi-btn" href="<?php echo esc_url( add_query_arg( 'offer', $offer['key'], $claim_url ) ); ?>"><?php echo esc_html( $offer['cta'] ); ?></a>
<a class="gmi-btn gmi-btn-ghost" href="<?php echo esc_url( $inventory . $offer['inv_path'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $offer['inv_label'] ); ?></a>
<p class="gmi-expiry"><?php echo esc_html( $offer['expiry'] ); ?></p>
</div>
</div>
</div>
	<?php endforeach; ?>

<p class="gmi-legal"><?php echo esc_html( gmi_legal_text() ); ?></p>

</div>
</div>
	<?php
	return trim( ob_get_clean() );
}

/**
 * The claim form. Gated: without a valid ?offer= the script shows the way
 * back instead of a form with nothing attached to it.
 *
 * @param array $atts Title, lede and heading level.
 * @return string
 */
function gmi_render_claim( $atts ) {
	$offers_url  = gmi_setting( 'offers_url' );
	$privacy_url = gmi_setting( 'privacy_url' );
	$phone       = gmi_setting( 'phone' );
	$phone_href  = gmi_setting( 'phone_href' );
	$h           = gmi_heading_tag( $atts['heading'] );

	// Which offers reveal the loyalty ownership questions.
	$loyalty_keys = array();
	foreach ( gmi_offers() as $offer ) {
		if ( ! empty( $offer['loyalty'] ) ) {
			$loyalty_keys[] = $offer['key'];
		}
	}

	ob_start();
	?>
<div class="gmi">
<div class="gmi-wrap">
<div class="gmi-claim">

<div class="gmi-gate" id="gmi-gate">
<h2>Choose an offer first</h2>
<p>This form is for claiming a specific incentive, so we need to know which one you&rsquo;re after. Head back to the offers page and use the <strong>Claim This Offer</strong> button on the one you want &mdash; it&rsquo;ll bring you straight back here with everything filled in.</p>
<a class="gmi-btn gmi-offers-link" href="<?php echo esc_url( $offers_url ); ?>">See All Current Offers</a>
</div>

<div class="gmi-claimwrap" id="gmi-claimwrap">

<<?php echo esc_html( $h ); ?>><?php echo wp_kses( $atts['title'], gmi_allowed_html() ); ?></<?php echo esc_html( $h ); ?>>
<p class="gmi-claim-intro"><?php echo wp_kses( $atts['lede'], gmi_allowed_html() ); ?></p>

<div class="gmi-formcard">

<div class="gmi-success" id="gmi-success" role="status" aria-live="polite">
<div class="gmi-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5"></path></svg></div>
<h2>Request Received</h2>
<p id="gmi-success-msg">Thanks &mdash; a Golden Mile product advisor will be in touch shortly to confirm your offer.</p>
<a class="gmi-btn gmi-btn-ghost" href="tel:<?php echo esc_attr( $phone_href ); ?>">Or call <?php echo esc_html( $phone ); ?></a>
</div>

<form id="gmi-form" novalidate>
<input type="text" name="_honey" class="gmi-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
<input type="hidden" name="offer" id="gmi-offer-key" value="">

<div class="gmi-chosen">
<div>
<span class="gmi-chosen-label">Offer selected</span>
<span class="gmi-chosen-name" id="gmi-chosen-name"></span>
<p class="gmi-chosen-ends" id="gmi-chosen-ends"></p>
</div>
<a class="gmi-offers-link" href="<?php echo esc_url( $offers_url ); ?>">Not this one? See all offers</a>
</div>

<div class="gmi-grid">

<div class="gmi-field">
<label for="gmi-first">First name <span class="gmi-req">*</span></label>
<input type="text" id="gmi-first" name="firstName" autocomplete="given-name" required>
</div>
<div class="gmi-field">
<label for="gmi-last">Last name <span class="gmi-req">*</span></label>
<input type="text" id="gmi-last" name="lastName" autocomplete="family-name" required>
</div>
<div class="gmi-field">
<label for="gmi-email">Email <span class="gmi-req">*</span></label>
<input type="email" id="gmi-email" name="email" autocomplete="email" required>
</div>
<div class="gmi-field">
<label for="gmi-phone">Phone <span class="gmi-req">*</span></label>
<input type="tel" id="gmi-phone" name="phone" autocomplete="tel" placeholder="416-555-0123" required>
</div>

<fieldset class="gmi-field gmi-field-full">
<span class="gmi-legend">Preferred contact method</span>
<div class="gmi-radios">
<label><input type="radio" name="contactMethod" value="Phone call" checked> Phone call</label>
<label><input type="radio" name="contactMethod" value="Text message"> Text message</label>
<label><input type="radio" name="contactMethod" value="Email"> Email</label>
</div>
</fieldset>

<div class="gmi-field">
<label for="gmi-vehicle">Vehicle of interest</label>
<input type="text" id="gmi-vehicle" name="vehicle" placeholder="Year, model and trim">
</div>
<div class="gmi-field">
<label for="gmi-timeline">Purchase timeline</label>
<select id="gmi-timeline" name="timeline">
<option value="">Select&hellip;</option>
<option>Before the offer ends</option>
<option>Within 30 days</option>
<option>1&ndash;3 months</option>
<option>Just researching</option>
</select>
</div>
<div class="gmi-field">
<label for="gmi-trade">Do you have a trade-in?</label>
<select id="gmi-trade" name="tradeIn">
<option value="No">No</option>
<option value="Yes">Yes</option>
</select>
</div>
<div class="gmi-field">
<label for="gmi-finance">How will you be buying?</label>
<select id="gmi-finance" name="financeType">
<option value="">Select&hellip;</option>
<option>Finance</option>
<option>Lease</option>
<option>Cash</option>
<option>Not sure yet</option>
</select>
</div>

	<?php if ( $loyalty_keys ) : ?>
<div class="gmi-conditional" data-for="<?php echo esc_attr( implode( ' ', $loyalty_keys ) ); ?>">
<p class="gmi-conditional-note"><strong>$1,500 Loyalty Bonus Cash.</strong> Available to eligible owners &mdash; you need a Chrysler, Dodge, Jeep, Ram or FIAT&reg; vehicle registered in your name, and proof of ownership at time of purchase.</p>
<div class="gmi-field">
<label for="gmi-loyalty-vehicle">Vehicle currently registered to you</label>
<input type="text" id="gmi-loyalty-vehicle" name="loyaltyVehicle" placeholder="e.g. 2019 Jeep Grand Cherokee">
</div>
<div class="gmi-field">
<label for="gmi-loyalty-since">Registered in your name since</label>
<input type="text" id="gmi-loyalty-since" name="loyaltySince" placeholder="Month and year">
</div>
</div>
	<?php endif; ?>

<div class="gmi-field gmi-field-full">
<label for="gmi-comments">Anything else we should know?</label>
<textarea id="gmi-comments" name="comments" placeholder="Colour preference, must-have options, budget, questions about the offer&hellip;"></textarea>
</div>

<label class="gmi-consent">
<input type="checkbox" id="gmi-consent" name="consent" required>
<span>I agree to be contacted by Golden Mile Chrysler Dodge Jeep Ram about this offer by phone, text or email, and I accept the <a href="<?php echo esc_url( $privacy_url ); ?>">privacy policy</a>. I can unsubscribe at any time. <span class="gmi-req">*</span></span>
</label>

<p class="gmi-status" id="gmi-status" role="alert"></p>

<div class="gmi-actions">
<button type="submit" class="gmi-btn" id="gmi-submit">Send My Request</button>
<small>Offers are subject to availability, approved credit and manufacturer program rules. Submitting this form does not reserve a vehicle.</small>
</div>

</div>
</form>

</div>

<p class="gmi-legal"><?php echo esc_html( gmi_legal_text() ); ?></p>

</div>

</div>
</div>
</div>
	<?php
	return trim( ob_get_clean() );
}

/**
 * The legal footnote, shared by both shortcodes.
 *
 * @return string
 */
function gmi_legal_text() {
	return apply_filters(
		'gmi_legal_text',
		'All offers shown are subject to change or cancellation without notice and are available on '
		. 'approved credit through participating retailers in Canada. Vehicles shown may not be exactly '
		. 'as illustrated and may include optional equipment at extra cost. Total incentive amounts are '
		. 'maximums: they vary by model, trim and configuration, and not all customers or vehicles '
		. 'qualify for every component. Loyalty bonus cash is available to eligible owners only and '
		. 'requires proof of ownership. Pricing excludes license, registration, insurance and applicable '
		. 'taxes unless otherwise stated. Manufacturer offers end November 30, 2026 unless otherwise '
		. 'noted. See dealer for complete details. Jeep, Dodge, Ram, Mopar and FIAT are registered '
		. 'trademarks of FCA US LLC / Stellantis.'
	);
}

/**
 * Small counts read better as words in the hero button.
 *
 * @param int $n Count.
 * @return string
 */
function gmi_number_word( $n ) {
	$words = array( 1 => 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' );
	return isset( $words[ $n ] ) ? $words[ $n ] : (string) $n;
}
