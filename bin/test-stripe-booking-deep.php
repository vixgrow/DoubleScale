#!/usr/bin/env php
<?php
/**
 * Deep E2E test: Booking Stripe payment full flow.
 *
 * Default: leaves booking payment_status=completed with data intact (--keep-paid).
 *
 * Usage: php bin/test-stripe-booking-deep.php [BOOKING_ID] [--keep-paid|--reset]
 */

if ( PHP_SAPI !== 'cli' ) {
	exit( 1 );
}

$wp_root = dirname( __DIR__, 4 );
require $wp_root . '/wp-load.php';

$booking_id = 1;
$mode       = 'keep-paid';
foreach ( array_slice( $argv, 1 ) as $arg ) {
	if ( '--reset' === $arg ) {
		$mode = 'reset';
	} elseif ( '--keep-paid' === $arg ) {
		$mode = 'keep-paid';
	} elseif ( ctype_digit( (string) $arg ) ) {
		$booking_id = (int) $arg;
	}
}

$passed = 0;
$failed = 0;

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

function section( string $title ): void {
	echo "\n=== {$title} ===\n";
}

function stripe_cli( string $cmd ): ?string {
	$path = getenv( 'HOME' ) . '/.local/bin/stripe';
	$bin  = is_executable( $path ) ? $path : 'stripe';
	$out  = shell_exec( escapeshellcmd( $bin ) . ' ' . $cmd . ' 2>/dev/null' );
	return is_string( $out ) && '' !== $out ? $out : null;
}

function replay_event_for_pi( string $event_type, string $pi_id, int $booking_id ): bool {
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
		\DoubleScale\Pro\Modules\Booking\PaymentGateways\BookingStripeHandler::instance()->handle_webhook_event( $evt, $booking_id );
		return true;
	}
	return false;
}

function reset_booking_payment( int $id ): void {
	global $wpdb;
	$wpdb->delete(
		$wpdb->prefix . 'doublescale_booking_meta',
		array( 'booking_id' => $id, 'meta_key' => 'stripe_payment_intent_id' )
	);
	$b = \DoubleScale\Modules\Booking\Models\BookingModel::find( $id );
	if ( $b ) {
		$b->setPaymentStatus( 'pending' );
		$b->status = 'scheduled';
		$b->save();
		if ( $b->order ) {
			$b->order()->update( array( 'status' => 'pending' ) );
		}
	}
}

echo "Deep Booking Stripe Test — booking #{$booking_id} (mode: {$mode})\n";
echo str_repeat( '-', 52 ) . "\n";

section( '1) Prerequisites' );
t_assert( \DoubleScale\Pro\Modules\Integrations\Stripe\Integration::instance()->is_configured(), 'Stripe configured' );
$manager = \DoubleScale\Core\Payment\GatewayManager::instance();
$gateway = $manager->get( \DoubleScale\Core\Payment\GatewayManager::CONTEXT_BOOKING, 'stripe' );
t_assert( $gateway && $gateway->is_configured(), 'Booking Stripe gateway registered' );
$listen = shell_exec( 'pgrep -f "stripe listen" 2>/dev/null' );
t_assert( is_string( $listen ) && '' !== trim( $listen ), 'stripe listen running' );
t_assert( has_action( 'doublescale_stripe_booking_event' ), 'Booking webhook listener bound' );

$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
t_assert( $booking instanceof \DoubleScale\Modules\Booking\Models\BookingModel, 'Booking exists' );
if ( ! $booking ) {
	exit( 1 );
}

$hash     = $booking->hash_id;
$subject  = new \DoubleScale\Pro\Modules\Booking\PaymentGateways\BookingPayableSubject( $booking );
$amount   = $subject->amount_due();
$currency = strtolower( $subject->currency() );
$minor    = (int) round( $amount * 100 );

section( '2) Reset booking payment state' );
reset_booking_payment( $booking_id );
$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
t_assert( 'pending' === $booking->getPaymentStatus(), 'payment_status=pending' );

