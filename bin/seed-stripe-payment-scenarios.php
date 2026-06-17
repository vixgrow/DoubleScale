#!/usr/bin/env php
<?php
/**
 * Seed + exercise all Stripe payment scenarios for invoice and booking.
 * Leaves every record in place for manual review in wp-admin.
 *
 * Scenarios: success | refunded | disputed | failed | uncaptured
 *
 * Usage: php bin/seed-stripe-payment-scenarios.php
 * Requires: stripe CLI, stripe listen, sandbox keys + whsec saved.
 */

if ( PHP_SAPI !== 'cli' ) {
	exit( 1 );
}

$wp_root = dirname( __DIR__, 4 );
require $wp_root . '/wp-load.php';

use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Services\InvoiceUrl;
use DoubleScale\Modules\Sales\Services\SalesNumbering;
use DoubleScale\Pro\Modules\Booking\PaymentGateways\BookingPayableSubject;
use DoubleScale\Pro\Modules\Booking\PaymentGateways\BookingStripeHandler;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\InvoicePayableSubject;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\StripeInvoiceWebhookHandler;

$scenarios = array( 'success', 'refunded', 'disputed', 'failed', 'uncaptured' );
$amounts   = array(
	'success'    => 25.00,
	'refunded'   => 26.00,
	'disputed'   => 27.00,
	'failed'     => 28.00,
	'uncaptured' => 29.00,
);

$results = array();

function stripe_bin(): string {
	$path = getenv( 'HOME' ) . '/.local/bin/stripe';
	return is_executable( $path ) ? $path : 'stripe';
}

function stripe_cli( string $cmd ): ?string {
	$out = shell_exec( escapeshellcmd( stripe_bin() ) . ' ' . $cmd . ' 2>/dev/null' );
	return is_string( $out ) && '' !== trim( $out ) ? $out : null;
}

function stripe_json( string $cmd ): ?object {
	$out = stripe_cli( $cmd );
	return $out ? json_decode( $out ) : null;
}

function replay_invoice_event( string $type, string $pi_id, int $invoice_id, ?object $synthetic = null ): bool {
	if ( $synthetic ) {
		delete_transient( 'ds_stripe_evt_' . md5( (string) ( $synthetic->id ?? '' ) ) );
		StripeInvoiceWebhookHandler::instance()->handle_webhook_event( $synthetic, $invoice_id );
		return true;
	}
	$list = stripe_json( 'events list --limit 20 --type ' . escapeshellarg( $type ) );
	foreach ( $list->data ?? array() as $evt ) {
		$obj = $evt->data->object ?? null;
		if ( ! $obj ) {
			continue;
		}
		$match = '';
		if ( 'payment_intent' === ( $obj->object ?? '' ) ) {
			$match = (string) ( $obj->id ?? '' );
		} elseif ( ! empty( $obj->payment_intent ) ) {
			$match = (string) $obj->payment_intent;
		}
		if ( $match !== $pi_id ) {
			continue;
		}
		delete_transient( 'ds_stripe_evt_' . md5( (string) ( $evt->id ?? '' ) ) );
		StripeInvoiceWebhookHandler::instance()->handle_webhook_event( $evt, $invoice_id );
		return true;
	}
	return false;
}

function replay_booking_event( string $type, string $pi_id, int $booking_id, ?object $synthetic = null ): bool {
	if ( $synthetic ) {
		delete_transient( 'ds_stripe_evt_' . md5( (string) ( $synthetic->id ?? '' ) ) );
		BookingStripeHandler::instance()->handle_webhook_event( $synthetic, $booking_id );
		return true;
	}
	$list = stripe_json( 'events list --limit 20 --type ' . escapeshellarg( $type ) );
	foreach ( $list->data ?? array() as $evt ) {
		$obj = $evt->data->object ?? null;
		if ( ! $obj ) {
			continue;
		}
		$match = '';
		if ( 'payment_intent' === ( $obj->object ?? '' ) ) {
			$match = (string) ( $obj->id ?? '' );
		} elseif ( ! empty( $obj->payment_intent ) ) {
			$match = (string) $obj->payment_intent;
		}
		if ( $match !== $pi_id ) {
			continue;
		}
		delete_transient( 'ds_stripe_evt_' . md5( (string) ( $evt->id ?? '' ) ) );
		BookingStripeHandler::instance()->handle_webhook_event( $evt, $booking_id );
		return true;
	}
	return false;
}

