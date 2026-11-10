<?php
/**
 * Lead delivery, server side.
 *
 * The page used to POST straight to FormSubmit from the browser. That meant
 * three things the dealership could not live with: nothing was delivered
 * until someone clicked an activation link in a mailbox, both addresses sat
 * in public JavaScript for spam harvesters to read, and when FormSubmit was
 * down the enquiry existed only in the visitor's head.
 *
 * Now the form POSTs to this site instead:
 *
 *     POST /wp-json/gmi/v1/lead
 *
 * and this file does two things, in this order and never the other way
 * round:
 *
 *   1. SAVES the lead as a gmi_lead post. This happens first, so a mail
 *      server that is down or misconfigured cannot lose the enquiry. Every
 *      lead is in Offers > Leads whatever happens to the email.
 *   2. EMAILS it to lead_to with lead_cc copied, through wp_mail().
 *
 * If the save fails, the visitor is told to phone - that is the only case
 * where the enquiry is genuinely lost. If only the mail fails, the visitor
 * is told it went through, because it did: the dealership has their number.
 * The failure is flagged on the lead and in an admin notice that every
 * logged-in administrator sees until it is dealt with.
 *
 * There is deliberately no nonce. This endpoint is reached from pages that
 * sit behind a page cache, and a cached nonce is a stale nonce - it would
 * fail for exactly the visitors the page is built for. The endpoint is
 * public in the same way the FormSubmit one was, and is protected by the
 * honeypot, a per-IP rate limit and field validation instead.
 *
 * @package GoldenMileIncentives
 */

defined( 'ABSPATH' ) || exit;

define( 'GMI_LEAD_CPT', 'gmi_lead' );
define( 'GMI_LEAD_FAILED_META', '_gmi_mail_failed' );

/* -------------------------------------------------------------------------
 * Storage
 * ---------------------------------------------------------------------- */

/**
 * The post type every lead is stored in. Not public, not searchable, and
 * nobody can create one by hand - they only ever arrive through the form.
 */
function gmi_register_lead_cpt() {
	register_post_type(
		GMI_LEAD_CPT,
		array(
			'labels'              => array(
				'name'          => __( 'Leads', 'golden-mile-incentives' ),
				'singular_name' => __( 'Lead', 'golden-mile-incentives' ),
				'menu_name'     => __( 'Offer Leads', 'golden-mile-incentives' ),
				'all_items'     => __( 'Leads', 'golden-mile-incentives' ),
				'search_items'  => __( 'Search leads', 'golden-mile-incentives' ),
				'not_found'     => __( 'No leads yet.', 'golden-mile-incentives' ),
			),
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_rest'        => false,
			'menu_icon'           => 'dashicons-phone',
			'menu_position'       => 26,
			'supports'            => array( 'title' ),
			'capability_type'     => 'post',
			'capabilities'        => array(
				'create_posts' => 'do_not_allow',
			),
			'map_meta_cap'        => true,
			'exclude_from_search' => true,
			'has_archive'         => false,
			'rewrite'             => false,
		)
	);
}
add_action( 'init', 'gmi_register_lead_cpt' );

/**
 * The fields a lead carries, in the order they are shown and emailed.
 *
 * 'label' is what the dealership reads. 'type' decides how the value is
 * cleaned: email, tel and textarea are special, everything else is text.
 *
 * @return array<string,array{label:string,type:string}>
 */
function gmi_lead_fields() {
	return array(
		'offerName'      => array( 'label' => 'Offer', 'type' => 'text' ),
		'offerEnds'      => array( 'label' => 'Offer ends', 'type' => 'text' ),
		'firstName'      => array( 'label' => 'First name', 'type' => 'text' ),
		'lastName'       => array( 'label' => 'Last name', 'type' => 'text' ),
		'email'          => array( 'label' => 'Email', 'type' => 'email' ),
		'phone'          => array( 'label' => 'Phone', 'type' => 'tel' ),
		'contactMethod'  => array( 'label' => 'Preferred contact', 'type' => 'text' ),
		'vehicle'        => array( 'label' => 'Vehicle of interest', 'type' => 'text' ),
		'timeline'       => array( 'label' => 'Purchase timeline', 'type' => 'text' ),
		'tradeIn'        => array( 'label' => 'Trade-in', 'type' => 'text' ),
		'financeType'    => array( 'label' => 'Buying method', 'type' => 'text' ),
		'loyaltyVehicle' => array( 'label' => 'Currently owns', 'type' => 'text' ),
		'loyaltySince'   => array( 'label' => 'Registered since', 'type' => 'text' ),
		'comments'       => array( 'label' => 'Comments', 'type' => 'textarea' ),
		'consent'        => array( 'label' => 'Consent to contact', 'type' => 'text' ),
		'pageUrl'        => array( 'label' => 'Page', 'type' => 'url' ),
	);
}

