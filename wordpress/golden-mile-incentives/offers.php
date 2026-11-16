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
		'alt'      => 'Black Friday Sales Event: up to $10,000 in total incentives on the 2026 Dodge Durango at Golden Mile Chrysler Dodge Jeep Ram.',
		'eyebrow'  => 'Total Incentives',
		'amount'   => 'Up to $10,000 in Total Incentives',
		'sub'      => '2026 Dodge Durango',
		'facts'    => array( 'Up to $10,000', 'In total incentives', '2026 Durango' ),
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
		'alt'      => 'Black Friday Sales Event: up to $7,500 in total incentives on the 2026 Jeep Compass at Golden Mile Chrysler Dodge Jeep Ram.',
		'eyebrow'  => 'Total Incentives',
		'amount'   => 'Up to $7,500 in Total Incentives',
		'sub'      => '2026 Jeep Compass',
		'facts'    => array( 'Up to $7,500', 'In total incentives', '2026 Compass' ),
		'fine'     => array(
			'Up to $7,500 in total incentives on new and previously unregistered 2026 Jeep Compass models at participating retailers in Canada, on approved credit. The amount shown is the maximum available and combines current Manufacturer Discounts, bonus cash and any applicable program incentives (and any applicable dealer contributions), which allow the dealer to sell for less. The total varies by model, trim and configuration, and not every customer or vehicle qualifies for every component. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details.',
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
		'alt'      => 'Black Friday Sales Event: 0% financing for up to 84 months plus $4,500 in Black Friday incentives on the 2026 Jeep Wrangler 4-Door Rubicon 2.0L.',
		'eyebrow'  => 'Finance & Black Friday Incentives',
		'amount'   => '0% for 84 Months + $4,500',
		'sub'      => '2026 Jeep Wrangler 4-Door Rubicon 2.0L',
		'facts'    => array( '0% financing', 'Up to 84 months', '+ $4,500 in Black Friday incentives', 'Limited inventory' ),
		'fine'     => array(
			'Financing from 0% for up to 84 months on new and previously unregistered 2026 Jeep Wrangler 4-Door Rubicon 2.0L models, at participating retailers in Canada until November 30, 2026, on approved credit. Limited inventory at participating dealers. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. All other trims and models are excluded. See dealer for complete details.',
			'$4,500 in Black Friday incentives applies to the same 2026 Jeep Wrangler 4-Door Rubicon 2.0L models and can be combined with the finance rate shown. The amount is the maximum available, varies by configuration, and not every vehicle qualifies. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Jeep/Wrangler',
		'inv_label'=> 'View Wrangler Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '0% Financing for 84 Months + $4,500 in Black Friday Incentives — 2026 Jeep Wrangler 4-Door Rubicon 2.0L',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
	array(
		'key'      => 'grand-cherokee',
		'image'    => 'offer-grand-cherokee.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'Black Friday Sales Event: 0% financing for up to 72 months plus $4,500 in Black Friday incentives on the 2026 Jeep Grand Cherokee Summit 4x4.',
		'eyebrow'  => 'Finance & Black Friday Incentives',
		'amount'   => '0% for 72 Months + $4,500',
		'sub'      => '2026 Jeep Grand Cherokee Summit 4x4',
		'facts'    => array( '0% financing', 'Up to 72 months', '+ $4,500 in Black Friday incentives', 'Limited inventory' ),
		'fine'     => array(
			'Financing from 0% for up to 72 months on new and previously unregistered 2026 Jeep Grand Cherokee Summit 4x4 models, at participating retailers in Canada until November 30, 2026, on approved credit. Limited inventory at participating dealers. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. All other trims and models are excluded. See dealer for complete details.',
			'$4,500 in Black Friday incentives applies to the same 2026 Jeep Grand Cherokee Summit 4x4 models and can be combined with the finance rate shown. The amount is the maximum available, varies by configuration, and not every vehicle qualifies. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Jeep/Grand-Cherokee',
		'inv_label'=> 'View Grand Cherokee Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '0% Financing for up to 72 Months + $4,500 in Black Friday Incentives — 2026 Jeep Grand Cherokee Summit 4x4',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
	array(
		'key'      => 'cherokee',
		'image'    => 'offer-cherokee-hybrid.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'Black Friday Sales Event: lease most all-new 2026 Jeep Cherokee Hybrid models from 1.99% for up to 24 months.',
		'eyebrow'  => 'Lease Offer',
		'amount'   => 'Lease from 1.99% for 24 Months',
		'sub'      => 'All-New 2026 Jeep Cherokee Hybrid',
		'facts'    => array( '1.99% lease rate', 'Up to 24 months', 'On most models' ),
		'fine'     => array(
			'Leasing from 1.99% for up to 24 months on most new and previously unregistered all-new 2026 Jeep Cherokee Hybrid models at participating retailers in Canada until November 30, 2026, on approved credit. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Jeep/Cherokee',
		'inv_label'=> 'View Cherokee Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '1.99% Lease for up to 24 Months — All-New 2026 Jeep Cherokee Hybrid',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
	array(
		'key'      => 'ram-1500',
		'image'    => 'offer-ram-1500.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'Black Friday Sales Event: 0% financing for up to 84 months plus up to $5,000 loyalty bonus cash on the 2026 Ram 1500 Big Horn and RHO Crew Cab 4x4.',
		'eyebrow'  => 'Finance & Loyalty',
		'amount'   => '0% for 84 Months + Up to $5,000',
		'sub'      => '2026 Ram 1500 Big Horn & RHO Crew Cab 4x4',
		'facts'    => array( '0% financing', 'Up to 84 months', '+ up to $5,000 loyalty bonus cash', 'Eligible owners' ),
		'fine'     => array(
			'Financing from 0% for up to 84 months on new and previously unregistered 2026 Ram 1500 Big Horn Crew Cab 4x4 and 2026 Ram 1500 RHO Crew Cab 4x4 models at participating retailers in Canada until November 30, 2026, on approved credit. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details.',
			'Loyalty Bonus Cash of up to $5,000 is available to eligible owners only ($5,000 on RHO models): you must have a Chrysler, Dodge, Jeep, Ram or FIAT® vehicle registered in your name. The amount varies by model and configuration and can be combined with the finance rate shown. Proof of ownership is required at time of purchase. Offer cannot be combined with certain other pricing programs. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Ram/1500',
		'inv_label'=> 'View Ram 1500 Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '0% Financing for 84 Months + Up to $5,000 Loyalty Bonus Cash — 2026 Ram 1500 Big Horn & RHO Crew Cab 4x4',
		'ends'     => 'November 30, 2026',
		'loyalty'  => true,
	),
	array(
		'key'      => 'ram-hd',
		'image'    => 'offer-ram-hd.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'Black Friday Sales Event: no-charge Cummins Turbo Diesel worth $11,000 in total value plus $1,500 loyalty bonus cash on the 2026 Ram Heavy Duty pickup.',
		'eyebrow'  => 'No-Charge Cummins',
		'amount'   => 'No-Charge Cummins Turbo Diesel',
		'sub'      => '2026 Ram Heavy Duty Pickup',
		'facts'    => array( '$11,000 total value', '+ $1,500 loyalty bonus cash', 'On most pickup models' ),
		'fine'     => array(
			'No-charge Cummins® Turbo Diesel engine, an $11,000 total value, on eligible new and previously unregistered 2026 Ram Heavy Duty pickup models at participating retailers in Canada until November 30, 2026. The total value shown is the maximum available and varies by model, trim and configuration; not every vehicle qualifies. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details.',
			'$1,500 Loyalty Bonus Cash is available to eligible owners only, on most 2026 Ram Heavy Duty pickup models: you must have a Chrysler, Dodge, Jeep, Ram or FIAT® vehicle registered in your name. Proof of ownership is required at time of purchase. Offer cannot be combined with certain other pricing programs. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Ram/2500',
		'inv_label'=> 'View Ram HD Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => 'No-Charge Cummins Turbo Diesel ($11,000 Total Value) + $1,500 Loyalty Bonus Cash — 2026 Ram Heavy Duty Pickup',
		'ends'     => 'November 30, 2026',
		'loyalty'  => true,
	),
	array(
		'key'      => 'pacifica',
		'image'    => 'offer-pacifica.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'Black Friday Sales Event: 0% financing for up to 36 months or lease from 3.99% for up to 36 months on the 2027 Chrysler Pacifica.',
		'eyebrow'  => 'Finance or Lease',
		'amount'   => '0% for 36 Months',
		'sub'      => '2027 Chrysler Pacifica — or lease from 3.99%',
		'facts'    => array( '0% financing up to 36 months', 'Or lease from 3.99%', 'Up to 36 months' ),
		'fine'     => array(
			'Financing from 0% for up to 36 months, or leasing from 3.99% for up to 36 months, on new and previously unregistered 2027 Chrysler Pacifica models at participating retailers in Canada until November 30, 2026, on approved credit. The finance and lease offers cannot be combined. License, registration, insurance and applicable taxes are extra and will be due at signing. Offer may be modified or terminated without notice. A deposit may be required. Dealer trade may be necessary (where applicable, but may not be available in all cases). Dealers may sell for less. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Chrysler/Pacifica',
		'inv_label'=> 'View Pacifica Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => '0% Financing for 36 Months or Lease from 3.99% — 2027 Chrysler Pacifica',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
	array(
		'key'      => 'grand-caravan',
		'image'    => 'offer-grand-caravan.webp',
		'width'    => 1080,
		'height'   => 1080,
		'alt'      => 'Black Friday Sales Event: the 2027 Chrysler Grand Caravan, assembled in Canada, starting at $50,995.',
		'eyebrow'  => 'Starting Price',
		'amount'   => 'Starting at $50,995',
		'sub'      => '2027 Chrysler Grand Caravan',
		'facts'    => array( 'Stow ‘n Go® seating', 'Leather faced seats', 'Heated seats & steering wheel', 'Power sliding doors' ),
		'fine'     => array(
			'Starting price of $50,995 applies to a new and previously unregistered 2027 Chrysler Grand Caravan at participating retailers in Canada until November 30, 2026. Price shown is the Manufacturer’s Suggested Retail Price and includes freight, federal A/C surcharge, applicable green levies and other fees, levies and duties (all of which may vary by region and retailer), minus current Manufacturer Discounts (and any applicable dealer contributions), which allow the dealer to sell for less. License, registration, insurance and applicable taxes are extra and will be due at signing. Features listed are available on specific trims and may not be standard on the model shown at the starting price. Vehicles are assembled in Canada using international parts. Offer may be modified or terminated without notice. Dealers may sell for less. See dealer for complete details.',
		),
		'cta'      => 'Claim This Offer',
		'inv_path' => '/new/Chrysler/Grand-Caravan',
		'inv_label'=> 'View Grand Caravan Inventory',
		'expiry'   => 'Offer ends November 30, 2026',
		'name'     => 'Starting at $50,995 — 2027 Chrysler Grand Caravan',
		'ends'     => 'November 30, 2026',
		'loyalty'  => false,
	),
);
