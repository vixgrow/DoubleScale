<?php
/**
 * Stripe customer lookup / create.
 *
 * Lifted from `Modules/Booking/PaymentGateways/Stripe/Customers.php`. Now
 * resolves credentials from the global Stripe integration instead of the old
 * Booking-side gateway singleton.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Integrations\Stripe;

use Stripe\StripeClient;

defined( 'ABSPATH' ) || exit;

class Customers {

	/**
	 * @var StripeClient
	 */
	private $client;

	/**
	 * @param array|null $mode_settings Pre-resolved credentials. If null, asks
	 *                                  the global integration for the active
	 *                                  mode's credentials.
	 */
	public function __construct( ?array $mode_settings = null ) {
		if ( null === $mode_settings ) {
			$mode_settings = Integration::instance()->get_mode_settings();
		}

		$this->client = new StripeClient( $mode_settings['secret_key'] );
	}

	/**
	 * Find an existing customer by email. Returns Stripe customer id or null.
	 */
	public function get( string $email ): ?string {
		$customers = $this->client->customers->all( array( 'email' => $email ) );
		return $customers->data[0]->id ?? null;
	}

	public function create( ?string $name, ?string $email ): string {
		$customer = $this->client->customers->create(
			array_filter(
				array(
					'name'  => $name,
					'email' => $email,
				),
				static fn ( $v ) => null !== $v && '' !== $v
			)
		);
		return $customer->id;
	}

	public function get_or_create( ?string $name, ?string $email ): string {
		if ( $email && filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
			$existing = $this->get( $email );
			if ( $existing ) {
				return $existing;
			}
		}
		return $this->create( $name, $email );
	}
}