section( '3) Gateway init (unified StripeGateway)' );
$init = $gateway->init( new \DoubleScale\Pro\Modules\Booking\PaymentGateways\BookingPayableSubject( $booking ) );
t_assert( ! is_wp_error( $init ), 'init succeeds', is_wp_error( $init ) ? $init->get_error_message() : '' );
$pi_from_init = '';
if ( ! is_wp_error( $init ) ) {
	t_assert( ! empty( $init['client_secret'] ), 'Returns client_secret' );
	t_assert( ! empty( $init['publishable_key'] ), 'Returns publishable_key' );
	t_assert( (float) ( $init['amount'] ?? 0 ) === $amount, 'Amount matches event price' );
	t_assert( ( $init['booking_id'] ?? '' ) === $hash, 'Returns booking hash' );
	$booking     = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
	$pi_from_init = (string) $booking->get_meta( 'stripe_payment_intent_id' );
	t_assert( '' !== $pi_from_init, 'PI saved on booking meta' );
	t_assert( null !== $booking->order, 'Pending order row created' );
}

section( '4) PI reuse' );
$init2 = $gateway->init( new \DoubleScale\Pro\Modules\Booking\PaymentGateways\BookingPayableSubject( \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id ) ) );
if ( ! is_wp_error( $init2 ) && '' !== $pi_from_init ) {
	t_assert( (string) ( $init2['client_secret'] ?? '' ) === (string) ( $init['client_secret'] ?? '' ), 'Reuses same PI/client_secret' );
}

section( '5) Real Stripe CLI card payment' );
$pay_json = stripe_cli(
	'payment_intents create --amount=' . $minor .
	' --currency=' . escapeshellarg( $currency ) .
	' -d metadata[source]=booking' .
	' -d metadata[booking_id]=' . $booking_id .
	' -d metadata[booking_hash]=' . escapeshellarg( $hash ) .
	' -d payment_method_types[]=card' .
	' -d payment_method=pm_card_visa' .
	' -d confirm=true'
);
$paid_pi = $pay_json ? json_decode( $pay_json ) : null;
$pi_id   = $paid_pi && ! empty( $paid_pi->id ) ? (string) $paid_pi->id : '';
t_assert( '' !== $pi_id, 'Stripe CLI payment succeeded' );
if ( '' !== $pi_id ) {
	$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
	$booking->update_meta( 'stripe_payment_intent_id', $pi_id );
	sleep( 4 );
	$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
	if ( 'completed' !== $booking->getPaymentStatus() ) {
		replay_event_for_pi( 'payment_intent.succeeded', $pi_id, $booking_id );
		$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
	}
	t_assert( 'completed' === $booking->getPaymentStatus(), 'payment_status=completed after webhook', $booking->getPaymentStatus() );
	t_assert( 'completed' === ( $booking->order->status ?? '' ), 'Order status=completed' );
}

section( '6) confirm poll fallback' );
$confirm = $gateway->confirm( new \DoubleScale\Pro\Modules\Booking\PaymentGateways\BookingPayableSubject( \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id ) ) );
t_assert( ! is_wp_error( $confirm ), 'confirm succeeds' );
if ( ! is_wp_error( $confirm ) ) {
	t_assert( 'succeeded' === ( $confirm['pi_status'] ?? '' ), 'PI status succeeded' );
	t_assert( 'completed' === ( $confirm['payment_status'] ?? '' ), 'payment_status still completed' );
}

section( '7) Webhook idempotency' );
if ( '' !== $pi_id ) {
	replay_event_for_pi( 'payment_intent.succeeded', $pi_id, $booking_id );
	$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
	t_assert( 'completed' === $booking->getPaymentStatus(), 'Duplicate webhook does not break state' );
}

section( '8) Final state' );
if ( 'reset' === $mode ) {
	reset_booking_payment( $booking_id );
	t_assert( 'pending' === \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id )->getPaymentStatus(), 'Reset to pending' );
} else {
	$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
	if ( 'completed' !== $booking->getPaymentStatus() && '' !== $pi_id ) {
		replay_event_for_pi( 'payment_intent.succeeded', $pi_id, $booking_id );
		$booking = \DoubleScale\Modules\Booking\Models\BookingModel::find( $booking_id );
	}
	t_assert( 'completed' === $booking->getPaymentStatus(), 'Booking left completed (data kept)' );
	t_assert( 'scheduled' === $booking->status, 'Booking status=scheduled' );
}

echo "\n" . str_repeat( '=', 52 ) . "\n";
echo "PASSED: {$passed}  FAILED: {$failed}\n";
echo "Booking hash: {$hash}\n";
echo "Amount: {$amount} " . strtoupper( $currency ) . "\n";
exit( $failed > 0 ? 1 : 0 );
