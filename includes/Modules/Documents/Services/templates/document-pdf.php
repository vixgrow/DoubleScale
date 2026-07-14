<?php
/**
 * Shared PDF HTML template for proposals and invoices.
 * Layout variants mirror the Propovoice-inspired web designs (1–8).
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
 * Per-design visual config aligned with web `designs.scss`.
 *
 * variant: classic|corners|corners-quad|wave|minimal|boxed|bar|sidebar
 * total_style: fill|line|soft
 */
$design_config = array(
	1 => array(
		'variant'         => 'classic',
		'accent'          => '#4c6fff',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#2d3748',
		'total_bg'        => '#2d3748',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => false,
		'boxed_parties'   => false,
	),
	2 => array(
		'variant'         => 'corners-quad',
		'accent'          => '#0095ff',
		'items_header'    => '#0095ff',
		'items_header_fg' => '#ffffff',
		'total_bg'        => '#0095ff',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => false,
		'boxed_parties'   => false,
	),
	3 => array(
		'variant'         => 'corners',
		'accent'          => '#4c6fff',
		'items_header'    => '#a0aec0',
		'items_header_fg' => '#ffffff',
		'total_bg'        => '#4c6fff',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => true,
		'boxed_parties'   => false,
	),
	4 => array(
		'variant'         => 'wave',
		'accent'          => '#c6a96b',
		'items_header'    => '#c6a96b',
		'items_header_fg' => '#ffffff',
		'total_bg'        => '#c6a96b',
		'total_fg'        => '#ffffff',
		'total_style'     => 'fill',
		'center_title'    => true,
		'boxed_parties'   => false,
	),
	5 => array(
		'variant'         => 'minimal',
		'accent'          => '#c5d4e3',
		'items_header'    => '#c5d4e3',
		'items_header_fg' => '#ffffff',
		'total_bg'        => 'transparent',
		'total_fg'        => '#1a202c',
		'total_style'     => 'line',
		'center_title'    => false,
		'boxed_parties'   => false,
	),
	6 => array(
		'variant'         => 'boxed',
		'accent'          => '#1a202c',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#718096',
		'total_bg'        => '#edf2f7',
		'total_fg'        => '#1a202c',
		'total_style'     => 'soft',
		'center_title'    => false,
		'boxed_parties'   => true,
	),
	7 => array(
		'variant'         => 'bar',
		'accent'          => '#1a202c',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#718096',
		'total_bg'        => 'transparent',
		'total_fg'        => '#1a202c',
		'total_style'     => 'line',
		'center_title'    => false,
		'boxed_parties'   => true,
	),
	8 => array(
		'variant'         => 'sidebar',
		'accent'          => '#edf2f7',
		'items_header'    => '#edf2f7',
		'items_header_fg' => '#718096',
		'total_bg'        => '#edf2f7',
		'total_fg'        => '#1a202c',
		'total_style'     => 'soft',
		'center_title'    => false,
		'boxed_parties'   => false,
	),
);

$config = $design_config[ $design ] ?? $design_config[1];

$sanitize_color = static function ( string $color ): string {
	$color = trim( $color );
	if ( 'transparent' === $color ) {
		return 'transparent';
	}
	return preg_match( '/^#[0-9a-fA-F]{3,8}$/', $color ) ? $color : '#4c6fff';
};

$variant         = (string) $config['variant'];
$accent          = $sanitize_color( (string) $config['accent'] );
$items_header_bg = $sanitize_color( (string) $config['items_header'] );
$items_header_fg = $sanitize_color( (string) $config['items_header_fg'] );
$total_bg        = $sanitize_color( (string) $config['total_bg'] );
$total_fg        = $sanitize_color( (string) $config['total_fg'] );
$total_style     = (string) $config['total_style'];
$center_title    = (bool) $config['center_title'];
$boxed_parties   = (bool) $config['boxed_parties'];

