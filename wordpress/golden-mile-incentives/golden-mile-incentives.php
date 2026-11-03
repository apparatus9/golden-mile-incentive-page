<?php
/**
 * Plugin Name:       Golden Mile Incentives
 * Plugin URI:        https://github.com/apparatus9/golden-mile-incentive-page
 * Description:       Current offers and a claim form for Golden Mile Chrysler Dodge Jeep Ram, as two shortcodes. Put [gm_offers] on the offers page and [gm_claim] on the claim page.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.2
 * Author:            Golden Mile Chrysler Dodge Jeep Ram
 * License:           GPL-2.0-or-later
 * Text Domain:       golden-mile-incentives
 *
 * @package GoldenMileIncentives
 */

defined( 'ABSPATH' ) || exit;

define( 'GMI_VERSION', '1.0.0' );
define( 'GMI_FILE', __FILE__ );
define( 'GMI_DIR', plugin_dir_path( __FILE__ ) );
define( 'GMI_URL', plugin_dir_url( __FILE__ ) );

/**
 * Settings, all filterable so a child theme or a site-specific plugin can
 * change them without editing this file.
 *
 * claim_url / offers_url are the two pages the shortcodes live on. They are
 * what the Claim buttons point at and what the "see all offers" links point
 * back to. Set them to the real permalinks once the pages exist:
 *
 *     add_filter( 'gmi_settings', function ( $s ) {
 *         $s['offers_url'] = home_url( '/offers/' );
 *         $s['claim_url']  = home_url( '/claim-offer/' );
 *         return $s;
 *     } );
 *
 * @return array
 */
function gmi_settings() {
	static $settings = null;

	if ( null === $settings ) {
		$settings = apply_filters(
			'gmi_settings',
			array(
				// The two pages. Defaults assume /offers/ and /offers-claim/.
				'offers_url'    => home_url( '/offers/' ),
				'claim_url'     => home_url( '/offers-claim/' ),

				// Where the inventory buttons point. Leave the trailing slash off.
				'inventory_url' => 'https://www.goldenmilechrysler.ca',

				// Privacy policy linked from the consent checkbox.
				'privacy_url'   => home_url( '/privacy-policy/' ),

				// Where leads go. See readme.txt - FormSubmit needs one
				// activation click before anything is delivered.
				'lead_to'       => 'ejay@goldenmilechrysler.ca',
				'lead_cc'       => 'mitch@goldenmilechrysler.ca',

				// Dealership contact, shown if the lead POST fails.
				'phone'         => '647-288-5337',
				'phone_href'    => '+16472885337',

				// When the event ends. Drives the hero countdown, which hides
				// itself once the date has passed. ISO 8601 with offset.
				'event_ends'    => '2026-11-30T23:59:59-05:00',

				// Keep the claim page out of search results.
				'claim_noindex' => true,
			)
		);
	}

	return $settings;
}

/**
 * One setting.
 *
 * @param string $key     Setting name.
 * @param mixed  $default Returned when the setting is missing.
 * @return mixed
 */
function gmi_setting( $key, $default = '' ) {
	$settings = gmi_settings();
	return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
}

/**
 * The offer set, from offers.php.
 *
 * @return array
 */
function gmi_offers() {
	static $offers = null;

	if ( null === $offers ) {
		$offers = apply_filters( 'gmi_offers', require GMI_DIR . 'offers.php' );
	}

	return $offers;
}

/**
 * Asset URL with a cache-busting version taken from the file's mtime, so a
 * push of new CSS is picked up without bumping the plugin version.
 *
 * @param string $rel Path relative to the plugin's assets/ folder.
 * @return array{url:string,ver:string}
 */
function gmi_asset( $rel ) {
	$path = GMI_DIR . 'assets/' . $rel;
	$ver  = file_exists( $path ) ? (string) filemtime( $path ) : GMI_VERSION;

	return array(
		'url' => GMI_URL . 'assets/' . $rel,
		'ver' => $ver,
	);
}

/* -------------------------------------------------------------------------
 * Assets
 *
 * Registered always, enqueued only where a shortcode actually runs. The
 * shortcodes call gmi_enqueue() themselves, which covers page builders and
 * block themes whose content never passes through has_shortcode() on
 * post_content. WordPress 5.7+ handles a style enqueued mid-body by printing
 * it in the footer, so this is safe either way.
 * ---------------------------------------------------------------------- */

/**
 * Register the stylesheet and script.
 */
