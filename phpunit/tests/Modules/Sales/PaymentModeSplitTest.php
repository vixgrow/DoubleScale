<?php
/**
 * Payment mode offline vs online gateway split.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Constants\PaymentMode;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class PaymentModeSplitTest extends TestCase {

	public function test_stripe_is_online_gateway_not_offline(): void {
		$this->assertTrue( PaymentMode::is_online_gateway( PaymentMode::STRIPE ) );
		$this->assertFalse( PaymentMode::is_offline( PaymentMode::STRIPE ) );
	}

	public function test_bank_transfer_is_offline_not_online_gateway(): void {
		$this->assertTrue( PaymentMode::is_offline( PaymentMode::BANK_TRANSFER ) );
		$this->assertFalse( PaymentMode::is_online_gateway( PaymentMode::BANK_TRANSFER ) );
	}

	public function test_split_modes_separates_offline_and_online(): void {
		$split = PaymentMode::split_modes(
			array( PaymentMode::CASH, PaymentMode::STRIPE, PaymentMode::BANK_TRANSFER )
		);

		$this->assertSame( array( PaymentMode::CASH, PaymentMode::BANK_TRANSFER ), $split['offline'] );
		$this->assertSame( array( PaymentMode::STRIPE ), $split['online'] );
	}

	public function test_legacy_paypal_normalizes_to_other(): void {
		$this->assertSame( PaymentMode::OTHER, PaymentMode::normalize( 'paypal' ) );
		$this->assertNotContains( 'paypal', PaymentMode::offline_modes() );
	}
}
