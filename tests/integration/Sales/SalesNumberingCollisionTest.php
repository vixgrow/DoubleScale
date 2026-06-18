<?php
/**
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Services\SalesNumbering;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class SalesNumberingCollisionTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
	}

	public function test_save_with_retry_skips_planted_number_collision(): void {
		$contact_id = $this->make_contact();
		$next       = SalesNumbering::next_invoice_number();

		$blocker = new InvoiceModel();
		$blocker->fill(
			array(
				'invoice_number' => $next,
				'contact_id'     => $contact_id,
				'status'         => InvoiceStatus::DRAFT,
				'currency'       => 'USD',
				'line_items'     => array( array( 'qty' => 1, 'rate' => 10, 'amount' => 10 ) ),
			)
		);
		$blocker->save();

		$invoice = new InvoiceModel();
		$invoice->fill(
			array(
				'contact_id' => $contact_id,
				'status'     => InvoiceStatus::DRAFT,
				'currency'   => 'USD',
				'line_items' => array( array( 'qty' => 1, 'rate' => 20, 'amount' => 20 ) ),
			)
		);

		SalesNumbering::save_with_retry( $invoice );

		$this->assertNotSame( $next, (string) $invoice->invoice_number );
		$this->assertMatchesRegularExpression( '/^INV-\d{6}$/', (string) $invoice->invoice_number );
	}

	private function ensure_sales_module(): void {
		$modules = get_option( 'doublescale_enabled_modules', array() );
		if ( empty( $modules['sales'] ) ) {
			$modules['sales'] = true;
			update_option( 'doublescale_enabled_modules', $modules );
		}

		ModuleManager::activateModule( 'sales' );
	}
}
