<?php
/**
 * Shared PDF HTML template for proposals and invoices.
 * Layout variants mirror the on-screen web designs (1–8).
 *
 * @package DoubleScale\Modules\Documents
 *
 * @var array<string, mixed> $document Shaped document data.
 * @var string               $doc_type proposal|invoice.
 * @var array<string, string> $company Company block.
 * @var int                  $design Normalized template id 1–8.
 */

defined( 'ABSPATH' ) || exit;

$is_invoice   = 'invoice' === $doc_type;
$number_label = $is_invoice ? __( 'Invoice', 'doublescale' ) : __( 'Proposal', 'doublescale' );
$number_value = $is_invoice
	? (string) ( $document['invoice_number'] ?? '' )
	: (string) ( $document['proposal_number'] ?? '' );

$currency      = (string) ( $document['currency'] ?? 'USD' );
$line_items    = is_array( $document['line_items'] ?? null ) ? $document['line_items'] : array();
$subtotal      = (float) ( $document['subtotal'] ?? 0 );
$total_tax     = (float) ( $document['total_tax'] ?? 0 );
$discount_type = (string) ( $document['discount_type'] ?? 'none' );
$discount_val  = (float) ( $document['discount_value'] ?? 0 );
$adjustment    = (float) ( $document['adjustment'] ?? 0 );
$total         = (float) ( $document['total'] ?? 0 );
$amount_paid   = $is_invoice ? (float) ( $document['amount_paid'] ?? 0 ) : 0;
$balance       = $is_invoice ? max( 0, round( $total - $amount_paid, 2 ) ) : $total;

$design = isset( $design ) ? (int) $design : 1;

/**
 * Per-design visual config aligned with the reference images.
 *
 * variant: classic|divider|banner|sidebar|clean|wave|centered|gold
 * total_style: fill|line|soft
 */
$design_config = array(
	// Templates 1-4 mirror Propovoice's colored (primary) table header + zebra rows.
	1 => array(
		'variant'         => 'classic',
		'accent'          => '#4c6fff',
		'items_header'    => '#4c6fff',
		'items_header_fg' => '#ffffff',
		'total_bg'        => '#4c6fff',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => false,
	),
	2 => array(
		'variant'         => 'divider',
		'accent'          => '#4c6fff',
		'items_header'    => '#4c6fff',
		'items_header_fg' => '#ffffff',
		'total_bg'        => '#4c6fff',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => false,
	),
	3 => array(
		'variant'         => 'banner',
		'accent'          => '#4c6fff',
		'items_header'    => '#4c6fff',
		'items_header_fg' => '#ffffff',
		'total_bg'        => '#4c6fff',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => true,
	),
	4 => array(
		'variant'         => 'sidebar',
		'accent'          => '#4c6fff',
		'items_header'    => '#4c6fff',
		'items_header_fg' => '#ffffff',
		'total_bg'        => '#4c6fff',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => true,
	),
	// Templates 5-8 mirror Propovoice's neutral (grey) header + dark total.
	5 => array(
		'variant'         => 'clean',
		'accent'          => '#4c6fff',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#718096',
		'total_bg'        => 'transparent',
		'total_fg'        => '#1a202c',
		'total_style'     => 'line',
		'center_title'    => false,
	),
	6 => array(
		'variant'         => 'wave',
		'accent'          => '#4c6fff',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#718096',
		'total_bg'        => '#edf2f7',
		'total_fg'        => '#1a202c',
		'total_style'     => 'soft',
		'center_title'    => false,
	),
	7 => array(
		'variant'         => 'centered',
		'accent'          => '#1a202c',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#718096',
		'total_bg'        => 'transparent',
		'total_fg'        => '#1a202c',
		'total_style'     => 'line',
		'center_title'    => true,
	),
	8 => array(
		'variant'         => 'gold',
		'accent'          => '#1a202c',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#718096',
		'total_bg'        => '#edf2f7',
		'total_fg'        => '#1a202c',
		'total_style'     => 'soft',
		'center_title'    => true,
	),
);