/* -------------------------------------------------------------------------
 * The endpoint
 * ---------------------------------------------------------------------- */

/**
 * Register POST /wp-json/gmi/v1/lead.
 */
function gmi_register_lead_route() {
	register_rest_route(
		'gmi/v1',
		'/lead',
		array(
			'methods'             => 'POST',
			'callback'            => 'gmi_handle_lead',
			'permission_callback' => '__return_true',
		)
	);
}
add_action( 'rest_api_init', 'gmi_register_lead_route' );

/**
 * The visitor's IP, as far as it can be trusted. Only used for the rate
 * limit, never stored.
 *
 * @return string
 */
function gmi_client_ip() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : '';
	return is_string( $ip ) ? substr( $ip, 0, 45 ) : '';
}

/**
 * Allow a handful of submissions an hour from one address. A real customer
 * sends one; anything sending six is not filling the form in by hand.
 *
 * @return bool True when this submission is within the limit.
 */
function gmi_rate_ok() {
	$ip = gmi_client_ip();
	if ( '' === $ip ) {
		return true;
	}

	$key   = 'gmi_rl_' . md5( $ip );
	$count = (int) get_transient( $key );

	if ( $count >= (int) apply_filters( 'gmi_rate_limit', 6 ) ) {
		return false;
	}

	set_transient( $key, $count + 1, HOUR_IN_SECONDS );
	return true;
}

/**
 * Clean one submitted value according to its type.
 *
 * @param string $type  Field type from gmi_lead_fields().
 * @param mixed  $value Raw value.
 * @return string
 */
function gmi_clean_field( $type, $value ) {
	if ( ! is_scalar( $value ) ) {
		return '';
	}

	$value = (string) $value;

	switch ( $type ) {
		case 'email':
			return sanitize_email( $value );
		case 'url':
			return esc_url_raw( $value );
		case 'tel':
			// Keep digits and the punctuation a phone number is written with.
			return trim( preg_replace( '/[^0-9+()\-. x]/i', '', $value ) );
		case 'textarea':
			return sanitize_textarea_field( $value );
		default:
			return sanitize_text_field( $value );
	}
}

/**
 * Handle a submission.
 *
 * @param WP_REST_Request $request The request.
 * @return WP_REST_Response
 */
function gmi_handle_lead( WP_REST_Request $request ) {
	$body = $request->get_json_params();
	if ( ! is_array( $body ) ) {
		$body = $request->get_params();
	}

	// The honeypot. A human never sees this field, so anything in it is a bot.
	// Answer 200 so the bot believes it worked and does not come back harder.
	$honey = isset( $body['_honey'] ) ? trim( (string) $body['_honey'] ) : '';
	if ( '' !== $honey ) {
		return new WP_REST_Response( array( 'success' => true ), 200 );
	}

	if ( ! gmi_rate_ok() ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => 'Too many submissions from this connection. Please call us instead.',
			),
			429
		);
	}

	$fields = gmi_lead_fields();
	$lead   = array();
	foreach ( $fields as $key => $spec ) {
		$lead[ $key ] = isset( $body[ $key ] ) ? gmi_clean_field( $spec['type'], $body[ $key ] ) : '';
	}

	// The four things the dealership cannot call anybody without.
	$missing = array();
	foreach ( array( 'firstName', 'lastName', 'phone' ) as $required ) {
		if ( '' === $lead[ $required ] ) {
			$missing[] = $fields[ $required ]['label'];
		}
	}
	if ( ! is_email( $lead['email'] ) ) {
		$missing[] = 'a valid email';
	}
	if ( strlen( preg_replace( '/\D/', '', $lead['phone'] ) ) < 7 ) {
		$missing[] = 'a valid phone number';
	}

	if ( $missing ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => 'Please check ' . implode( ', ', $missing ) . '.',
			),
			400
		);
	}

	$name  = trim( $lead['firstName'] . ' ' . $lead['lastName'] );
	$offer = '' !== $lead['offerName'] ? $lead['offerName'] : 'Golden Mile offer';

	/* ---- 1. save it, before anything that can fail ---- */
	$post_id = wp_insert_post(
		array(
			'post_type'   => GMI_LEAD_CPT,
			'post_status' => 'private',
			'post_title'  => $name . ' — ' . $offer,
		),
		true
	);

	if ( is_wp_error( $post_id ) || ! $post_id ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => 'We could not record your request.',
			),
			500
		);
	}

	foreach ( $lead as $key => $value ) {
		if ( '' !== $value ) {
			update_post_meta( $post_id, '_gmi_' . $key, $value );
		}
	}

	/* ---- 2. email it ---- */
	$sent = gmi_mail_lead( $lead, $post_id );

	if ( ! $sent ) {
		update_post_meta( $post_id, GMI_LEAD_FAILED_META, '1' );
	}

	/*
	 * The lead is saved either way, so the visitor is told it went through
	 * either way. It did: somebody at the dealership has their number. The
	 * mail failure is the dealership's problem to see, not theirs, and
	 * gmi_failed_mail_notice() puts it in front of them.
	 */
	return new WP_REST_Response(
		array(
			'success'   => true,
			'delivered' => (bool) $sent,
		),
		200
	);
}

