#!/usr/bin/env php
<?php
/**
 * Deep E2E test: Invoice Stripe payment full flow.
 *
 * Default: leaves the invoice PAID with all data intact (--keep-paid).
 * Pass --reset to refund + reset the invoice to unpaid at the end.
 *
 * Usage:
 *   php bin/test-stripe-invoice-deep.php [INVOICE_ID] [--keep-paid|--reset]
 *
 * Requires: stripe CLI on PATH, `stripe listen` running, sandbox keys + whsec saved.
 */

if ( PHP_SAPI !== 'cli' ) {
	exit( 1 );
}

$wp_root = dirname( __DIR__, 4 );
require $wp_root . '/wp-load.php';

$invoice_id = 22;
$mode       = 'keep-paid';
foreach ( array_slice( $argv, 1 ) as $arg ) {
	if ( '--reset' === $arg ) {
		$mode = 'reset';
	} elseif ( '--keep-paid' === $arg ) {
		$mode = 'keep-paid';
	} elseif ( ctype_digit( (string) $arg ) ) {
		$invoice_id = (int) $arg;
	}
}

$passed  = 0;
$failed  = 0;
$skipped = 0;

function t_assert( bool $ok, string $label, string $detail = '' ): void {
	global $passed, $failed;
	if ( $ok ) {
		++$passed;
		echo "  [PASS] {$label}\n";
		return;
	}
	++$failed;
	echo "  [FAIL] {$label}" . ( $detail ? " — {$detail}" : '' ) . "\n";
}

function t_skip( string $label, string $reason ): void {
	global $skipped;
	++$skipped;
	echo "  [SKIP] {$label} ({$reason})\n";
}

function section( string $title ): void {
	echo "\n=== {$title} ===\n";
}

function invoice_row( int $id ): ?object {
	global $wpdb;
	return $wpdb->get_row(
		$wpdb->prepare(
			"SELECT id, status, total, amount_paid, stripe_payment_intent_id, hash, invoice_number, currency
			FROM {$wpdb->prefix}doublescale_sales_invoices WHERE id = %d",
			$id
		)
	);
}

function payment_count( int $invoice_id ): int {
	global $wpdb;
	return (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->prefix}doublescale_sales_invoice_payments WHERE invoice_id = %d",
			$invoice_id
		)
	);
}

function reset_invoice( int $id ): void {
	global $wpdb;
	$p = $wpdb->prefix;
	$wpdb->update(
		$p . 'doublescale_sales_invoices',
		array(
			'status'                   => 'unpaid',
			'amount_paid'              => 0,
			'stripe_payment_intent_id' => null,
		),
		array( 'id' => $id )
	);
	$wpdb->delete( $p . 'doublescale_sales_invoice_payments', array( 'invoice_id' => $id ) );
}

function stripe_cli( string $cmd ): ?string {
	$path = getenv( 'HOME' ) . '/.local/bin/stripe';
	$bin  = is_executable( $path ) ? $path : 'stripe';
	$out  = shell_exec( escapeshellcmd( $bin ) . ' ' . $cmd . ' 2>/dev/null' );
	return is_string( $out ) && '' !== $out ? $out : null;
}

function replay_event_for_pi( string $event_type, string $pi_id, int $invoice_id ): bool {
	$json = stripe_cli( 'events list --limit 10 --type ' . escapeshellarg( $event_type ) );
	if ( ! $json ) {
		return false;
	}
	$list = json_decode( $json );
	foreach ( $list->data ?? array() as $evt ) {
		$obj = $evt->data->object ?? null;
		if ( ! $obj ) {
			continue;
		}
		$match_pi = '';
		if ( isset( $obj->id ) && ( $obj->object ?? '' ) === 'payment_intent' ) {
			$match_pi = (string) $obj->id;
		} elseif ( ! empty( $obj->payment_intent ) ) {
			$match_pi = (string) $obj->payment_intent;
		}
		if ( $match_pi !== $pi_id ) {
			continue;
		}
		$event_id = (string) ( $evt->id ?? '' );
		if ( '' !== $event_id ) {
			delete_transient( 'ds_stripe_evt_' . md5( $event_id ) );
		}
		\DoubleScale\Pro\Modules\Sales\PaymentGateways\Stripe\StripeInvoiceGateway::instance()->handle_webhook_event( $evt, $invoice_id );
		return true;
	}
	return false;
}

