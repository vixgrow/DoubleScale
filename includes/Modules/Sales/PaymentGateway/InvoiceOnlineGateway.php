<?php
/**
 * Abstract online payment gateway for sales invoices.
 *
 * Offline modes (bank transfer, cash, etc.) are recorded manually via
 * RestInvoicePaymentController. Online gateways (Stripe today; extensible)
 * implement init/confirm flows against the shared integrations layer.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\PaymentGateway;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Managers\InvoiceOnlineGatewaysManager;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use WP_Error;

/**
 * InvoiceOnlineGateway class.
 */
abstract class InvoiceOnlineGateway {

	/**
	 * Human-readable gateway name.
	 *
	 * @var string
	 */
	public $name = '';

	/**
	 * Gateway slug — must match PaymentMode constant when applicable.
	 *
	 * @var string
	 */
	public $slug = '';

	/**
	 * Short description for admin UI.
	 *
	 * @var string
	 */
	public $description = '';

	/**
	 * @var array<class-string, static>
	 */
	private static $instances = array();

	/**
	 * @return static
	 */
	public static function instance() {
		$class = static::class;
		if ( ! isset( self::$instances[ $class ] ) ) {
			$instance = new static();
			$instance->register();
			self::$instances[ $class ] = $instance;
		}
		return self::$instances[ $class ];
	}

	/**
	 * @return void
	 */
	protected function register(): void {
		InvoiceOnlineGatewaysManager::instance()->register( $this );
	}

	/**
	 * Whether the gateway implementation is present (e.g. Pro module active).
	 *
	 * @return bool
	 */
	abstract public function is_available(): bool;

	/**
	 * Whether credentials/settings are complete.
	 *
	 * @return bool
	 */
	abstract public function is_configured(): bool;

	/**
	 * Start an online payment session for the invoice balance.
	 *
	 * @param InvoiceModel $invoice Invoice.
	 * @return array|WP_Error
	 */
	abstract public function init_payment( InvoiceModel $invoice );

	/**
	 * Confirm / poll payment status after the customer completes checkout.
	 *
	 * @param InvoiceModel $invoice Invoice.
	 * @return array|WP_Error
	 */
	abstract public function confirm_payment( InvoiceModel $invoice );

	/**
	 * Payment mode slug stored on recorded payment rows.
	 *
	 * @return string
	 */
	public function payment_mode_slug(): string {
		return (string) $this->slug;
	}
}