$config = $design_config[ $design ] ?? $design_config[1];

$sanitize_color = static function ( string $color ): string {
	$color = trim( $color );
	if ( 'transparent' === $color ) {
		return 'transparent';
	}
	return preg_match( '/^#[0-9a-fA-F]{3,8}$/', $color ) ? $color : '#2d3748';
};

$variant         = (string) $config['variant'];
$accent          = $sanitize_color( (string) $config['accent'] );
$items_header_bg = $sanitize_color( (string) $config['items_header'] );
$items_header_fg = $sanitize_color( (string) $config['items_header_fg'] );
$total_bg        = $sanitize_color( (string) $config['total_bg'] );
$total_fg        = $sanitize_color( (string) $config['total_fg'] );
$total_style     = (string) $config['total_style'];
$center_title    = (bool) $config['center_title'];

$custom_accent = \DoubleScale\Modules\Documents\Constants\DocumentTemplateColor::normalize(
	$document['template_color'] ?? null
);
if ( null !== $custom_accent ) {
	$accent = $sanitize_color( $custom_accent );
	if ( 'fill' === $total_style ) {
		$items_header_bg = $accent;
		$items_header_fg = '#ffffff';
		$total_bg        = $accent;
		$total_fg        = '#ffffff';
	} elseif ( in_array( $design, array( 5, 6, 7, 8 ), true ) ) {
		$total_bg = $accent;
		$total_fg = '#ffffff';
	}
}

$format_money = static function ( float $value ) use ( $currency ): string {
	return number_format_i18n( $value, 2 ) . ' ' . $currency;
};

$discount_amount = 0.0;
if ( 'percent' === $discount_type && $discount_val > 0 ) {
	$discount_amount = round( $subtotal * ( $discount_val / 100 ), 2 );
} elseif ( 'fixed' === $discount_type && $discount_val > 0 ) {
	$discount_amount = min( $subtotal, $discount_val );
} elseif ( in_array( $discount_type, array( 'before_tax', 'after_tax' ), true ) && $discount_val > 0 ) {
	$discount_amount = $discount_val;
}

$customer_lines = array();
if ( $is_invoice ) {
	$billing = trim( (string) ( $document['billing_address'] ?? '' ) );
	if ( '' !== $billing ) {
		$customer_lines = preg_split( '/\r\n|\r|\n/', $billing ) ?: array();
	}
	if ( empty( $customer_lines ) && ! empty( $document['contact'] ) && is_array( $document['contact'] ) ) {
		$contact = $document['contact'];
		$name    = trim(
			trim( (string) ( $contact['first_name'] ?? '' ) ) . ' ' .
			trim( (string) ( $contact['last_name'] ?? '' ) )
		);
		if ( '' !== $name ) {
			$customer_lines[] = $name;
		} elseif ( ! empty( $contact['email'] ) ) {
			$customer_lines[] = (string) $contact['email'];
		}
	}
} else {
	$customer_fields = array( 'to_name', 'address', 'city', 'state', 'zip', 'country', 'email', 'phone' );
	foreach ( $customer_fields as $field ) {
		if ( ! empty( $document[ $field ] ) ) {
			$customer_lines[] = (string) $document[ $field ];
		}
	}
}

$company_lines = array();
$logo_data_uri = (string) ( $company['logo_data_uri'] ?? '' );

$company_name = trim( (string) ( $company['name'] ?? '' ) );
if ( '' === $logo_data_uri && '' !== $company_name ) {
	$company_lines[] = $company_name;
}

$address_block = trim( (string) ( $company['address'] ?? '' ) );
if ( '' !== $address_block ) {
	$address_lines = preg_split( '/\r\n|\r|\n/', $address_block ) ?: array();
	foreach ( $address_lines as $line ) {
		$line = trim( (string) $line );
		if ( '' !== $line ) {
			$company_lines[] = $line;
		}
	}
}