function rest_post( string $path ): array {
	$resp = rest_do_request( new WP_REST_Request( 'POST', $path ) );
	return array( 'status' => $resp->get_status(), 'data' => $resp->get_data() );
}

function pay_full( int $invoice_id, int $minor, string $currency, string $hash, string $number ): string {
	$json = stripe_cli(
		'payment_intents create --amount=' . $minor .
		' --currency=' . escapeshellarg( $currency ) .
		' -d metadata[source]=invoice' .
		' -d metadata[invoice_id]=' . $invoice_id .
		' -d metadata[invoice_number]=' . escapeshellarg( $number ) .
		' -d metadata[invoice_hash]=' . escapeshellarg( $hash ) .
		' -d payment_method_types[]=card' .
		' -d payment_method=pm_card_visa' .
		' -d confirm=true'
	);
	$pi = $json ? json_decode( $json ) : null;
	if ( ! $pi || empty( $pi->id ) ) {
		return '';
	}
	global $wpdb;
	$wpdb->update(
		$wpdb->prefix . 'doublescale_sales_invoices',
		array( 'stripe_payment_intent_id' => $pi->id ),
		array( 'id' => $invoice_id )
	);
	return (string) $pi->id;
}

echo "Deep Invoice Stripe Test — invoice #{$invoice_id} (mode: {$mode})\n";
echo str_repeat( '-', 52 ) . "\n";

// --- 1. Prerequisites ---
section( '1) Prerequisites' );
t_assert( \DoubleScale\Pro\Modules\Integrations\Stripe\Integration::instance()->is_configured(), 'Stripe integration configured' );
$gateway = \DoubleScale\Modules\Sales\Managers\InvoiceOnlineGatewaysManager::instance()->get( 'stripe' );
t_assert( $gateway && $gateway->is_configured(), 'Stripe invoice gateway configured' );
$listen = shell_exec( 'pgrep -f "stripe listen" 2>/dev/null' );
t_assert( is_string( $listen ) && '' !== trim( $listen ), 'stripe listen is running', 'run ./bin/stripe-listen.sh' );
$inv_model = \DoubleScale\Modules\Sales\Models\InvoiceModel::with( 'contact' )->find( $invoice_id );
t_assert( $inv_model instanceof \DoubleScale\Modules\Sales\Models\InvoiceModel, 'Invoice exists' );
if ( ! $inv_model ) {
	echo "\nAbort: invoice not found.\n";
	exit( 1 );
}
$hash     = (string) $inv_model->hash;
$number   = (string) $inv_model->invoice_number;
$total    = (float) $inv_model->total;
$currency = strtolower( (string) $inv_model->currency );
$minor    = (int) round( $total * 100 );

// --- 2. Reset to clean state ---
section( '2) Reset invoice to unpaid' );
reset_invoice( $invoice_id );
$row = invoice_row( $invoice_id );
t_assert( 'unpaid' === $row->status && 0.0 === (float) $row->amount_paid, 'Invoice reset to unpaid' );
t_assert( 0 === payment_count( $invoice_id ), 'No payment rows' );

// --- 3. Gateway init_payment ---
section( '3) init_payment (gateway)' );
$init = $gateway->init_payment( $inv_model->fresh( array( 'contact' ) ) );
t_assert( ! is_wp_error( $init ), 'init_payment succeeds', is_wp_error( $init ) ? $init->get_error_message() : '' );
$client_secret_1 = '';
$pi_from_init    = '';
if ( ! is_wp_error( $init ) ) {
	t_assert( ! empty( $init['client_secret'] ), 'Returns client_secret' );
	t_assert( ! empty( $init['publishable_key'] ), 'Returns publishable_key' );
	t_assert( isset( $init['amount'] ) && (float) $init['amount'] === $total, 'Amount matches balance due' );
	$client_secret_1 = (string) ( $init['client_secret'] ?? '' );
	$pi_from_init    = (string) $inv_model->fresh()->stripe_payment_intent_id;
	t_assert( '' !== $pi_from_init, 'PI id saved on invoice' );
}