function create_invoice( string $scenario, float $amount, int $contact_id ): InvoiceModel {
	$invoice = new InvoiceModel();
	$invoice->fill(
		array(
			'contact_id'            => $contact_id,
			'status'                => 'unpaid',
			'currency'              => 'USD',
			'invoice_date'          => current_time( 'Y-m-d' ),
			'due_date'              => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
			'allowed_payment_modes' => array( 'stripe' ),
			'client_note'           => sprintf( '[Stripe QA] invoice — %s', $scenario ),
			'line_items'            => array(
				array(
					'description'      => sprintf( 'Stripe test — %s', $scenario ),
					'long_description' => 'Left by seed-stripe-payment-scenarios.php for engineer review.',
					'qty'              => 1,
					'unit'             => '',
					'rate'             => $amount,
					'tax'              => array(),
					'amount'           => $amount,
					'optional'         => false,
				),
			),
		)
	);
	SalesNumbering::save_with_retry( $invoice );
	return $invoice->fresh( array( 'contact' ) );
}

function create_booking( string $scenario, float $amount, int $template_booking_id ): BookingModel {
	$tpl = BookingModel::find( $template_booking_id );
	if ( ! $tpl ) {
		throw new RuntimeException( "Template booking #{$template_booking_id} not found." );
	}

	$offset_days = array_search( $scenario, array( 'success', 'refunded', 'disputed', 'failed', 'uncaptured' ), true ) + 2;
	$start       = gmdate( 'Y-m-d H:i:s', strtotime( "+{$offset_days} days 10:00:00" ) );
	$end         = gmdate( 'Y-m-d H:i:s', strtotime( "+{$offset_days} days 10:30:00" ) );

	$booking = BookingModel::create(
		array(
			'event_id'     => (int) $tpl->event_id,
			'calendar_id'  => (int) $tpl->calendar_id,
			'contact_id'   => (int) $tpl->contact_id,
			'start_time'   => $start,
			'end_time'     => $end,
			'slot_time'    => 30,
			'source'       => 'stripe_qa',
			'status'       => 'scheduled',
			'cancelled_by' => array(),
			'event_url'    => home_url(),
		)
	);
	$booking->setPaymentStatus( 'pending' );
	$booking->update_meta( 'payment_amount', $amount );
	$booking->update_meta( 'payment_currency', 'USD' );
	$booking->update_meta( 'stripe_qa_scenario', $scenario );
	$booking->logs()->create(
		array(
			'type'    => 'info',
			'message' => sprintf( '[Stripe QA] booking — %s', $scenario ),
			'details' => 'Left by seed-stripe-payment-scenarios.php for engineer review.',
		)
	);
	return $booking->fresh();
}

function attach_pi_invoice( int $invoice_id, string $pi_id ): void {
	global $wpdb;
	$wpdb->update(
		$wpdb->prefix . 'doublescale_sales_invoices',
		array( 'stripe_payment_intent_id' => $pi_id ),
		array( 'id' => $invoice_id )
	);
}

function pay_pi( int $minor, string $currency, array $metadata, string $pm = 'pm_card_visa', bool $manual_capture = false ): ?object {
	$cmd = 'payment_intents create --amount=' . $minor .
		' --currency=' . escapeshellarg( $currency );
	foreach ( $metadata as $k => $v ) {
		$cmd .= ' -d metadata[' . $k . ']=' . escapeshellarg( (string) $v );
	}
	if ( $manual_capture ) {
		$cmd .= ' -d capture_method=manual';
	}
	$cmd .= ' -d payment_method_types[]=card' .
		' -d payment_method=' . escapeshellarg( $pm ) .
		' -d confirm=true';
	return stripe_json( $cmd );
}

function wait_webhook( int $seconds = 3 ): void {
	sleep( $seconds );
}