function gmi_register_assets() {
	$css = gmi_asset( 'gm-incentives.css' );
	$js  = gmi_asset( 'gm-incentives.js' );

	// Oswald is the heading face. Registered separately so a site that
	// already loads it, or one that must not call Google, can dequeue it:
	//     wp_dequeue_style( 'gmi-oswald' );
	wp_register_style(
		'gmi-oswald',
		'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
		array(),
		null // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Google serves its own versioning.
	);

	wp_register_style( 'gmi-incentives', $css['url'], array( 'gmi-oswald' ), $css['ver'] );
	wp_register_script( 'gmi-incentives', $js['url'], array(), $js['ver'], true );
}
add_action( 'init', 'gmi_register_assets' );

/**
 * Enqueue, and hand the script everything it needs.
 */
function gmi_enqueue() {
	static $done = false;

	if ( $done ) {
		return;
	}
	$done = true;

	wp_enqueue_style( 'gmi-incentives' );
	wp_enqueue_script( 'gmi-incentives' );

	$map = array();
	foreach ( gmi_offers() as $offer ) {
		$map[ $offer['key'] ] = array(
			'name' => $offer['name'],
			'ends' => 'Offer ends ' . $offer['ends'],
		);
	}

	wp_add_inline_script(
		'gmi-incentives',
		'window.GMI_CONFIG = ' . wp_json_encode(
			array(
				'offers'     => $map,
				'offersUrl'  => gmi_setting( 'offers_url' ),
				'claimUrl'   => gmi_setting( 'claim_url' ),
				'leadTo'     => gmi_setting( 'lead_to' ),
				'leadCc'     => gmi_setting( 'lead_cc' ),
				'phone'      => gmi_setting( 'phone' ),
				'phoneHref'  => gmi_setting( 'phone_href' ),
				'eventEnds'  => gmi_setting( 'event_ends' ),
			)
		) . ';',
		'before'
	);
}

/**
 * Enqueue early when the shortcode is in post_content, so the stylesheet
 * lands in <head> rather than the footer on a normal page.
 */
function gmi_maybe_enqueue_early() {
	if ( ! is_singular() ) {
		return;
	}

	$post = get_post();
	if ( ! $post instanceof WP_Post ) {
		return;
	}

	if ( has_shortcode( $post->post_content, 'gm_offers' ) || has_shortcode( $post->post_content, 'gm_claim' ) ) {
		gmi_enqueue();
	}
}
add_action( 'wp_enqueue_scripts', 'gmi_maybe_enqueue_early' );

/**
 * Keep the claim page out of search results. It is only ever meant to be
 * reached from an offer button, and on its own it is a form with nothing
 * attached to it.
 */
function gmi_claim_noindex() {
	if ( ! gmi_setting( 'claim_noindex' ) || ! is_singular() ) {
		return;
	}

	$post = get_post();
	if ( $post instanceof WP_Post && has_shortcode( $post->post_content, 'gm_claim' ) ) {
		echo '<meta name="robots" content="noindex,follow">' . "\n";
	}
}
add_action( 'wp_head', 'gmi_claim_noindex', 1 );

/* -------------------------------------------------------------------------
 * Shortcodes
 * ---------------------------------------------------------------------- */

require_once GMI_DIR . 'render.php';

/**
 * [gm_offers] - the offers listing.
 *
 * @param array $atts Shortcode attributes.
 * @return string
 */
function gmi_shortcode_offers( $atts ) {
	$atts = shortcode_atts(
		array(
			'title' => 'Current Offers &amp; Incentives',
			'lede'  => 'The All-Out Clearout Event: total incentives, factory rates and loyalty bonus cash on 2026 Jeep and Dodge models. Pick the offer that fits and we&rsquo;ll confirm your eligibility and lock it in.',
			// h1 on a page whose theme already prints the page title would be
			// a second h1; set heading="h2" there.
			'heading' => 'h1',
		),
		$atts,
		'gm_offers'
	);

	gmi_enqueue();

	return gmi_render_offers( $atts );
}
add_shortcode( 'gm_offers', 'gmi_shortcode_offers' );

/**
 * [gm_claim] - the claim form.
 *
 * @param array $atts Shortcode attributes.
 * @return string
 */
function gmi_shortcode_claim( $atts ) {
	$atts = shortcode_atts(
		array(
			'title'   => 'Claim Your Offer',
			'lede'    => 'We&rsquo;ll confirm your eligibility, check availability and send you exact numbers &mdash; usually within one business day. No obligation.',
			'heading' => 'h1',
		),
		$atts,
		'gm_claim'
	);

	gmi_enqueue();

	return gmi_render_claim( $atts );
}
add_shortcode( 'gm_claim', 'gmi_shortcode_claim' );