// --- 4. PI reuse ---
section( '4) PI reuse (same amount)' );
$init2 = $gateway->init_payment( $inv_model->fresh( array( 'contact' ) ) );
if ( ! is_wp_error( $init2 ) && '' !== $pi_from_init ) {
	t_assert( (string) $inv_model->fresh()->stripe_payment_intent_id === $pi_from_init, 'Second init reuses same PI' );
	t_assert( (string) ( $init2['client_secret'] ?? '' ) === $client_secret_1, 'Same client_secret returned' );
}

// --- 5. Public REST init ---
section( '5) Public REST init' );
$pub_init = rest_post( "/doublescale/v1/sales/public/invoices/{$hash}/pay/stripe/init" );
t_assert( 200 === $pub_init['status'], 'POST public .../pay/stripe/init → 200', 'status=' . $pub_init['status'] );
if ( 200 === $pub_init['status'] ) {
	t_assert( ! empty( $pub_init['data']['client_secret'] ), 'Public init returns client_secret' );
}

// --- 6. Overpay rejected ---
section( '6) Overpay webhook rejected' );
reset_invoice( $invoice_id );
$over_json = stripe_cli(
	'payment_intents create --amount=' . ( $minor + 500 ) .
	' --currency=' . escapeshellarg( $currency ) .
	' -d metadata[source]=invoice -d metadata[invoice_id]=' . $invoice_id .
	' -d payment_method_types[]=card -d payment_method=pm_card_visa -d confirm=true'
);
$over_pi = $over_json ? json_decode( $over_json ) : null;
if ( $over_pi && ! empty( $over_pi->id ) ) {
	global $wpdb;
	$wpdb->update( $wpdb->prefix . 'doublescale_sales_invoices', array( 'stripe_payment_intent_id' => $over_pi->id ), array( 'id' => $invoice_id ) );
	replay_event_for_pi( 'payment_intent.succeeded', (string) $over_pi->id, $invoice_id );
	$row = invoice_row( $invoice_id );
	t_assert( 0 === payment_count( $invoice_id ), 'Overpay does not create payment row' );
	t_assert( 0.0 === (float) $row->amount_paid, 'Invoice still unpaid after overpay' );
}

// --- 7. payment_failed ---
section( '7) payment_failed webhook' );
$fail_json = stripe_cli(
	'payment_intents create --amount=' . $minor .
	' --currency=' . escapeshellarg( $currency ) .
	' -d metadata[source]=invoice -d metadata[invoice_id]=' . $invoice_id .
	' -d payment_method_types[]=card'
);
$fail_pi = $fail_json ? json_decode( $fail_json ) : null;
if ( $fail_pi && ! empty( $fail_pi->id ) ) {
	$fail_pi->status             = 'requires_payment_method';
	$fail_pi->last_payment_error = (object) array( 'message' => 'Your card was declined.' );
	$evt                         = (object) array(
		'type' => 'payment_intent.payment_failed',
		'id'   => 'evt_test_fail_' . time(),
		'data' => (object) array( 'object' => $fail_pi ),
	);
	delete_transient( 'ds_stripe_evt_' . md5( $evt->id ) );
	\DoubleScale\Pro\Modules\Sales\PaymentGateways\Stripe\StripeInvoiceGateway::instance()->handle_webhook_event( $evt, $invoice_id );
	t_assert( 0 === payment_count( $invoice_id ), 'Failed webhook does not create payment' );
}