function run_invoice_scenario( string $scenario, InvoiceModel $invoice ): array {
	$amount   = (float) $invoice->total;
	$minor    = (int) round( $amount * 100 );
	$currency = strtolower( (string) $invoice->currency );
	$meta     = array(
		'source'         => 'invoice',
		'invoice_id'     => (string) $invoice->id,
		'invoice_number' => (string) $invoice->invoice_number,
		'invoice_hash'   => (string) $invoice->hash,
		'qa_scenario'    => $scenario,
	);

	$row = array(
		'type'     => 'invoice',
		'scenario' => $scenario,
		'id'       => (int) $invoice->id,
		'number'   => (string) $invoice->invoice_number,
		'hash'     => (string) $invoice->hash,
		'url'      => InvoiceUrl::get_public_url( $invoice ),
		'amount'   => $amount,
	);

	switch ( $scenario ) {
		case 'success':
			$pi = pay_pi( $minor, $currency, $meta );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Stripe pay failed';
				return $row;
			}
			attach_pi_invoice( (int) $invoice->id, (string) $pi->id );
			wait_webhook();
			if ( 'paid' !== InvoiceModel::find( $invoice->id )->status ) {
				replay_invoice_event( 'payment_intent.succeeded', (string) $pi->id, (int) $invoice->id );
			}
			break;

		case 'refunded':
			$pi = pay_pi( $minor, $currency, $meta );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Stripe pay failed';
				return $row;
			}
			attach_pi_invoice( (int) $invoice->id, (string) $pi->id );
			wait_webhook();
			replay_invoice_event( 'payment_intent.succeeded', (string) $pi->id, (int) $invoice->id );
			stripe_cli( 'refunds create --payment-intent=' . escapeshellarg( (string) $pi->id ) );
			wait_webhook( 4 );
			replay_invoice_event( 'charge.refunded', (string) $pi->id, (int) $invoice->id );
			break;

		case 'disputed':
			$pi = pay_pi( $minor, $currency, $meta, 'pm_card_createDispute' );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Stripe dispute card pay failed';
				return $row;
			}
			attach_pi_invoice( (int) $invoice->id, (string) $pi->id );
			wait_webhook( 5 );
			replay_invoice_event( 'payment_intent.succeeded', (string) $pi->id, (int) $invoice->id );
			wait_webhook( 8 );
			replay_invoice_event( 'charge.dispute.created', (string) $pi->id, (int) $invoice->id );
			break;

		case 'failed':
			$fail = pay_pi( $minor, $currency, $meta, 'pm_card_chargeDeclined' );
			if ( $fail && ! empty( $fail->id ) ) {
				attach_pi_invoice( (int) $invoice->id, (string) $fail->id );
			}
			$fail_pi = stripe_json( 'payment_intents create --amount=' . $minor . ' --currency=' . escapeshellarg( $currency ) . ' -d payment_method_types[]=card' );
			if ( $fail_pi ) {
				$fail_pi->status             = 'requires_payment_method';
				$fail_pi->last_payment_error = (object) array( 'message' => 'Your card was declined.' );
				$synthetic                   = (object) array(
					'type' => 'payment_intent.payment_failed',
					'id'   => 'evt_qa_fail_inv_' . $invoice->id,
					'data' => (object) array( 'object' => $fail_pi ),
				);
				replay_invoice_event( 'payment_intent.payment_failed', '', (int) $invoice->id, $synthetic );
			}
			break;

		case 'uncaptured':
			$pi = pay_pi( $minor, $currency, $meta, 'pm_card_visa', true );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Uncaptured PI create failed';
				return $row;
			}
			attach_pi_invoice( (int) $invoice->id, (string) $pi->id );
			$row['pi_status'] = (string) ( $pi->status ?? '' );
			break;
	}

	$fresh           = InvoiceModel::find( $invoice->id );
	$row['status']   = (string) $fresh->status;
	$row['paid']     = (float) $fresh->amount_paid;
	$row['pi']       = (string) ( $fresh->stripe_payment_intent_id ?? '' );
	$row['payments'] = (int) $fresh->payments()->count();
	return $row;
}

