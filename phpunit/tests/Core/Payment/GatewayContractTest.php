<?php
/**
 * Gateway contract defaults used by the generic redirect payment path.
 *
 * @package DoubleScale\Tests\Core\Payment
 */

namespace DoubleScale\Tests\Core\Payment;

use DoubleScale\Core\Payment\Gateway;
use DoubleScale\Core\Payment\GatewayManager;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class GatewayContractTest extends TestCase {

	/**
	 * A gateway that overrides nothing — must receive the contract defaults.
	 *
	 * @return Gateway
	 */
	private function make_plain_gateway(): Gateway {
		return new class() extends Gateway {
			public $slug = 'acme';
			public $name = 'Acme Pay';
			public $description = 'Test';

			protected function register(): void {}

			public function is_available(): bool {
				return true;
			}

			public function is_configured(): bool {
				return true;
			}

			public function init( $subject ) {
				return array();
			}

			public function confirm( $subject ) {
				return array();
			}

			public function record_paid( $subject, $charge ): void {
				unset( $subject, $charge );
			}
		};
	}

	/**
	 * A hosted-checkout gateway — the shape every redirect gateway takes.
	 *
	 * @return Gateway
	 */
	private function make_redirect_gateway(): Gateway {
		return new class() extends Gateway {
			public $slug = 'acme_hosted';
			public $name = 'Acme Hosted';
			public $description = 'Test';

			protected function register(): void {}

			public function is_available(): bool {
				return true;
			}

			public function is_configured(): bool {
				return true;
			}

			public function init( $subject ) {
				return array();
			}

			public function confirm( $subject ) {
				return array();
			}

			public function record_paid( $subject, $charge ): void {
				unset( $subject, $charge );
			}

			public function uses_major_units(): bool {
				return false;
			}

			public function return_query_arg(): string {
				return 'ds_acme_hosted_return';
			}
		};
	}

	public function test_defaults_are_major_units_and_non_redirect(): void {
		$gateway = $this->make_plain_gateway();

		$this->assertTrue( $gateway->uses_major_units() );
		$this->assertSame( '', $gateway->return_query_arg() );
	}

	public function test_default_payment_note_uses_gateway_name(): void {
		$gateway = $this->make_plain_gateway();

		$this->assertSame(
			'Acme Pay payment for invoice INV-42',
			$gateway->payment_note( 'INV-42' )
		);
	}

	public function test_redirect_gateway_declares_its_return_arg_and_minor_units(): void {
		$gateway = $this->make_redirect_gateway();

		$this->assertFalse( $gateway->uses_major_units() );
		$this->assertSame( 'ds_acme_hosted_return', $gateway->return_query_arg() );
	}

	/**
	 * The client decides "is this a redirect gateway?" purely from this field,
	 * so every shaped row must carry it.
	 */
	public function test_status_list_rows_expose_return_arg_to_the_client(): void {
		$rows = GatewayManager::instance()->shape_status_list();
		$this->assertIsArray( $rows );

		foreach ( $rows as $row ) {
			$this->assertArrayHasKey(
				'return_query_arg',
				$row,
				'Every gateway row must expose return_query_arg.'
			);
			$this->assertIsString( $row['return_query_arg'] );
		}
	}
}
