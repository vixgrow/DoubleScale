<?php
/**
 * Registry for online invoice payment gateways.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Managers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\PaymentGateway\InvoiceOnlineGateway;
use DoubleScale\Modules\Sales\Services\InvoicePayable;
use DoubleScale\Modules\Sales\Services\SalesSettings;
use WP_Error;

/**
 * InvoiceOnlineGatewaysManager class.
 */
final class InvoiceOnlineGatewaysManager {

	/**
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * @var array<string, InvoiceOnlineGateway>
	 */
	private $gateways = array();

	/**
	 * @return self
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * @param InvoiceOnlineGateway $gateway Gateway.
	 * @return void
	 */
	public function register( InvoiceOnlineGateway $gateway ): void {
		$slug = sanitize_key( (string) $gateway->slug );
		if ( '' === $slug || isset( $this->gateways[ $slug ] ) ) {
			return;
		}
		$this->gateways[ $slug ] = $gateway;
	}

	/**
	 * @param string $slug Gateway slug.
	 * @return InvoiceOnlineGateway|null
	 */
	public function get( string $slug ): ?InvoiceOnlineGateway {
		$slug = sanitize_key( $slug );
		return $this->gateways[ $slug ] ?? null;
	}

	/**
	 * @return InvoiceOnlineGateway[]
	 */
	public function all(): array {
		return array_values( $this->gateways );
	}

	/**
	 * @return string[]
	 */
	public function slugs(): array {
		return array_keys( $this->gateways );
	}

	/**
	 * Gateways allowed on this invoice and ready to accept payment.
	 *
	 * @param InvoiceModel $invoice Invoice.
	 * @return InvoiceOnlineGateway[]
	 */
	public function is_enabled_for_sales( string $slug ): bool {
		$slug    = sanitize_key( $slug );
		$enabled = SalesSettings::get_resolved_enabled_online_gateways();

		return in_array( $slug, $enabled, true );
	}

	public function get_payable_for_invoice( InvoiceModel $invoice ): array {
		$payable = array();
		foreach ( $this->all() as $gateway ) {
			if ( ! $this->is_enabled_for_sales( $gateway->slug ) ) {
				continue;
			}
			if ( ! InvoicePayable::gateway_allowed( $invoice, $gateway->slug ) ) {
				continue;
			}
			if ( ! $gateway->is_available() || ! $gateway->is_configured() ) {
				continue;
			}
			$payable[] = $gateway;
		}
		return $payable;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function shape_status_list(): array {
		$list = array();
		foreach ( $this->all() as $gateway ) {
			$enabled_for_sales = $this->is_enabled_for_sales( $gateway->slug );
			$list[]            = array(
				'slug'              => (string) $gateway->slug,
				'name'              => (string) $gateway->name,
				'description'       => (string) $gateway->description,
				'available'         => $gateway->is_available(),
				'configured'        => $gateway->is_configured(),
				'enabled_for_sales' => $enabled_for_sales,
				'ready'             => $enabled_for_sales
					&& $gateway->is_available()
					&& $gateway->is_configured(),
				'integration_url'   => $this->integration_url_for( $gateway->slug ),
			);
		}
		return $list;
	}

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @return array<int, array<string, mixed>>
	 */
	public function shape_for_invoice( InvoiceModel $invoice ): array {
		$list = array();
		foreach ( $this->all() as $gateway ) {
			if ( ! $this->is_enabled_for_sales( $gateway->slug ) ) {
				continue;
			}
			if ( ! InvoicePayable::gateway_allowed( $invoice, $gateway->slug ) ) {
				continue;
			}
			$list[] = array(
				'slug'        => (string) $gateway->slug,
				'name'        => (string) $gateway->name,
				'available'   => $gateway->is_available(),
				'configured'  => $gateway->is_configured(),
				'can_pay'     => $gateway->is_available()
					&& $gateway->is_configured()
					&& true === InvoicePayable::guard( $invoice, $gateway->slug ),
			);
		}
		return $list;
	}

	/**
	 * @param string       $slug    Gateway slug.
	 * @param InvoiceModel $invoice Invoice.
	 * @return array|WP_Error
	 */
	public function init_payment( string $slug, InvoiceModel $invoice ) {
		$guard = InvoicePayable::guard( $invoice, $slug );
		if ( is_wp_error( $guard ) ) {
			return $guard;
		}

		$gateway = $this->get( $slug );
		if ( ! $gateway ) {
			return new WP_Error(
				'gateway_not_found',
				__( 'Payment gateway not found.', 'doublescale' ),
				array( 'status' => 404 )
			);
		}

		if ( ! $this->is_enabled_for_sales( $slug ) ) {
			return new WP_Error(
				'gateway_disabled',
				__( 'This payment gateway is disabled in Sales settings.', 'doublescale' ),
				array( 'status' => 403 )
			);
		}

		if ( ! $gateway->is_available() ) {
			return new WP_Error(
				'gateway_unavailable',
				__( 'This payment gateway is not available.', 'doublescale' ),
				array( 'status' => 503 )
			);
		}

		if ( ! $gateway->is_configured() ) {
			return new WP_Error(
				'gateway_not_configured',
				__( 'This payment gateway is not configured.', 'doublescale' ),
				array( 'status' => 503 )
			);
		}

		$legacy = $this->apply_legacy_filter( 'init', $slug, null, $invoice );
		if ( null !== $legacy ) {
			return $legacy;
		}

		return $gateway->init_payment( $invoice );
	}

	/**
	 * @param string       $slug    Gateway slug.
	 * @param InvoiceModel $invoice Invoice.
	 * @return array|WP_Error
	 */
	public function confirm_payment( string $slug, InvoiceModel $invoice ) {
		$gateway = $this->get( $slug );
		if ( ! $gateway ) {
			return new WP_Error(
				'gateway_not_found',
				__( 'Payment gateway not found.', 'doublescale' ),
				array( 'status' => 404 )
			);
		}

		if ( ! $gateway->is_available() ) {
			return new WP_Error(
				'gateway_unavailable',
				__( 'This payment gateway is not available.', 'doublescale' ),
				array( 'status' => 503 )
			);
		}

		$legacy = $this->apply_legacy_filter( 'confirm', $slug, null, $invoice );
		if ( null !== $legacy ) {
			return $legacy;
		}

		return $gateway->confirm_payment( $invoice );
	}

	/**
	 * Backward compatibility for stripe-specific filters.
	 *
	 * @param string       $action  init|confirm.
	 * @param string       $slug    Gateway slug.
	 * @param mixed        $default Default value.
	 * @param InvoiceModel $invoice Invoice.
	 * @return mixed
	 */
	private function apply_legacy_filter( string $action, string $slug, $default, InvoiceModel $invoice ) {
		if ( 'stripe' !== $slug ) {
			return $default;
		}
		$hook = 'init' === $action
			? 'doublescale_sales_invoice_stripe_init'
			: 'doublescale_sales_invoice_stripe_confirm';
		return apply_filters( $hook, $default, $invoice );
	}

	/**
	 * Admin URL for gateway credentials (Integrations, etc.).
	 *
	 * @param string $slug Gateway slug.
	 * @return string
	 */
	private function integration_url_for( string $slug ): string {
		$url = apply_filters( 'doublescale_sales_payment_gateway_integration_url', '', $slug );
		if ( '' !== $url ) {
			return (string) $url;
		}

		if ( 'stripe' === $slug ) {
			return admin_url( 'admin.php?page=doublescale&path=integrations/stripe' );
		}

		return '';
	}
}