/* -------------------------------------------------------------------------
 * The mail
 * ---------------------------------------------------------------------- */

/**
 * Build and send the lead email.
 *
 * Plain text on purpose. It always renders, it is the least likely thing to
 * be held by a spam filter, and what the dealership needs from it is a name
 * and a phone number.
 *
 * @param array $lead    Cleaned field values keyed as gmi_lead_fields().
 * @param int   $post_id The stored lead, named in the mail so it can be found.
 * @return bool Whether wp_mail() accepted it.
 */
function gmi_mail_lead( $lead, $post_id = 0 ) {
	$to = gmi_setting( 'lead_to' );
	$cc = gmi_setting( 'lead_cc' );

	if ( ! is_email( $to ) ) {
		return false;
	}

	$fields = gmi_lead_fields();
	$name   = trim( $lead['firstName'] . ' ' . $lead['lastName'] );
	$offer  = '' !== $lead['offerName'] ? $lead['offerName'] : 'Golden Mile offer';

	$lines = array(
		'New offer request from the website.',
		'',
		strtoupper( $name ) . '   ' . $lead['phone'],
		'',
	);

	$width = 0;
	foreach ( $fields as $spec ) {
		$width = max( $width, strlen( $spec['label'] ) );
	}

	foreach ( $fields as $key => $spec ) {
		if ( '' === $lead[ $key ] ) {
			continue;
		}
		$lines[] = str_pad( $spec['label'] . ':', $width + 3 ) . $lead[ $key ];
	}

	$lines[] = '';
	$lines[] = str_pad( 'Received:', $width + 3 ) .
		wp_date( 'l j F Y, g:i a', null, wp_timezone() );

	if ( $post_id ) {
		$lines[] = '';
		$lines[] = 'Saved on the website as lead #' . (int) $post_id . ':';
		$lines[] = admin_url( 'post.php?post=' . (int) $post_id . '&action=edit' );
	}

	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

	if ( is_email( $cc ) ) {
		$headers[] = 'Cc: ' . $cc;
	}
	if ( is_email( $lead['email'] ) ) {
		$headers[] = 'Reply-To: ' . $name . ' <' . $lead['email'] . '>';
	}

	$subject = 'Offer request: ' . $offer . ' - ' . $name;

	return (bool) wp_mail(
		$to,
		apply_filters( 'gmi_lead_subject', $subject, $lead ),
		apply_filters( 'gmi_lead_body', implode( "\n", $lines ), $lead ),
		apply_filters( 'gmi_lead_headers', $headers, $lead )
	);
}

/* -------------------------------------------------------------------------
 * Telling the dealership when mail stops working
 * ---------------------------------------------------------------------- */

/**
 * Count leads whose email never went out.
 *
 * @return int
 */
function gmi_failed_mail_count() {
	$found = get_posts(
		array(
			'post_type'        => GMI_LEAD_CPT,
			'post_status'      => 'private',
			'meta_key'         => GMI_LEAD_FAILED_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'       => '1',                  // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'posts_per_page'   => 50,
			'fields'           => 'ids',
			'suppress_filters' => false,
		)
	);

	return count( $found );
}

/**
 * A notice on every admin page while any lead failed to send. It cannot be
 * dismissed, because the thing it is reporting is leads not reaching anyone.
 */