function run_booking_scenario( string $scenario, BookingModel $booking ): array {
	$subject  = new BookingPayableSubject( $booking );
	$amount   = $subject->amount_due();
	$minor    = (int) round( $amount * 100 );
	$currency = strtolower( $subject->currency() );
	$meta     = array(
		'source'       => 'booking',
		'booking_id'   => (string) $booking->id,
		'booking_hash' => $booking->hash_id,
		'qa_scenario'  => $scenario,
	);

	$manager = GatewayManager::instance();
	$gateway = $manager->get( GatewayManager::CONTEXT_BOOKING, 'stripe' );
	$gateway->init( new BookingPayableSubject( $booking->fresh() ) );

	$row = array(
		'type'     => 'booking',
		'scenario' => $scenario,
		'id'       => (int) $booking->id,
		'hash'     => $booking->hash_id,
		'amount'   => $amount,
	);

	switch ( $scenario ) {
		case 'success':
			$pi = pay_pi( $minor, $currency, $meta );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Stripe pay failed';
				return $row;
			}
			$booking->update_meta( 'stripe_payment_intent_id', (string) $pi->id );
			wait_webhook();
			if ( 'completed' !== BookingModel::find( $booking->id )->getPaymentStatus() ) {
				replay_booking_event( 'payment_intent.succeeded', (string) $pi->id, (int) $booking->id );
			}
			break;

		case 'refunded':
			$pi = pay_pi( $minor, $currency, $meta );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Stripe pay failed';
				return $row;
			}
			$booking->update_meta( 'stripe_payment_intent_id', (string) $pi->id );
			wait_webhook();
			replay_booking_event( 'payment_intent.succeeded', (string) $pi->id, (int) $booking->id );
			stripe_cli( 'refunds create --payment-intent=' . escapeshellarg( (string) $pi->id ) );
			wait_webhook( 4 );
			replay_booking_event( 'charge.refunded', (string) $pi->id, (int) $booking->id );
			break;

		case 'disputed':
			$pi = pay_pi( $minor, $currency, $meta, 'pm_card_createDispute' );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Stripe dispute card pay failed';
				return $row;
			}
			$booking->update_meta( 'stripe_payment_intent_id', (string) $pi->id );
			wait_webhook( 5 );
			replay_booking_event( 'payment_intent.succeeded', (string) $pi->id, (int) $booking->id );
			wait_webhook( 8 );
			replay_booking_event( 'charge.dispute.created', (string) $pi->id, (int) $booking->id );
			break;

		case 'failed':
			$fail_pi = stripe_json( 'payment_intents create --amount=' . $minor . ' --currency=' . escapeshellarg( $currency ) . ' -d payment_method_types[]=card' );
			if ( $fail_pi ) {
				$booking->update_meta( 'stripe_payment_intent_id', (string) $fail_pi->id );
				$fail_pi->status             = 'requires_payment_method';
				$fail_pi->last_payment_error = (object) array( 'message' => 'Your card was declined.' );
				$synthetic                   = (object) array(
					'type' => 'payment_intent.payment_failed',
					'id'   => 'evt_qa_fail_bk_' . $booking->id,
					'data' => (object) array( 'object' => $fail_pi ),
				);
				replay_booking_event( 'payment_intent.payment_failed', '', (int) $booking->id, $synthetic );
			}
			break;

		case 'uncaptured':
			$pi = pay_pi( $minor, $currency, $meta, 'pm_card_visa', true );
			if ( ! $pi || empty( $pi->id ) ) {
				$row['error'] = 'Uncaptured PI create failed';
				return $row;
			}
			$booking->update_meta( 'stripe_payment_intent_id', (string) $pi->id );
			$row['pi_status'] = (string) ( $pi->status ?? '' );
			break;
	}

	$fresh                  = BookingModel::find( $booking->id );
	$row['status']          = (string) $fresh->status;
	$row['payment_status']  = $fresh->getPaymentStatus();
	$row['order_status']    = $fresh->order ? (string) $fresh->order->status : '';
	$row['pi']              = (string) ( $fresh->get_meta( 'stripe_payment_intent_id' ) ?: '' );
	$row['dispute_id']      = (string) ( $fresh->get_meta( 'stripe_dispute_id' ) ?: '' );
	$row['refunded_amount'] = (string) ( $fresh->get_meta( 'stripe_refunded_amount' ) ?: '' );
	return $row;
}

// --- Main ---
echo "Stripe payment scenarios — invoice + booking (data kept)\n";
echo str_repeat( '=', 56 ) . "\n";