// --- 8. Refund flow (full payment then refund) ---
section( '8) Full payment + refund' );
reset_invoice( $invoice_id );
$rpi = pay_full( $invoice_id, $minor, $currency, $hash, $number );
if ( '' !== $rpi ) {
	sleep( 2 );
	if ( (float) invoice_row( $invoice_id )->amount_paid < $total - 0.01 ) {
		replay_event_for_pi( 'payment_intent.succeeded', $rpi, $invoice_id );
	}
	t_assert( 1 === payment_count( $invoice_id ), 'Payment recorded before refund' );
	stripe_cli( 'refunds create --payment-intent=' . escapeshellarg( $rpi ) );
	sleep( 4 );
	if ( (float) invoice_row( $invoice_id )->amount_paid > 0 ) {
		replay_event_for_pi( 'charge.refunded', $rpi, $invoice_id );
	}
	$row = invoice_row( $invoice_id );
	t_assert( 0 === payment_count( $invoice_id ), 'Payment row removed after full refund' );
	t_assert( 0.0 === (float) $row->amount_paid, 'amount_paid zero after refund' );
	t_assert( null === $row->stripe_payment_intent_id || '' === $row->stripe_payment_intent_id, 'PI cleared after full refund' );
}

// --- 9. Webhook signature guard ---
section( '9) Webhook REST signature' );
$wh = rest_post( '/doublescale/v1/integrations/stripe/webhook' );
t_assert( 400 === $wh['status'], 'Webhook without signature → 400' );

// --- 10. Idempotency ---
section( '10) Webhook idempotency' );
reset_invoice( $invoice_id );
$idem_pi = pay_full( $invoice_id, $minor, $currency, $hash, $number );
if ( '' !== $idem_pi ) {
	sleep( 2 );
	replay_event_for_pi( 'payment_intent.succeeded', $idem_pi, $invoice_id );
	$before = payment_count( $invoice_id );
	replay_event_for_pi( 'payment_intent.succeeded', $idem_pi, $invoice_id );
	$after = payment_count( $invoice_id );
	t_assert( 1 === $before && $before === $after, 'Duplicate succeeded webhook does not double-pay', "count {$before}->{$after}" );
}

// --- 11. Final state ---
section( '11) Final invoice state' );
if ( 'reset' === $mode ) {
	$rpi = (string) invoice_row( $invoice_id )->stripe_payment_intent_id;
	if ( '' !== $rpi ) {
		stripe_cli( 'refunds create --payment-intent=' . escapeshellarg( $rpi ) );
		sleep( 3 );
		replay_event_for_pi( 'charge.refunded', $rpi, $invoice_id );
	}
	reset_invoice( $invoice_id );
	$row = invoice_row( $invoice_id );
	t_assert( 'unpaid' === $row->status, 'Invoice reset to unpaid (--reset)' );
} else {
	// Leave the invoice fully PAID with data intact.
	$row = invoice_row( $invoice_id );
	if ( 'paid' !== $row->status || (float) $row->amount_paid < $total - 0.01 ) {
		reset_invoice( $invoice_id );
		$pi = pay_full( $invoice_id, $minor, $currency, $hash, $number );
		sleep( 3 );
		if ( (float) invoice_row( $invoice_id )->amount_paid < $total - 0.01 ) {
			replay_event_for_pi( 'payment_intent.succeeded', $pi, $invoice_id );
		}
		$row = invoice_row( $invoice_id );
	}
	t_assert( 1 === payment_count( $invoice_id ), 'Payment row present (data kept)' );
	t_assert( (float) $row->amount_paid >= $total - 0.01, 'Invoice fully paid (data kept)', "paid={$row->amount_paid}" );
	t_assert( in_array( $row->status, array( 'paid', 'partially_paid' ), true ), 'Status paid (data kept)', "status={$row->status}" );
}

// --- Summary ---
echo "\n" . str_repeat( '=', 52 ) . "\n";
echo "PASSED: {$passed}  FAILED: {$failed}  SKIPPED: {$skipped}\n";
$final = invoice_row( $invoice_id );
echo "Final: status={$final->status} paid={$final->amount_paid}/{$final->total} {$final->currency} pi=" . ( $final->stripe_payment_intent_id ?: 'null' ) . " payments=" . payment_count( $invoice_id ) . "\n";
echo "Invoice URL: " . \DoubleScale\Modules\Sales\Services\InvoiceUrl::get_public_url( $inv_model ) . "\n";
exit( $failed > 0 ? 1 : 0 );