$url_line = trim( (string) ( $company['url'] ?? '' ) );
if ( '' !== $url_line ) {
	$company_lines[] = $url_line;
}

$bill_label   = $is_invoice ? __( 'Bill To', 'doublescale' ) : __( 'To', 'doublescale' );
$show_wave    = 'wave' === $variant;
$show_banner  = 'banner' === $variant;
$show_side    = 'sidebar' === $variant;
$show_corner  = 'centered' === $variant;
$show_gold    = 'gold' === $variant;
$show_divider = 'divider' === $variant;
$show_sign    = in_array( $variant, array( 'clean', 'wave', 'centered', 'gold' ), true );

$total_row_css = 'fill' === $total_style
	? sprintf( 'background:%s;color:%s;padding:12px 16px;', $total_bg, $total_fg )
	: ( 'line' === $total_style
		? sprintf( 'border-top:2px solid %s;color:%s;padding-top:12px;font-size:20px;', $accent, $total_fg )
		: ( in_array( $design, array( 6, 8 ), true )
			? sprintf( 'background:%s;color:%s;padding:12px 16px;', $total_bg, $total_fg )
			: sprintf( 'color:%s;padding-top:10px;font-size:18px;', $total_fg ) ) );

$wave_svg = static function ( string $fill, bool $flip = false ): string {
	if ( $flip ) {
		return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="70" viewBox="0 0 800 90" preserveAspectRatio="none"><path fill="' . esc_attr( $fill ) . '" d="M0,90 L800,90 L800,20 C640,70 520,-10 360,28 C220,60 110,20 0,50 Z"/></svg>';
	}
	return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="70" viewBox="0 0 800 90" preserveAspectRatio="none"><path fill="' . esc_attr( $fill ) . '" d="M0,0 L800,0 L800,60 C640,20 520,96 360,58 C220,26 110,70 0,36 Z"/></svg>';
};

$gold_corner_svg = static function ( string $fill, bool $flip = false ): string {
	$transform = $flip ? ' transform="rotate(180 100 100)"' : '';
	return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 200 200"><path fill="' . esc_attr( $fill ) . '"' . $transform . ' d="M0,0 H200 V60 C200,140 140,200 60,200 H0 Z"/></svg>';
};

