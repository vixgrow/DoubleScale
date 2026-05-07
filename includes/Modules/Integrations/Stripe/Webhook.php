<?php
/**
 * Stripe webhook receiver.
 *
 * Single REST endpoint at `/doublescale/v1/integrations/stripe/webhook`.
 * Verifies the Stripe signature against the active mode's `webhook_secret`,
 * then routes the event by `data.object.metadata.source`:
 *
 *   - `'booking'`  → `do_action( 'doublescale_stripe_booking_event', $event, (int) $booking_id )`
 *   - (future)     → `'deal'`, `'invoice'`, etc.
 *
 * The CRM side never knows about booking-specific business logic; the
 * Booking adapter (`StripeBookingGateway`) subscribes to the booking action
 * and does the booking-specific work (status flips, order rows, logs).
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Integrations\Stripe;

use Stripe\Webhook as StripeWebhook;
use Stripe\Exception\SignatureVerificationException;

defined( 'ABSPATH' ) || exit;

class Webhook {

	public function register_routes(): void {
		register_rest_route(
			'doublescale/v1',
			'/integrations/stripe/webhook',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	public function handle( \WP_REST_Request $request ) {
		$mode_settings = Integration::instance()->get_mode_settings();
		if ( ! $mode_settings ) {
			return new \WP_REST_Response( array( 'message' => 'Stripe is not configured.' ), 400 );
		}

		$payload   = $request->get_body();
		$signature = $request->get_header( 'stripe_signature' );

		if ( empty( $signature ) ) {
			return new \WP_REST_Response( array( 'message' => 'Missing Stripe signature header.' ), 400 );
		}

		try {
			$event = StripeWebhook::constructEvent(
				$payload,
				$signature,
				$mode_settings['webhook_secret']
			);
		} catch ( SignatureVerificationException $e ) {
			doublescale_get_logger()->warning(
				'Stripe webhook signature failed',
				array( 'code' => 'stripe_webhook_sig_failed', 'message' => $e->getMessage() )
			);
			return new \WP_REST_Response( array( 'message' => 'Invalid signature.' ), 400 );
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Stripe webhook parse failed',
				array( 'code' => 'stripe_webhook_parse_failed', 'message' => $e->getMessage() )
			);
			return new \WP_REST_Response( array( 'message' => 'Invalid payload.' ), 400 );
		}

		$object   = $event->data->object ?? null;
		$metadata = isset( $object->metadata ) ? (array) $object->metadata : array();
		$source   = $metadata['source'] ?? '';

		switch ( $source ) {
			case 'booking':
				$booking_id = isset( $metadata['booking_id'] ) ? (int) $metadata['booking_id'] : 0;
				do_action( 'doublescale_stripe_booking_event', $event, $booking_id );
				break;
			default:
				do_action( 'doublescale_stripe_event', $event, $source );
				break;
		}

		return new \WP_REST_Response( array( 'received' => true ), 200 );
	}
}
