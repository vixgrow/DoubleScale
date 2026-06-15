<?php
/**
 * PDF HTML template for contracts.
 *
 * @package DoubleScale\Modules\Sales
 *
 * @var array<string, mixed> $document Shaped contract data.
 * @var array<string, string> $company Company block.
 */

defined( 'ABSPATH' ) || exit;

$number_value = (string) ( $document['contract_number'] ?? '' );
$currency     = (string) ( $document['currency'] ?? 'USD' );
$value        = (float) ( $document['contract_value'] ?? 0 );
$description  = (string) ( $document['description'] ?? '' );
$type_name    = '';
if ( ! empty( $document['contract_type']['name'] ) ) {
	$type_name = (string) $document['contract_type']['name'];
} elseif ( ! empty( $document['contract_type_id'] ) && ! empty( $document['contract_type'] ) ) {
	$type_name = (string) $document['contract_type'];
}

$format_money = static function ( float $amount ) use ( $currency ): string {
	return number_format_i18n( $amount, 2 ) . ' ' . $currency;
};

$customer_lines = array();
if ( ! empty( $document['contact'] ) && is_array( $document['contact'] ) ) {
	$contact = $document['contact'];
	$name    = trim( (string) ( $contact['first_name'] ?? '' ) . ' ' . (string) ( $contact['last_name'] ?? '' ) );
	if ( '' !== $name ) {
		$customer_lines[] = $name;
	}
	if ( ! empty( $contact['email'] ) ) {
		$customer_lines[] = (string) $contact['email'];
	}
}
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title><?php echo esc_html( __( 'Contract', 'doublescale' ) . ' ' . $number_value ); ?></title>
	<style>
		body { font-family: DejaVu Sans, sans-serif; color: #1a202c; font-size: 12px; line-height: 1.5; }
		h1 { margin: 0 0 4px; font-size: 22px; }
		h2 { margin: 0; font-size: 14px; color: #4c6fff; text-transform: uppercase; letter-spacing: 0.08em; }
		.header, .meta { width: 100%; margin-bottom: 20px; }
		.meta td { vertical-align: top; width: 50%; }
		.muted { color: #64748b; font-size: 11px; }
		.section { margin-top: 18px; }
		.body-content { border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; }
		table.summary { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
		table.summary th, table.summary td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
		table.summary th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #64748b; width: 30%; }
	</style>
</head>
<body>
	<table class="header">
		<tr>
			<td>
				<h2><?php esc_html_e( 'Contract', 'doublescale' ); ?></h2>
				<h1><?php echo esc_html( $number_value ); ?></h1>
				<?php if ( ! empty( $document['subject'] ) ) : ?>
					<p class="muted"><?php echo esc_html( (string) $document['subject'] ); ?></p>
				<?php endif; ?>
			</td>
			<td style="text-align:right;">
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
				<strong><?php esc_html_e( 'Customer', 'doublescale' ); ?></strong><br>
				<?php foreach ( $customer_lines as $line ) : ?>
					<?php echo esc_html( $line ); ?><br>
				<?php endforeach; ?>
				<?php if ( empty( $customer_lines ) ) : ?>
					<span class="muted">—</span>
				<?php endif; ?>
			</td>
			<td style="text-align:right;">
				<?php if ( ! empty( $document['start_date'] ) ) : ?>
					<strong><?php esc_html_e( 'Start', 'doublescale' ); ?>:</strong>
					<?php echo esc_html( (string) $document['start_date'] ); ?><br>
				<?php endif; ?>
				<?php if ( ! empty( $document['end_date'] ) ) : ?>
					<strong><?php esc_html_e( 'End', 'doublescale' ); ?>:</strong>
					<?php echo esc_html( (string) $document['end_date'] ); ?><br>
				<?php endif; ?>
			</td>
		</tr>
	</table>

	<table class="summary">
		<tr>
			<th><?php esc_html_e( 'Contract Value', 'doublescale' ); ?></th>
			<td><strong><?php echo esc_html( $format_money( $value ) ); ?></strong></td>
		</tr>
		<?php if ( '' !== $type_name ) : ?>
			<tr>
				<th><?php esc_html_e( 'Type', 'doublescale' ); ?></th>
				<td><?php echo esc_html( $type_name ); ?></td>
			</tr>
		<?php endif; ?>
		<?php if ( ! empty( $document['status'] ) ) : ?>
			<tr>
				<th><?php esc_html_e( 'Status', 'doublescale' ); ?></th>
				<td><?php echo esc_html( ucfirst( (string) $document['status'] ) ); ?></td>
			</tr>
		<?php endif; ?>
	</table>

	<?php if ( '' !== trim( wp_strip_all_tags( $description ) ) ) : ?>
		<div class="section">
			<h2><?php esc_html_e( 'Contract Body', 'doublescale' ); ?></h2>
			<div class="body-content">
				<?php echo wp_kses_post( $description ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- sanitized at save. ?>
			</div>
		</div>
	<?php endif; ?>

	<?php if ( ! empty( $document['signed_name'] ) || ! empty( $document['has_signature'] ) ) : ?>
		<div class="section">
			<p><strong><?php esc_html_e( 'Signed by', 'doublescale' ); ?>:</strong>
				<?php echo esc_html( (string) ( $document['signed_name'] ?? '' ) ); ?>
			</p>
			<?php if ( ! empty( $document['signed_at'] ) ) : ?>
				<p class="muted"><?php echo esc_html( (string) $document['signed_at'] ); ?></p>
			<?php endif; ?>
		</div>
	<?php endif; ?>
</body>
</html>