if ( ! \DoubleScale\Pro\Modules\Integrations\Stripe\Integration::instance()->is_configured() ) {
	fwrite( STDERR, "Stripe not configured.\n" );
	exit( 1 );
}
$listen = shell_exec( 'pgrep -f "stripe listen" 2>/dev/null' );
if ( ! is_string( $listen ) || '' === trim( $listen ) ) {
	fwrite( STDERR, "Start stripe listen first: ./bin/stripe-listen.sh\n" );
	exit( 1 );
}

$contact_id          = (int) ( InvoiceModel::find( 22 )->contact_id ?? 9 );
$template_booking_id = 1;

foreach ( $scenarios as $scenario ) {
	echo "\n--- {$scenario} ---\n";

	$invoice = create_invoice( $scenario, $amounts[ $scenario ], $contact_id );
	$inv_row = run_invoice_scenario( $scenario, $invoice );
	$results[] = $inv_row;
	echo sprintf(
		"  INVOICE #%d %s status=%s paid=%.2f/%.2f pi=%s payments=%d\n",
		$inv_row['id'],
		$inv_row['number'],
		$inv_row['status'] ?? '?',
		$inv_row['paid'] ?? 0,
		$inv_row['amount'],
		$inv_row['pi'] ?? '-',
		$inv_row['payments'] ?? 0
	);
	if ( ! empty( $inv_row['error'] ) ) {
		echo "    ERROR: {$inv_row['error']}\n";
	}
	if ( ! empty( $inv_row['url'] ) ) {
		echo "    URL: {$inv_row['url']}\n";
	}

	$booking = create_booking( $scenario, $amounts[ $scenario ], $template_booking_id );
	$bk_row  = run_booking_scenario( $scenario, $booking );
	$results[] = $bk_row;
	echo sprintf(
		"  BOOKING #%d pay=%s booking=%s order=%s pi=%s\n",
		$bk_row['id'],
		$bk_row['payment_status'] ?? '?',
		$bk_row['status'] ?? '?',
		$bk_row['order_status'] ?? '-',
		$bk_row['pi'] ?? '-'
	);
	if ( ! empty( $bk_row['error'] ) ) {
		echo "    ERROR: {$bk_row['error']}\n";
	}
	if ( ! empty( $bk_row['pi_status'] ) ) {
		echo "    PI status: {$bk_row['pi_status']}\n";
	}
}

echo "\n" . str_repeat( '=', 56 ) . "\n";
echo "SUMMARY (all data left in DB)\n\n";
printf( "%-12s %-8s %-22s %-12s %-10s\n", 'Scenario', 'Type', 'ID', 'Status', 'PI' );
echo str_repeat( '-', 70 ) . "\n";
foreach ( $results as $r ) {
	$status = 'invoice' === $r['type']
		? ( $r['status'] ?? '?' ) . ' paid=' . ( $r['paid'] ?? 0 )
		: ( $r['payment_status'] ?? '?' ) . ' order=' . ( $r['order_status'] ?? '-' );
	printf(
		"%-12s %-8s %-22s %-12s %s\n",
		$r['scenario'],
		$r['type'],
		'invoice' === $r['type'] ? "#{$r['id']} {$r['number']}" : "#{$r['id']}",
		$status,
		substr( $r['pi'] ?? '-', 0, 28 )
	);
}

$summary_file = dirname( __DIR__ ) . '/STRIPE-QA-SCENARIOS.md';
$md           = "# Stripe QA scenarios (left in DB)\n\nGenerated: " . gmdate( 'Y-m-d H:i:s' ) . " UTC\n\n";
$md          .= "| Scenario | Invoice | Booking |\n|---|---|---|\n";
for ( $i = 0; $i < count( $scenarios ); $i++ ) {
	$inv = $results[ $i * 2 ];
	$bk  = $results[ $i * 2 + 1 ];
	$md .= sprintf(
		"| **%s** | #%d %s — %s ($%.2f) [view](%s) | #%d — pay=%s order=%s ($%.2f) |\n",
		$scenarios[ $i ],
		$inv['id'],
		$inv['number'],
		$inv['status'] ?? '?',
		$inv['amount'],
		$inv['url'] ?? '',
		$bk['id'],
		$bk['payment_status'] ?? '?',
		$bk['order_status'] ?: '-',
		$bk['amount']
	);
}
file_put_contents( $summary_file, $md );
echo "\nWritten: {$summary_file}\n";

exit( 0 );