$custom_accent = \DoubleScale\Modules\Documents\Constants\DocumentTemplateColor::normalize(
	$document['template_color'] ?? null
);
if ( null !== $custom_accent ) {
	$accent          = $sanitize_color( $custom_accent );
	$items_header_bg = $accent;
	$items_header_fg = '#ffffff';
	if ( 'fill' === $total_style ) {
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

$company_lines = array_filter(
	array(
		(string) ( $company['name'] ?? '' ),
		(string) ( $company['address'] ?? '' ),
		(string) ( $company['url'] ?? '' ),
	)
);

$bill_label = $is_invoice ? __( 'Bill To', 'doublescale' ) : __( 'To', 'doublescale' );
$show_wave  = 'wave' === $variant;
$show_quad  = 'corners-quad' === $variant;
$show_pair  = 'corners' === $variant;
$show_bar   = 'bar' === $variant;
$show_side  = 'sidebar' === $variant;
$show_slant = 'boxed' === $variant;

$total_row_css = 'fill' === $total_style
	? sprintf( 'background:%s;color:%s;padding:10px 12px;', $total_bg, $total_fg )
	: ( 'line' === $total_style
		? sprintf( 'border-top:2px solid #1a202c;color:%s;padding-top:10px;font-size:16px;', $total_fg )
		: sprintf( 'background:%s;color:%s;padding:10px 12px;', $total_bg, $total_fg ) );

$corner_svg = static function ( string $fill, string $flip = '' ): string {
	$path = 'M0,0 H180 C140,18 110,55 95,95 C70,150 30,140 0,140 Z';
	$transform = '';
	if ( 'x' === $flip ) {
		$transform = ' transform="translate(180,0) scale(-1,1)"';
	} elseif ( 'y' === $flip ) {
		$transform = ' transform="translate(0,140) scale(1,-1)"';
	} elseif ( 'xy' === $flip ) {
		$transform = ' transform="translate(180,140) scale(-1,-1)"';
	}
	return '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="110" viewBox="0 0 180 140"><path fill="' . esc_attr( $fill ) . '"' . $transform . ' d="' . $path . '"/></svg>';
};

$wave_svg = static function ( string $fill, bool $flip_y = false ): string {
	if ( $flip_y ) {
		return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="28" viewBox="0 0 800 36" preserveAspectRatio="none"><path fill="' . esc_attr( $fill ) . '" d="M0,36 H800 V18 C733,2 667,28 600,16 C533,4 467,30 400,16 C333,2 267,28 200,16 C133,4 67,30 0,18 Z"/></svg>';
	}
	return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="28" viewBox="0 0 800 36" preserveAspectRatio="none"><path fill="' . esc_attr( $fill ) . '" d="M0,0 H800 V18 C733,34 667,8 600,20 C533,32 467,6 400,20 C333,34 267,8 200,20 C133,32 67,6 0,18 Z"/></svg>';
};
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title><?php echo esc_html( $number_label . ' ' . $number_value ); ?></title>
	<style>
		@page { margin: 28px 32px; }
		* { box-sizing: border-box; }
		body {
			font-family: DejaVu Sans, sans-serif;
			color: #1a202c;
			font-size: 12px;
			line-height: 1.45;
			margin: 0;
			padding: 0;
		}
		.page {
			position: relative;
			overflow: hidden;
			min-height: 980px;
		}
		.body-inner {
			position: relative;
			z-index: 2;
			padding: <?php echo $show_side ? '18px 18px 18px 56px' : '18px 8px 12px'; ?>;
		}
		.ornament { position: absolute; z-index: 1; line-height: 0; }
		.ornament-tl { top: 0; left: 0; width: 140px; }
		.ornament-tr { top: 0; right: 0; width: 140px; }
		.ornament-bl { bottom: 0; left: 0; width: 140px; }
		.ornament-br { bottom: 0; right: 0; width: 140px; }
		.ornament-wave-top { top: 0; left: 0; right: 0; width: 100%; }
		.ornament-wave-bottom { bottom: 0; left: 0; right: 0; width: 100%; }

		.side-tab {
			position: absolute;
			left: 0;
			top: 220px;
			width: 36px;
			background: #edf2f7;
			border-radius: 0 8px 8px 0;
			padding: 28px 6px;
			z-index: 3;
			text-align: center;
		}
		.side-tab span {
			display: block;
			font-size: 11px;
			font-weight: 700;
			color: #1a202c;
			letter-spacing: 0.04em;
			word-break: break-all;
			line-height: 1.2;
		}

		.title-bar {
			background: <?php echo esc_html( $accent ); ?>;
			color: #fff;
			padding: 12px 16px;
			margin: -18px -8px 18px;
		}
		.title-bar table { width: 100%; }
		.title-bar .brand { font-size: 12px; opacity: 0.85; }
		.title-bar .doc-title { font-size: 18px; font-weight: 700; text-align: right; }

		.slant-bar {
			width: 180px;
			height: 8px;
			background: <?php echo esc_html( $accent ); ?>;
			margin-bottom: 14px;
		}

		.doc-type {
			font-size: 20px;
			font-weight: 700;
			margin: 0 0 4px;
			color: #1a202c;
		}
		.doc-number { font-size: 13px; font-weight: 600; margin: 0 0 4px; }
		.subject { color: #4a5568; font-size: 12px; margin: 0; }
		.header { width: 100%; margin-bottom: 16px; }
		.header td { vertical-align: top; }
		.header.centered { text-align: center; }
		.header.centered .dates { text-align: center; }
		.dates { text-align: right; font-size: 11px; color: #4a5568; }
		.dates .label { color: #718096; }

		.meta { width: 100%; margin-bottom: 18px; border-collapse: separate; border-spacing: 10px 0; }
		.meta td { vertical-align: top; width: 50%; }
		.party-box {
			<?php if ( $boxed_parties ) : ?>
			border: 1px solid #edf2f7;
			border-radius: 6px;
			padding: 12px 14px;
			<?php endif; ?>
		}
		.party-label { font-size: 12px; font-weight: 700; margin: 0 0 6px; }
		.party-line { color: #4a5568; font-size: 11px; margin: 0 0 2px; }

		table.items { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
		table.items th, table.items td { padding: 8px 6px; text-align: left; vertical-align: top; }
		table.items th {
			background: <?php echo esc_html( $items_header_bg ); ?>;
			color: <?php echo esc_html( $items_header_fg ); ?>;
			font-size: 11px;
			font-weight: 700;
			text-transform: none;
		}
		table.items tbody tr:nth-child(even) td { background: #f7fafc; }
		table.items .desc { color: #718096; font-size: 10px; }
		.right { text-align: right; }

		.footer { width: 100%; margin-top: 8px; }
		.footer td { vertical-align: top; }
		.notes { width: 55%; padding-right: 16px; }
		.section-title { font-size: 11px; font-weight: 700; margin: 0 0 3px; }
		.section-body { color: #4a5568; font-size: 11px; margin: 0 0 10px; }

		table.totals { width: 100%; border-collapse: collapse; }
		<?php if ( 'soft' === $total_style || 'boxed' === $variant ) : ?>
		.totals-wrap {
			background: #edf2f7;
			border-radius: 8px;
			padding: 10px 12px;
		}
		<?php endif; ?>
		table.totals th, table.totals td { padding: 5px 0; }
		table.totals th { text-align: left; color: #718096; font-weight: normal; }
		table.totals td { text-align: right; font-weight: 600; }
		table.totals .total-row th,
		table.totals .total-row td {
			<?php echo $total_row_css; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- sanitized colors above. ?>
			font-weight: 700;
		}

		.muted { color: #718096; font-size: 11px; }
		.divider { border-bottom: 1px solid #d6e2ef; margin: 0 0 14px; padding-bottom: 10px; }
	</style>
</head>
<body>
<div class="page design-<?php echo (int) $design; ?> variant-<?php echo esc_attr( $variant ); ?>">

	<?php if ( $show_wave ) : ?>
		<div class="ornament ornament-wave-top"><?php echo $wave_svg( $accent ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
		<div class="ornament ornament-wave-bottom"><?php echo $wave_svg( $accent, true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
	<?php endif; ?>

	<?php if ( $show_quad || $show_pair ) : ?>
		<div class="ornament ornament-tl"><?php echo $corner_svg( $accent ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
		<?php if ( $show_quad ) : ?>
			<div class="ornament ornament-tr"><?php echo $corner_svg( $accent, 'x' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
			<div class="ornament ornament-bl"><?php echo $corner_svg( $accent, 'y' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
		<?php endif; ?>
		<div class="ornament ornament-br"><?php echo $corner_svg( $accent, 'xy' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
	<?php endif; ?>

	<?php if ( $show_side ) : ?>
		<div class="side-tab"><span><?php echo esc_html( $number_label ); ?></span></div>
	<?php endif; ?>

	<div class="body-inner">
		<?php if ( $show_bar ) : ?>
			<div class="title-bar">
				<table>
					<tr>
						<td class="brand"><?php echo esc_html( (string) ( $company['name'] ?? $number_label ) ); ?></td>
						<td class="doc-title"><?php echo esc_html( $number_label ); ?></td>
					</tr>
				</table>
			</div>
		<?php endif; ?>

		<?php if ( $show_slant ) : ?>
			<div class="slant-bar"></div>
		<?php endif; ?>

		<table class="header<?php echo $center_title ? ' centered' : ''; ?><?php echo in_array( $variant, array( 'minimal', 'sidebar' ), true ) ? ' divider' : ''; ?>">
			<tr>
				<td>
					<?php if ( ! $show_bar && ! $show_side ) : ?>
						<div class="doc-type"><?php echo esc_html( $number_label ); ?></div>
					<?php endif; ?>
					<div class="doc-number"><?php echo esc_html( $number_value ); ?></div>
					<?php if ( ! $is_invoice && ! empty( $document['subject'] ) ) : ?>
						<p class="subject"><?php echo esc_html( (string) $document['subject'] ); ?></p>
					<?php endif; ?>
				</td>
				<td class="dates">
					<?php if ( $is_invoice ) : ?>
						<div><span class="label"><?php esc_html_e( 'Invoice Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['invoice_date'] ?? '—' ) ); ?></div>
						<div><span class="label"><?php esc_html_e( 'Due Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['due_date'] ?? '—' ) ); ?></div>
					<?php else : ?>
						<div><span class="label"><?php esc_html_e( 'Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['date'] ?? '—' ) ); ?></div>
						<div><span class="label"><?php esc_html_e( 'Open Till', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['open_till'] ?? '—' ) ); ?></div>
					<?php endif; ?>
					<div><span class="label"><?php esc_html_e( 'Currency', 'doublescale' ); ?>:</span> <?php echo esc_html( $currency ); ?></div>
				</td>
			</tr>
		</table>

		<table class="meta">
			<tr>
				<td>
					<div class="party-box">
						<div class="party-label"><?php esc_html_e( 'From', 'doublescale' ); ?></div>
						<?php foreach ( $company_lines as $line ) : ?>
							<p class="party-line"><?php echo esc_html( $line ); ?></p>
						<?php endforeach; ?>
					</div>
				</td>
				<td>
					<div class="party-box">
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

		<table class="items">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Item', 'doublescale' ); ?></th>
					<th class="right"><?php esc_html_e( 'Qty', 'doublescale' ); ?></th>
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
				foreach ( $line_items as $item ) :
					if ( ! empty( $item['optional'] ) ) {
						continue;
					}
					$has_rows = true;
					$qty      = (float) ( $item['qty'] ?? 0 );
					$rate     = (float) ( $item['rate'] ?? 0 );
					$amount   = (float) ( $item['amount'] ?? ( $qty * $rate ) );
					$taxes    = array();
					if ( ! empty( $item['tax'] ) && is_array( $item['tax'] ) ) {
						foreach ( $item['tax'] as $tax ) {
							if ( isset( $tax['name'], $tax['rate'] ) ) {
								$taxes[] = $tax['name'] . ' (' . $tax['rate'] . '%)';
							}
						}
					}
					?>
					<tr>
						<td>
							<strong><?php echo esc_html( (string) ( $item['description'] ?? '—' ) ); ?></strong>
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
						<td colspan="<?php echo $is_invoice ? 5 : 4; ?>" class="muted"><?php esc_html_e( 'No line items.', 'doublescale' ); ?></td>
					</tr>
				<?php endif; ?>
			</tbody>
		</table>

		<table class="footer">
			<tr>
				<td class="notes">
					<?php if ( $is_invoice && ! empty( $document['client_note'] ) ) : ?>
						<div class="section-title"><?php esc_html_e( 'Client Note', 'doublescale' ); ?></div>
						<p class="section-body"><?php echo esc_html( (string) $document['client_note'] ); ?></p>
					<?php endif; ?>
					<?php if ( $is_invoice && ! empty( $document['terms'] ) ) : ?>
						<div class="section-title"><?php esc_html_e( 'Terms', 'doublescale' ); ?></div>
						<p class="section-body"><?php echo esc_html( (string) $document['terms'] ); ?></p>
					<?php endif; ?>
				</td>
				<td style="width:42%;">
					<div class="totals-wrap">
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
