<?php
/**
 * Online gateway allow-list vs offline recording modes.
 *
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Services\InvoicePayable;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class InvoicePayableGatewayAllowedTest extends TestCase {

	public function test_offline_only_modes_do_not_block_online_gateways(): void {
		$invoice = new InvoiceModel();
		$invoice->allowed_payment_modes = array(
			PaymentMode::BANK_TRANSFER,
			PaymentMode::CASH,
			PaymentMode::CHECK,
		);

		$this->assertTrue( InvoicePayable::gateway_allowed( $invoice, PaymentMode::STRIPE ) );
		$this->assertTrue( InvoicePayable::gateway_allowed( $invoice, PaymentMode::PAYPAL ) );
	}

	public function test_explicit_online_allow_list_is_respected(): void {
		$invoice = new InvoiceModel();
		$invoice->allowed_payment_modes = array(
			PaymentMode::BANK_TRANSFER,
			PaymentMode::STRIPE,
		);

		$this->assertTrue( InvoicePayable::gateway_allowed( $invoice, PaymentMode::STRIPE ) );
		$this->assertFalse( InvoicePayable::gateway_allowed( $invoice, PaymentMode::PAYPAL ) );
	}

	public function test_empty_allow_list_allows_any_online_gateway(): void {
		$invoice = new InvoiceModel();
		$invoice->allowed_payment_modes = array();

		$this->assertTrue( InvoicePayable::gateway_allowed( $invoice, PaymentMode::STRIPE ) );
	}
}
