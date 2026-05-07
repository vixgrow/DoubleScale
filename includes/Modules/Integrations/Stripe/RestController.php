<?php
/**
 * Stripe REST controller.
 *
 * Inherits the standard `/integrations/stripe` GET/POST settings CRUD from
 * `RestIntegrationController` (driven by `get_settings_schema()`). Adds:
 *
 *   POST /doublescale/v1/integrations/stripe/connect
 *     Validates credentials with `Account::retrieve()` and auto-registers a
 *     Stripe webhook endpoint pointing at `/integrations/stripe/webhook`.
 *
 *   POST /doublescale/v1/integrations/stripe/webhook
 *     Routed via {@see Webhook::register_routes()}.
 *
 * Mirrors QuillBooking-pro's `class-rest-settings-controller.php` flow.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Integrations\Stripe;

use DoubleScale\Modules\Integrations\Abstracts\RestIntegrationController;

defined( 'ABSPATH' ) || exit;

class RestController extends RestIntegrationController {

	public function register_additional_routes(): void {
		register_rest_route(
			$this->namespace,
			'/integrations/stripe/connect',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'connect_account' ),
				'permission_callback' => array( $this, 'update_permissions_check' ),
				'args'                => array(
					'mode' => array(
						'required'          => true,
						'type'              => 'string',
						'enum'              => array( 'sandbox', 'live' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		( new Webhook() )->register_routes();
	}

	/**
	 * Validate the saved credentials for a mode and (re)register a Stripe
	 * webhook endpoint pointing at this site. Persists the resulting
	 * `webhook_id` + `webhook_secret`.
	 */
	public function connect_account( \WP_REST_Request $request ) {
		$mode     = $request->get_param( 'mode' );
		$settings = $this->integration->get_settings();

		$secret_key = $settings[ "{$mode}_secret_key" ] ?? '';
		if ( '' === $secret_key ) {
			return new \WP_Error(
				'missing_secret',
				__( 'Save the Stripe secret key for this mode before connecting.', 'doublescale' ),
				array( 'status' => 400 )
			);
		}

		$api      = new Api( $secret_key );
		$account  = $api->retrieve_account();
		if ( ! $account['success'] ) {
			return new \WP_Error( 'stripe_connect_failed', $account['message'], array( 'status' => 400 ) );
		}

		// Stripe rejects webhook URLs that aren't publicly reachable (e.g.
		// localhost). For local dev with a tunnel like ngrok, set
		// `DOUBLESCALE_PUBLIC_REST_URL` to the public REST root so the
		// webhook registers against the tunnel — every other request keeps
		// using `rest_url()` against the local domain.
		if ( \defined( 'DOUBLESCALE_PUBLIC_REST_URL' ) && \DOUBLESCALE_PUBLIC_REST_URL ) {
			$webhook_url = \trailingslashit( \DOUBLESCALE_PUBLIC_REST_URL ) . 'doublescale/v1/integrations/stripe/webhook';
		} else {
			$webhook_url = \rest_url( 'doublescale/v1/integrations/stripe/webhook' );
		}
		$webhook     = $api->create_webhook_endpoint(
			$webhook_url,
			array(
				'payment_intent.succeeded',
				'payment_intent.payment_failed',
			)
		);

		if ( ! $webhook['success'] ) {
			return new \WP_Error( 'stripe_webhook_create_failed', $webhook['message'], array( 'status' => 400 ) );
		}

		$settings[ "{$mode}_webhook_id" ]     = $webhook['id'];
		$settings[ "{$mode}_webhook_secret" ] = $webhook['secret'];
		$this->integration->update_settings( $settings );

		return new \WP_REST_Response(
			array(
				'success'      => true,
				'mode'         => $mode,
				'account'      => $account['data'],
				'webhook_id'   => $webhook['id'],
				'webhook_url'  => $webhook_url,
			),
			200
		);
	}

	public function get_settings_schema() {
		$arg = array( 'sanitize_callback' => 'sanitize_text_field' );

		$properties = array(
			'mode' => array(
				'label'       => __( 'Mode', 'doublescale' ),
				'type'        => 'string',
				'enum'        => array( 'sandbox', 'live' ),
				'arg_options' => $arg,
			),
		);
		foreach ( array( 'sandbox', 'live' ) as $mode ) {
			foreach ( array( 'publishable_key', 'secret_key', 'webhook_id', 'webhook_secret' ) as $field ) {
				$properties[ "{$mode}_{$field}" ] = array(
					'label'       => sprintf( '%s %s', ucfirst( $mode ), str_replace( '_', ' ', $field ) ),
					'type'        => 'string',
					'arg_options' => $arg,
				);
			}
		}

		return array(
			'type'       => 'object',
			'properties' => $properties,
		);
	}
}