function gmi_failed_mail_notice() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	$count = gmi_failed_mail_count();
	if ( ! $count ) {
		return;
	}

	$url = admin_url( 'edit.php?post_type=' . GMI_LEAD_CPT );

	echo '<div class="notice notice-error"><p><strong>' .
		esc_html__( 'Golden Mile Incentives: offer leads are not being emailed.', 'golden-mile-incentives' ) .
		'</strong><br>' .
		sprintf(
			/* translators: %s: number of leads. */
			esc_html( _n(
				'%s recent lead was saved on the website but could not be emailed. Nothing is lost - open it and call them - but email needs fixing, usually by installing an SMTP plugin.',
				'%s recent leads were saved on the website but could not be emailed. Nothing is lost - open them and call - but email needs fixing, usually by installing an SMTP plugin.',
				$count,
				'golden-mile-incentives'
			) ),
			esc_html( number_format_i18n( $count ) )
		) .
		' <a href="' . esc_url( $url ) . '">' .
		esc_html__( 'See the leads', 'golden-mile-incentives' ) .
		'</a></p></div>';
}
add_action( 'admin_notices', 'gmi_failed_mail_notice' );

/* -------------------------------------------------------------------------
 * The leads screen
 * ---------------------------------------------------------------------- */

/**
 * Columns on the leads list, so the whole thing can be worked from one
 * screen without opening anything.
 *
 * @param array $columns Default columns.
 * @return array
 */
function gmi_lead_columns( $columns ) {
	$own = array(
		'title'       => __( 'Lead', 'golden-mile-incentives' ),
		'gmi_phone'   => __( 'Phone', 'golden-mile-incentives' ),
		'gmi_email'   => __( 'Email', 'golden-mile-incentives' ),
		'gmi_offer'   => __( 'Offer', 'golden-mile-incentives' ),
		'gmi_emailed' => __( 'Emailed', 'golden-mile-incentives' ),
		'date'        => __( 'Received', 'golden-mile-incentives' ),
	);

	// Keep the checkbox WordPress gave us, if it gave us one, so bulk
	// delete still works. Never invent an empty one.
	if ( isset( $columns['cb'] ) ) {
		$own = array( 'cb' => $columns['cb'] ) + $own;
	}

	return $own;
}
add_filter( 'manage_' . GMI_LEAD_CPT . '_posts_columns', 'gmi_lead_columns' );

/**
 * Fill those columns.
 *
 * @param string $column  Column key.
 * @param int    $post_id Lead.
 */
function gmi_lead_column( $column, $post_id ) {
	switch ( $column ) {
		case 'gmi_phone':
			$phone = get_post_meta( $post_id, '_gmi_phone', true );
			if ( $phone ) {
				echo '<a href="tel:' . esc_attr( preg_replace( '/[^0-9+]/', '', $phone ) ) . '">' .
					esc_html( $phone ) . '</a>';
			}
			break;

		case 'gmi_email':
			$email = get_post_meta( $post_id, '_gmi_email', true );
			if ( $email ) {
				echo '<a href="mailto:' . esc_attr( $email ) . '">' . esc_html( $email ) . '</a>';
			}
			break;

		case 'gmi_offer':
			echo esc_html( get_post_meta( $post_id, '_gmi_offerName', true ) );
			break;

		case 'gmi_emailed':
			if ( get_post_meta( $post_id, GMI_LEAD_FAILED_META, true ) ) {
				echo '<span style="color:#b32d2e;font-weight:600">' .
					esc_html__( 'Failed', 'golden-mile-incentives' ) . '</span>';
			} else {
				echo esc_html__( 'Sent', 'golden-mile-incentives' );
			}
			break;
	}
}
add_action( 'manage_' . GMI_LEAD_CPT . '_posts_custom_column', 'gmi_lead_column', 10, 2 );

/**
 * Everything the visitor sent, on the lead itself.
 */
