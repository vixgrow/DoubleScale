<?php
/**
 * Shared PDF HTML template for proposals and invoices.
 *
 * @package DoubleScale\Modules\Documents
 *
 * @var array<string, mixed> $document Shaped document data.
 * @var string               $doc_type proposal|invoice.
 * @var array<string, string> $company Company block.
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
} else {
	$customer_fields = array( 'to_name', 'address', 'city', 'state', 'zip', 'country', 'email', 'phone' );
	foreach ( $customer_fields as $field ) {
		if ( ! empty( $document[ $field ] ) ) {
			$customer_lines[] = (string) $document[ $field ];
		}
	}
}
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title><?php echo esc_html( $number_label . ' ' . $number_value ); ?></title>
	<style>
		body { font-family: DejaVu Sans, sans-serif; color: #1a202c; font-size: 12px; line-height: 1.5; }
		h1 { margin: 0 0 4px; font-size: 22px; }
		h2 { margin: 0; font-size: 14px; color: #4c6fff; text-transform: uppercase; letter-spacing: 0.08em; }
		.header, .meta, .totals { width: 100%; margin-bottom: 20px; }
		.meta td { vertical-align: top; width: 50%; }
		table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
		table.items th, table.items td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
		table.items th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #64748b; }
		.right { text-align: right; }
		table.totals { width: 42%; margin-left: auto; border-collapse: collapse; }
		table.totals th, table.totals td { padding: 6px 0; }
		table.totals th { text-align: left; color: #64748b; font-weight: normal; }
		table.totals td { text-align: right; font-weight: 600; }
		.total-row th, .total-row td { border-top: 2px solid #1a202c; padding-top: 10px; font-size: 14px; }
		.muted { color: #64748b; font-size: 11px; }
		.section { margin-top: 18px; }
	</style>
</head>
<body>
	<table class="header">
		<tr>
			<td>
				<h2><?php echo esc_html( $number_label ); ?></h2>
				<h1><?php echo esc_html( $number_value ); ?></h1>
				<?php if ( ! $is_invoice && ! empty( $document['subject'] ) ) : ?>
					<p class="muted"><?php echo esc_html( (string) $document['subject'] ); ?></p>
				<?php endif; ?>
			</td>
			<td class="right">
				<strong><?php echo esc_html( $company['name'] ); ?></strong><br>
				<?php if ( '' !== $company['address'] ) : ?>
					<span class="muted"><?php echo esc_html( $company['address'] ); ?></span><br>
				<?php endif; ?>
				<span class="muted"><?php echo esc_html( $company['url'] ); ?></span>
			</td>
		</tr>
	</table>

	<table class="meta">
		<tr>
			<td>
				<strong><?php echo esc_html( $is_invoice ? __( 'Bill To', 'doublescale' ) : __( 'To', 'doublescale' ) ); ?></strong><br>
				<?php foreach ( $customer_lines as $line ) : ?>
					<?php echo esc_html( trim( (string) $line ) ); ?><br>
				<?php endforeach; ?>
			</td>
			<td class="right">
				<?php if ( $is_invoice ) : ?>
					<div><span class="muted"><?php esc_html_e( 'Invoice Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['invoice_date'] ?? '—' ) ); ?></div>
					<div><span class="muted"><?php esc_html_e( 'Due Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['due_date'] ?? '—' ) ); ?></div>
				<?php else : ?>
					<div><span class="muted"><?php esc_html_e( 'Date', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['date'] ?? '—' ) ); ?></div>
					<div><span class="muted"><?php esc_html_e( 'Open Till', 'doublescale' ); ?>:</span> <?php echo esc_html( (string) ( $document['open_till'] ?? '—' ) ); ?></div>
				<?php endif; ?>
				<div><span class="muted"><?php esc_html_e( 'Currency', 'doublescale' ); ?>:</span> <?php echo esc_html( $currency ); ?></div>
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
			<?php foreach ( $line_items as $item ) : ?>
				<?php
				if ( ! empty( $item['optional'] ) ) {
					continue;
				}
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
					<td>
						<strong><?php echo esc_html( (string) ( $item['description'] ?? '—' ) ); ?></strong>
						<?php if ( ! empty( $item['long_description'] ) ) : ?>
							<br><span class="muted"><?php echo esc_html( (string) $item['long_description'] ); ?></span>
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
		</tbody>
	</table>

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
			<tr class="total-row">
				<th><?php esc_html_e( 'Balance Due', 'doublescale' ); ?></th>
				<td><?php echo esc_html( $format_money( $balance ) ); ?></td>
			</tr>
		<?php endif; ?>
	</table>

	<?php if ( $is_invoice && ! empty( $document['client_note'] ) ) : ?>
		<div class="section">
			<strong><?php esc_html_e( 'Client Note', 'doublescale' ); ?></strong><br>
			<?php echo esc_html( (string) $document['client_note'] ); ?>
		</div>
	<?php endif; ?>

	<?php if ( $is_invoice && ! empty( $document['terms'] ) ) : ?>
		<div class="section">
			<strong><?php esc_html_e( 'Terms', 'doublescale' ); ?></strong><br>
			<?php echo esc_html( (string) $document['terms'] ); ?>
		</div>
	<?php endif; ?>
</body>
</html>
