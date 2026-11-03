<?php
/**
 * The offer set. This is the file you edit when the offers change.
 *
 * One entry per offer, in the order they appear on the page. Everything the
 * two shortcodes render comes from here, and so does the offer list handed to
 * the script, so the cards and the claim form cannot drift apart.
 *
 * 'key'       slug used in ?offer=<key> and in the card's Claim link
 * 'amount'    the figure, and only the figure - this is the card's display
 *             type, so keep it under about 24 characters
 * 'sub'       one line saying what the figure buys
 * 'facts'     two or three plain qualifiers
 * 'fine'      one array entry per paragraph of fine print
 * 'name'      how the offer is named back to the customer and in the lead email
 * 'loyalty'   true if this offer carries loyalty bonus cash, which reveals the
 *             ownership questions on the claim form
 *
 * @package GoldenMileIncentives
 */

defined( 'ABSPATH' ) || exit;

return array(
	array(
		'key'      => 'durango',
		'image'    => 'offer-durango.webp',
		'width'    => 1080,
		'height'   => 1045,
		'alt'      => 'Up to $10,000 in total incentives on all 2026 Dodge Durango models at Golden Mile Chrysler Dodge Jeep Ram.',
		'eyebrow'  => 'Total Incentives',
		'amount'   => 'Up to $10,000 in Total Incentives',
		'sub'      => '2026 Dodge Durango — all models',
		'facts'    => array( 'Up to $10,000', 'All 2026 Durango models' ),
		'fine'     => array(
			'Up to $10,000 in total incentives on new and previously unregistered 2026 Dodge Durango models at participating retailers in Canada, on approved credit. The amount shown is the maximum available and combines current Manufacturer Discounts, bonus cash and any applicable program incentives (and any applicable dealer contributions), which allow the dealer to sell for less. The total varies by model, trim and configuration, and not every customer or vehicle qualifies for every component. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Dodge/Durango',
		'inv_label'=> 'View Durango Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => 'Up to $10,000 in Total Incentives — 2026 Dodge Durango',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
	array(
		'key'      => 'compass',
		'image'    => 'offer-compass.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'All-Out Clearout Event: up to $7,500 in total incentives on all 2026 Jeep Compass models. Limited inventory.',
		'eyebrow'  => 'Total Incentives',
		'amount'   => 'Up to $7,500 in Total Incentives',
		'sub'      => '2026 Jeep Compass — all models',
		'facts'    => array( 'Up to $7,500', 'All 2026 Compass models', 'Limited inventory' ),
		'fine'     => array(
			'Up to $7,500 in total incentives on new and previously unregistered 2026 Jeep Compass models at participating retailers in Canada, on approved credit. The amount shown is the maximum available and combines current Manufacturer Discounts, bonus cash and any applicable program incentives (and any applicable dealer contributions), which allow the dealer to sell for less. The total varies by model, trim and configuration, and not every customer or vehicle qualifies for every component. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details. Limited inventory &mdash; offer applies while quantities last.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Jeep/Compass',
		'inv_label'=> 'View Compass Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => 'Up to $7,500 in Total Incentives — 2026 Jeep Compass',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
	array(
		'key'      => 'wrangler',
		'image'    => 'offer-wrangler-rubicon.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'All-Out Clearout Event: 0% financing for 84 months plus $1,500 loyalty bonus cash on the 2026 Jeep Wrangler 4-Door Rubicon 2.0L.',
		'eyebrow'  => 'Finance & Loyalty',
		'amount'   => '0% Financing for 84 Months + $1,500 Loyalty Bonus',
		'sub'      => '2026 Jeep Wrangler 4-Door Rubicon 2.0L',
		'facts'    => array( '0% APR', '84 months', '+ $1,500 loyalty bonus cash', 'Eligible owners' ),
		'fine'     => array(
			'Financing from 0% for up to 84 months on new and previously unregistered 2026 Jeep Wrangler 4-Door Rubicon models, at participating retailers in Canada until November 30, 2026, on approved credit. The price represents the Manufacturer’s Suggested Retail Price ("MSRP"), freight, federal A/C surcharge, applicable green levies, Luxury Tax surcharges (if applicable), Lien registration fee (up to $219, including registering agent fee, where applicable) and all other fees, levies, and duties (all of which may vary by region and retailer), minus current Manufacturer Discounts (and any applicable dealer contributions), which allow the dealer to sell for less. License, registration, insurance, specific duty on new tires (up to $15, in Quebec only), and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details. All other Trims/Models are excluded. Ends November 30, 2026.',
			'$1,500 Loyalty Bonus Cash is available to eligible owners only: you must have a Chrysler, Dodge, Jeep, Ram or FIAT&reg; vehicle registered in your name. The loyalty bonus can be combined with the finance rate shown. Proof of ownership is required at time of purchase. Offer cannot be combined with certain other pricing programs. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Jeep/Wrangler',
		'inv_label'=> 'View Wrangler Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '0% Financing for 84 Months + $1,500 Loyalty — 2026 Jeep Wrangler 4-Door Rubicon',
		'ends'     => 'November 30, 2026',
		'loyalty'  => true,
	),
	array(
		'key'      => 'grand-cherokee',
		'image'    => 'offer-grand-cherokee.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'All-Out Clearout Event: 0% financing for up to 72 months plus $1,500 loyalty bonus cash on the 2026 Jeep Grand Cherokee Summit.',
		'eyebrow'  => 'Finance & Loyalty',
		'amount'   => '0% Financing for up to 72 Months + $1,500 Loyalty Bonus',
		'sub'      => '2026 Jeep Grand Cherokee Summit',
		'facts'    => array( '0% APR', 'Up to 72 months', '+ $1,500 loyalty bonus cash', 'Eligible owners' ),
		'fine'     => array(
			'Financing from 0% for up to 72 months on new and previously unregistered 2026 Jeep Grand Cherokee models, at participating retailers in Canada until November 30, 2026, on approved credit. The price represents the Manufacturer’s Suggested Retail Price ("MSRP"), freight, federal A/C surcharge, applicable green levies, Luxury Tax surcharges (if applicable), Lien registration fee (up to $219, including registering agent fee, where applicable) and all other fees, levies, and duties (all of which may vary by region and retailer), minus current Manufacturer Discounts (and any applicable dealer contributions), which allow the dealer to sell for less. License, registration, insurance, specific duty on new tires (up to $15, in Quebec only), and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details. Ends November 30, 2026.',
			'$1,500 Loyalty Bonus Cash is available to eligible owners only: you must have a Chrysler, Dodge, Jeep, Ram or FIAT&reg; vehicle registered in your name. The loyalty bonus can be combined with the finance rate shown. Proof of ownership is required at time of purchase. Offer cannot be combined with certain other pricing programs. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Jeep/Grand-Cherokee',
		'inv_label'=> 'View Grand Cherokee Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '0% Financing for up to 72 Months + $1,500 Loyalty — 2026 Jeep Grand Cherokee Summit',
		'ends'     => 'November 30, 2026',
		'loyalty'  => true,
	),
	array(
		'key'      => 'cherokee',
		'image'    => 'offer-cherokee-hybrid.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'All-Out Clearout Event: lease most all-new 2026 Jeep Cherokee Hybrid models from 1.99% for up to 24 months.',
		'eyebrow'  => 'Lease Offer',
		'amount'   => 'Leasing from 1.99% for up to 24 Months',
		'sub'      => 'All-New 2026 Jeep Cherokee Hybrid',
		'facts'    => array( '1.99% lease rate', 'Up to 24 months', 'Most models', 'Hybrid' ),
		'fine'     => array(
			'Limited time lease offer provided through SCI Lease Corp on most new and previously unregistered 2026 Jeep Cherokee models (except (KMJL74) (8.99%)), at participating retailers in Canada until November 30, 2026, on approved credit. Example: 2026 Jeep Cherokee Overland with a RETAIL VALUE OF $57,020, leased at 1.99% for up to 24 months with $0 down payment, equals 24 monthly payments of $1,063. $0 down payment, $1,063 security deposit and first monthly payment due at lease inception. Total obligation is $25,528. Kilometre allowance 16,000/year. Cost of $0.16 per excess kilometre plus applicable taxes at lease termination. The Lease price represents the Manufacturer’s Suggested Retail Price ("MSRP"), freight, federal A/C surcharge, applicable green levies, Luxury Tax surcharges (if applicable), Lien registration fee (up to $130, including registering agent fee, where applicable), and all other fees, levies, and duties (all of which may vary by region and retailer), minus current Manufacturer Discounts (and any applicable dealer contributions), which allow the dealer to sell for less. License, registration, insurance, specific duty on new tires (up to $15, in Quebec only), and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable), but may not be available in all cases. Dealers may sell or lease for less. See your retailer for complete details. Ends November 30, 2026.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Jeep/Cherokee',
		'inv_label'=> 'View Cherokee Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '1.99% Lease for up to 24 Months — All-New 2026 Jeep Cherokee Hybrid',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
);
