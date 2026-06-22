<?php
/**
 * Legacy Pro booking payment gateway compatibility.
 */

declare(strict_types=1);

namespace DoubleScale\Tests\Modules\Booking;

use DoubleScale\Compat\LegacyProBookingPayment;
use DoubleScale\Modules\Booking\Managers\PaymentGatewaysManager;
use DoubleScale\Modules\Booking\PaymentGateway\PaymentGateway;
use PHPUnit\Framework\TestCase;

final class LegacyProPaymentGatewayCompatTest extends TestCase {

	public function test_legacy_booking_payment_classes_are_available_after_bootstrap(): void {
		LegacyProBookingPayment::ensure_loaded();

		$this->assertTrue( class_exists( PaymentGateway::class ) );
		$this->assertTrue( class_exists( PaymentGatewaysManager::class ) );
	}

	public function test_legacy_gateway_can_register_without_fatal(): void {
		LegacyProBookingPayment::ensure_loaded();

		$gateway = new class() extends PaymentGateway {
			public $slug = 'legacy-test';

			public $name = 'Legacy Test';

			public function is_configured() {
				return true;
			}

			public function get_fields() {
				return array();
			}
		};

		PaymentGatewaysManager::instance()->register_payment_gateway( $gateway );

		$this->assertSame( $gateway, PaymentGatewaysManager::instance()->get_item( 'legacy-test' ) );
	}
}