$corner_tri_svg = static function ( string $fill ): string {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 200 200"><path fill="' . esc_attr( $fill ) . '" d="M200,0 V200 H0 C120,180 180,120 200,0 Z"/></svg>';
};
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title><?php echo esc_html( $number_label . ' ' . $number_value ); ?></title>
	<style>
		@page { margin: 0; }
		* { box-sizing: border-box; }
		body {
			font-family: DejaVu Sans, sans-serif;
			color: #2d3748;
			font-size: 12px;
			line-height: 1.5;
			margin: 0;
			padding: 0;
		}
		.page { position: relative; }
		.body-inner {
			position: relative;
			padding: <?php echo $show_side ? '38px 40px 32px 64px' : '38px 40px 32px'; ?>;
		}

		.doc-type {
			color: #1a202c;
			font-size: 30px;
			font-weight: bold;
			margin: 0 0 8px;
		}
		.doc-type.centered { text-align: center; margin-bottom: 22px; }
		.doc-number { color: #6b7688; font-size: 12px; font-weight: bold; margin: 0 0 6px; }
		.subject { color: #6b7688; font-size: 12px; margin: 0; }

		.brand { color: #1a202c; font-size: 20px; font-weight: bold; margin: 0 0 6px; }
		.brand-logo { display: block; max-height: 50px; max-width: 190px; margin-bottom: 6px; }
		.brand-line { color: #8a94a6; font-size: 11px; margin: 0 0 1px; }

		.hero { width: 100%; margin-bottom: 26px; }
		.hero td { vertical-align: top; }
		.hero .right { text-align: right; }

		.dates { margin-top: 10px; }
		.dates div { color: #4a5568; font-size: 11px; }
		.dates .label { color: #8a94a6; font-weight: bold; }
		.right .dates div { text-align: right; }

		.meta { width: 100%; margin-bottom: 26px; border-spacing: 0; }
		.meta td { vertical-align: top; width: 50%; padding-right: 16px; }
		.party-label { color: #1a202c; font-size: 14px; font-weight: bold; margin: 0 0 8px; }
		.party-line { color: #4a5568; font-size: 11px; margin: 0 0 1px; }
		.party-box { background: #f5f7fa; border-radius: 8px; padding: 14px 16px; }
		.party-highlight { background: #e8eefb; border-radius: 8px; padding: 14px 16px; }

		table.items { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
		table.items th {
			background: <?php echo esc_html( $items_header_bg ); ?>;
			color: <?php echo esc_html( $items_header_fg ); ?>;
			font-size: 10px;
			font-weight: bold;
			padding: 11px 12px;
			text-align: left;
			text-transform: uppercase;
		}
		table.items td { padding: 12px; vertical-align: top; border-bottom: 1px solid #edf0f5; color: #4a5568; font-size: 11px; }
		table.items .name { color: #1a202c; font-weight: bold; }
		table.items .desc { color: #8a94a6; font-size: 10px; }
		table.items .sl { color: #8a94a6; width: 36px; }
		.right { text-align: right; }

		.footer { width: 100%; }
		.footer td { vertical-align: top; }
		.notes { width: 55%; padding-right: 24px; }
		.section-title { color: #1a202c; font-size: 11px; font-weight: bold; margin: 0 0 3px; }
		.section-body { color: #4a5568; font-size: 11px; margin: 0 0 12px; }

		.signature { margin-top: 26px; width: 180px; }
		.signature-line { border-bottom: 1px solid #b7c0cf; height: 30px; }
		.signature-label { color: #8a94a6; font-size: 11px; font-weight: bold; }

		table.totals { width: 100%; border-collapse: collapse; }
		<?php if ( 'soft' === $total_style ) : ?>
		.totals-wrap { background: #eef1f6; border-radius: 8px; padding: 12px 16px; }
		<?php endif; ?>
		table.totals th { color: #8a94a6; font-weight: normal; text-align: left; padding: 6px 0; font-size: 12px; }
		table.totals td { color: #2d3748; font-weight: bold; text-align: right; padding: 6px 0; font-size: 12px; }
		table.totals .total-row th,
		table.totals .total-row td {
			<?php echo $total_row_css; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- sanitized colors above. ?>
			font-weight: bold;
		}

		.banner {
			background: #1a202c;
			color: #fff;
			padding: 22px 40px;
			width: 100%;
		}
		.banner td { vertical-align: middle; }
		.banner .brand, .banner .brand-line { color: #fff; }
		.banner .brand-line { color: #cbd5e0; }
		.banner-title { color: #fff; font-size: 28px; font-weight: bold; text-align: right; }

		.divider-bar { background: <?php echo esc_html( $accent ); ?>; height: 6px; width: 100%; margin: 0 0 22px; }

		.side-tab {
			position: absolute; left: 0; top: 0; bottom: 0; width: 44px;
			background: <?php echo esc_html( $accent ); ?>;
		}
		.side-tab span {
			color: #fff; font-size: 18px; font-weight: bold;
		}

		.ornament { position: absolute; line-height: 0; }
		.ornament-wave-top { top: 0; left: 0; right: 0; }
		.ornament-wave-bottom { bottom: 0; left: 0; right: 0; }
		.ornament-tl { top: 0; left: 0; }
		.ornament-br { bottom: 0; right: 0; }

		.muted { color: #8a94a6; font-size: 11px; }
	</style>
</head>
<body>
<div class="page">

	<?php if ( $show_wave ) : ?>
		<div class="ornament ornament-wave-top"><?php echo $wave_svg( $accent ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
		<div class="ornament ornament-wave-bottom"><?php echo $wave_svg( $accent, true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
	<?php endif; ?>

	<?php if ( $show_gold ) : ?>
		<div class="ornament ornament-tl"><?php echo $gold_corner_svg( $accent, true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
		<div class="ornament ornament-br"><?php echo $gold_corner_svg( $accent ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
	<?php endif; ?>

	<?php if ( $show_corner ) : ?>
		<div class="ornament ornament-br"><?php echo $corner_tri_svg( $accent ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
	<?php endif; ?>

	<?php if ( $show_side ) : ?>
		<table class="side-tab" style="height:100%;"><tr><td style="text-align:center;vertical-align:middle;"><span><?php echo esc_html( $number_label ); ?></span></td></tr></table>
	<?php endif; ?>

	<?php if ( $show_banner ) : ?>
		<table class="banner">
			<tr>
				<td>
					<?php if ( '' !== $logo_data_uri ) : ?>
						<img class="brand-logo" src="<?php echo esc_attr( $logo_data_uri ); ?>" alt="<?php echo esc_attr( $company_name ); ?>" />
					<?php else : ?>
						<div class="brand"><?php echo esc_html( '' !== $company_name ? $company_name : $number_label ); ?></div>
					<?php endif; ?>
					<?php foreach ( array_slice( $company_lines, '' === $logo_data_uri ? 1 : 0 ) as $line ) : ?>
						<p class="brand-line"><?php echo esc_html( $line ); ?></p>
					<?php endforeach; ?>
				</td>
				<td class="banner-title"><?php echo esc_html( $number_label ); ?></td>
			</tr>
		</table>
	<?php endif; ?>

	<div class="body-inner">

		<?php if ( $show_corner || $show_gold ) : ?>
			<div class="doc-type centered"><?php echo esc_html( $number_label ); ?></div>
		<?php endif; ?>

		<?php if ( ! $show_banner ) : ?>
			<table class="hero">
				<tr>
					<td>
						<?php if ( '' !== $logo_data_uri ) : ?>
							<img class="brand-logo" src="<?php echo esc_attr( $logo_data_uri ); ?>" alt="<?php echo esc_attr( $company_name ); ?>" />
						<?php else : ?>
							<div class="brand"><?php echo esc_html( '' !== $company_name ? $company_name : $number_label ); ?></div>
						<?php endif; ?>
						<?php foreach ( array_slice( $company_lines, '' === $logo_data_uri ? 1 : 0 ) as $line ) : ?>
							<p class="brand-line"><?php echo esc_html( $line ); ?></p>
						<?php endforeach; ?>
					</td>
					<td class="right">
						<?php if ( ! $show_corner && ! $show_gold ) : ?>
							<div class="doc-type"><?php echo esc_html( $number_label ); ?></div>
						<?php endif; ?>
						<?php if ( ! $show_side && ! $show_wave && ! $show_corner && ! $show_gold ) : ?>
							<div class="doc-number"><?php echo esc_html( $number_value ); ?></div>
						<?php endif; ?>
						<?php if ( in_array( $variant, array( 'clean', 'wave', 'centered', 'gold', 'sidebar', 'divider' ), true ) && $customer_lines ) : ?>
							<div class="party-label" style="margin-top:6px;"><?php echo esc_html( $bill_label ); ?></div>
							<?php foreach ( $customer_lines as $line ) : ?>
								<p class="party-line"><?php echo esc_html( trim( (string) $line ) ); ?></p>
							<?php endforeach; ?>
						<?php endif; ?>
						<div class="dates">
							<?php if ( $is_invoice ) : ?>
								<div><span class="label"><?php esc_html_e( 'Invoice Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['invoice_date'] ?? '—' ) ); ?></div>
								<div><span class="label"><?php esc_html_e( 'Due Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['due_date'] ?? '—' ) ); ?></div>
							<?php else : ?>
								<div><span class="label"><?php esc_html_e( 'Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['date'] ?? '—' ) ); ?></div>
								<div><span class="label"><?php esc_html_e( 'Open Till', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['open_till'] ?? '—' ) ); ?></div>
							<?php endif; ?>
							<div><span class="label"><?php esc_html_e( 'Currency', 'doublescale' ); ?>:</span> <?php echo esc_html( $currency ); ?></div>
						</div>
					</td>
				</tr>
			</table>
		<?php endif; ?>

		<?php if ( $show_divider ) : ?>
			<div class="divider-bar"></div>
		<?php endif; ?>

		<?php // Two-column From / Bill To block (classic, divider, banner). ?>
		<?php if ( in_array( $variant, array( 'classic', 'divider', 'banner' ), true ) ) : ?>
			<table class="meta">
				<tr>
					<td>
						<div class="<?php echo $show_divider ? 'party-box' : ''; ?>">
							<div class="party-label"><?php esc_html_e( 'From', 'doublescale' ); ?></div>
							<?php if ( $show_banner && '' !== $logo_data_uri ) : ?>
								<img class="brand-logo" src="<?php echo esc_attr( $logo_data_uri ); ?>" alt="" style="max-height:40px;" />
							<?php endif; ?>
							<?php foreach ( $company_lines as $line ) : ?>
								<p class="party-line"><?php echo esc_html( $line ); ?></p>
							<?php endforeach; ?>
						</div>
					</td>
					<td>
						<div class="<?php echo $show_divider ? 'party-box' : ( $show_banner ? 'party-highlight' : '' ); ?>">
							<div class="party-label"><?php echo esc_html( $bill_label ); ?></div>
							<?php if ( $customer_lines ) : ?>
								<?php foreach ( $customer_lines as $line ) : ?>
									<p class="party-line"><?php echo esc_html( trim( (string) $line ) ); ?></p>
								<?php endforeach; ?>
							<?php else : ?>
								<p class="party-line">—</p>
							<?php endif; ?>
						</div>
					</td>
				</tr>
			</table>
		<?php endif; ?>

		<table class="items">
			<thead>
				<tr>
					<?php $show_sl = in_array( $variant, array( 'classic', 'divider', 'banner', 'sidebar' ), true ); ?>
					<?php if ( $show_sl ) : ?>
						<th class="sl"><?php esc_html_e( 'SL.', 'doublescale' ); ?></th>
					<?php endif; ?>
					<th><?php esc_html_e( 'Item Description', 'doublescale' ); ?></th>
					<th class="right"><?php esc_html_e( 'Unit', 'doublescale' ); ?></th>
					<th class="right"><?php esc_html_e( 'Rate', 'doublescale' ); ?></th>
					<?php if ( $is_invoice ) : ?>
						<th class="right"><?php esc_html_e( 'Tax', 'doublescale' ); ?></th>
					<?php endif; ?>
					<th class="right"><?php esc_html_e( 'Amount', 'doublescale' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php
				$has_rows = false;
				$row_no   = 0;
				foreach ( $line_items as $item ) :
					if ( ! empty( $item['optional'] ) ) {
						continue;
					}
					$has_rows = true;
					++$row_no;
					$qty    = (float) ( $item['qty'] ?? 0 );
					$rate   = (float) ( $item['rate'] ?? 0 );
					$amount = (float) ( $item['amount'] ?? ( $qty * $rate ) );
					$taxes  = array();
					if ( ! empty( $item['tax'] ) && is_array( $item['tax'] ) ) {
						foreach ( $item['tax'] as $tax ) {
							if ( isset( $tax['name'], $tax['rate'] ) ) {
								$taxes[] = $tax['name'] . ' (' . $tax['rate'] . '%)';
							}
						}
					}
					?>
					<tr>
						<?php if ( $show_sl ) : ?>
							<td class="sl"><?php echo esc_html( str_pad( (string) $row_no, 2, '0', STR_PAD_LEFT ) . '.' ); ?></td>
						<?php endif; ?>
						<td>
							<span class="name"><?php echo esc_html( (string) ( $item['description'] ?? '—' ) ); ?></span>
							<?php if ( ! empty( $item['long_description'] ) ) : ?>
								<br><span class="desc"><?php echo esc_html( (string) $item['long_description'] ); ?></span>
							<?php endif; ?>
						</td>
						<td class="right"><?php echo esc_html( (string) $qty ); ?></td>
						<td class="right"><?php echo esc_html( $format_money( $rate ) ); ?></td>
						<?php if ( $is_invoice ) : ?>
							<td class="right"><?php echo esc_html( $taxes ? implode( ', ', $taxes ) : '—' ); ?></td>
						<?php endif; ?>
						<td class="right"><?php echo esc_html( $format_money( $amount ) ); ?></td>
					</tr>
				<?php endforeach; ?>
				<?php if ( ! $has_rows ) : ?>
					<tr>
						<td colspan="<?php echo (int) ( ( $show_sl ? 1 : 0 ) + ( $is_invoice ? 5 : 4 ) ); ?>" class="muted"><?php esc_html_e( 'No line items.', 'doublescale' ); ?></td>
					</tr>
				<?php endif; ?>
			</tbody>
		</table>

		<table class="footer">
			<tr>
				<td class="notes">
					<?php if ( $is_invoice && ! empty( $document['client_note'] ) ) : ?>
						<div class="section-title"><?php esc_html_e( 'Note', 'doublescale' ); ?></div>
						<p class="section-body"><?php echo esc_html( (string) $document['client_note'] ); ?></p>
					<?php endif; ?>
					<?php if ( $is_invoice && ! empty( $document['terms'] ) ) : ?>
						<div class="section-title"><?php esc_html_e( 'T&C', 'doublescale' ); ?></div>
						<p class="section-body"><?php echo esc_html( (string) $document['terms'] ); ?></p>
					<?php endif; ?>
					<?php if ( $show_sign ) : ?>
						<div class="signature">
							<div class="signature-line"></div>
						</div>
					<?php endif; ?>
				</td>
				<td style="width:42%;">
					<div class="<?php echo 'soft' === $total_style ? 'totals-wrap' : ''; ?>">
						<table class="totals">
							<tr>
								<th><?php esc_html_e( 'Subtotal', 'doublescale' ); ?></th>
								<td><?php echo esc_html( $format_money( $subtotal ) ); ?></td>
							</tr>
							<?php if ( $is_invoice && $total_tax > 0 ) : ?>
								<tr>
									<th><?php esc_html_e( 'Tax', 'doublescale' ); ?></th>
									<td><?php echo esc_html( $format_money( $total_tax ) ); ?></td>
								</tr>
							<?php endif; ?>
							<?php if ( $discount_amount > 0 ) : ?>
								<tr>
									<th><?php esc_html_e( 'Discount', 'doublescale' ); ?></th>
									<td>-<?php echo esc_html( $format_money( $discount_amount ) ); ?></td>
								</tr>
							<?php endif; ?>
							<?php if ( 0.0 !== $adjustment ) : ?>
								<tr>
									<th><?php esc_html_e( 'Adjustment', 'doublescale' ); ?></th>
									<td><?php echo esc_html( $format_money( $adjustment ) ); ?></td>
								</tr>
							<?php endif; ?>
							<tr class="total-row">
								<th><?php esc_html_e( 'Total', 'doublescale' ); ?></th>
								<td><?php echo esc_html( $format_money( $total ) ); ?></td>
							</tr>
							<?php if ( $is_invoice ) : ?>
								<tr>
									<th><?php esc_html_e( 'Amount Paid', 'doublescale' ); ?></th>
									<td><?php echo esc_html( $format_money( $amount_paid ) ); ?></td>
								</tr>
								<tr>
									<th><?php esc_html_e( 'Balance Due', 'doublescale' ); ?></th>
									<td><?php echo esc_html( $format_money( $balance ) ); ?></td>
								</tr>
							<?php endif; ?>
						</table>
					</div>
				</td>
			</tr>
		</table>
	</div>
</div>
</body>
</html>