function gmi_lead_meta_box() {
	add_meta_box(
		'gmi-lead-detail',
		__( 'The enquiry', 'golden-mile-incentives' ),
		'gmi_lead_meta_box_render',
		GMI_LEAD_CPT,
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'gmi_lead_meta_box' );

/**
 * Render it.
 *
 * @param WP_Post $post The lead.
 */
function gmi_lead_meta_box_render( $post ) {
	echo '<table class="widefat striped"><tbody>';

	foreach ( gmi_lead_fields() as $key => $spec ) {
		$value = get_post_meta( $post->ID, '_gmi_' . $key, true );
		if ( '' === $value ) {
			continue;
		}

		echo '<tr><th style="width:190px;text-align:left">' . esc_html( $spec['label'] ) . '</th><td>';
		if ( 'email' === $spec['type'] ) {
			echo '<a href="mailto:' . esc_attr( $value ) . '">' . esc_html( $value ) . '</a>';
		} elseif ( 'tel' === $spec['type'] ) {
			echo '<a href="tel:' . esc_attr( preg_replace( '/[^0-9+]/', '', $value ) ) . '">' .
				esc_html( $value ) . '</a>';
		} elseif ( 'url' === $spec['type'] ) {
			echo '<a href="' . esc_url( $value ) . '">' . esc_html( $value ) . '</a>';
		} else {
			echo nl2br( esc_html( $value ) );
		}
		echo '</td></tr>';
	}

	if ( get_post_meta( $post->ID, GMI_LEAD_FAILED_META, true ) ) {
		echo '<tr><th style="text-align:left">' . esc_html__( 'Emailed', 'golden-mile-incentives' ) .
			'</th><td style="color:#b32d2e">' .
			esc_html__( 'No - this one never reached the sales inbox. Call them.', 'golden-mile-incentives' ) .
			'</td></tr>';
	}

	echo '</tbody></table>';
}

/* -------------------------------------------------------------------------
 * "Send a test" - so delivery can be proved without a fake customer
 * ---------------------------------------------------------------------- */

/**
 * A page under Offer Leads with one button on it.
 */
function gmi_lead_test_page() {
	add_submenu_page(
		'edit.php?post_type=' . GMI_LEAD_CPT,
		__( 'Test lead email', 'golden-mile-incentives' ),
		__( 'Test email', 'golden-mile-incentives' ),
		'manage_options',
		'gmi-test-email',
		'gmi_lead_test_render'
	);
}
add_action( 'admin_menu', 'gmi_lead_test_page' );

/**
 * Render it, and send when the button is pressed.
 */
function gmi_lead_test_render() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$to     = gmi_setting( 'lead_to' );
	$cc     = gmi_setting( 'lead_cc' );
	$result = null;

	if ( isset( $_POST['gmi_test'] ) && check_admin_referer( 'gmi_test_email' ) ) {
		$result = gmi_mail_lead(
			array(
				'offerName'      => 'TEST - not a real customer',
				'offerEnds'      => '',
				'firstName'      => 'Website',
				'lastName'       => 'Test',
				'email'          => get_option( 'admin_email' ),
				'phone'          => '000-000-0000',
				'contactMethod'  => 'Phone call',
				'vehicle'        => '',
				'timeline'       => '',
				'tradeIn'        => '',
				'financeType'    => '',
				'loyaltyVehicle' => '',
				'loyaltySince'   => '',
				'comments'       => 'Delivery test sent from the WordPress admin. ' .
					'If this arrived at both addresses, offer leads are working.',
				'consent'        => 'Yes',
				'pageUrl'        => home_url( '/' ),
			)
		);
	}

	echo '<div class="wrap"><h1>' . esc_html__( 'Test lead email', 'golden-mile-incentives' ) . '</h1>';

	echo '<p>' . sprintf(
		/* translators: 1: To address, 2: Cc address. */
		esc_html__( 'Sends one test lead to %1$s, copying %2$s. Nothing is saved to Leads.', 'golden-mile-incentives' ),
		'<code>' . esc_html( $to ) . '</code>',
		'<code>' . esc_html( $cc ) . '</code>'
	) . '</p>';

	if ( true === $result ) {
		echo '<div class="notice notice-success"><p>' .
			esc_html__( 'WordPress accepted the message. Check both inboxes, including junk. If it does not arrive, this site cannot send mail and needs an SMTP plugin.', 'golden-mile-incentives' ) .
			'</p></div>';
	} elseif ( false === $result ) {
		echo '<div class="notice notice-error"><p>' .
			esc_html__( 'WordPress refused to send it. This site cannot send mail as configured - install an SMTP plugin such as WP Mail SMTP and try again.', 'golden-mile-incentives' ) .
			'</p></div>';
	}

	echo '<form method="post">';
	wp_nonce_field( 'gmi_test_email' );
	echo '<p><button type="submit" name="gmi_test" value="1" class="button button-primary">' .
		esc_html__( 'Send the test', 'golden-mile-incentives' ) . '</button></p>';
	echo '</form></div>';
}
