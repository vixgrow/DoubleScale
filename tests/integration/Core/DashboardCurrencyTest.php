<?php
/**
 * Mixed-currency totals stay as maps — never a blended scalar.
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Core\Services\CurrencyResolver;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class DashboardCurrencyTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		Settings::update( 'currency', array( 'currency' => 'USD' ) );
		$this->ensure_sales_module();
		Capabilities::ensure_capabilities_synced();
	}

	public function test_two_invoices_group_by_currency_and_are_never_added(): void {
		$eur = $this->make_invoice( 'EUR', 100 );
		$usd = $this->make_invoice( 'USD', 100 );

		$totals = CurrencyResolver::sum_by_currency( array( $eur, $usd ), 'total' );

		$this->assertSame( array( 'EUR' => 100.0, 'USD' => 100.0 ), $totals );

		$admin    = $this->make_admin_user();
		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/invoices/summary',
			array(),
			$admin
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$map  = $data['outstanding_by_currency'] ?? array();

		$this->assertArrayHasKey( 'EUR', $map );
		$this->assertArrayHasKey( 'USD', $map );
		// Scalar is the global (USD) bucket — adding EUR+USD into it is the bug.
		$this->assertSame( (float) $map['USD'], (float) $data['outstanding_total'] );
		$this->assertGreaterThan( (float) $data['outstanding_total'], (float) array_sum( $map ) );
	}

	public function test_dashboard_won_deals_are_not_added_across_currencies(): void {
		$modules          = get_option( 'doublescale_enabled_modules', array() );
		$modules['deals'] = true;
		update_option( 'doublescale_enabled_modules', $modules );

		$pro_main = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/doublescale-pro.php';
		if ( is_readable( $pro_main ) ) {
			require_once $pro_main;
		}
		if ( ! class_exists( '\DoubleScale\Pro\Modules\Deals\Models\DealModel' ) ) {
			$this->markTestSkipped( 'Requires doublescale-pro DealModel.' );
		}

		ModuleManager::activateModule( 'deals' );
		if ( class_exists( '\DoubleScale\Pro\Modules\Deals\Migrations\DealsTable' ) ) {
			( new \DoubleScale\Pro\Modules\Deals\Migrations\DealsTable() )->run();
		}

		$contact_id = $this->make_contact();
		$eur        = $this->make_deal( $contact_id, 'EUR', 100 );
		$usd        = $this->make_deal( $contact_id, 'USD', 100 );

		$totals = CurrencyResolver::sum_by_currency( array( $eur, $usd ), 'value' );
		$this->assertSame( array( 'EUR' => 100.0, 'USD' => 100.0 ), $totals );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/general/dashboard',
			array(),
			$this->make_admin_user()
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'deals_won_value_by_currency', $data );
		$map = $data['deals_won_value_by_currency'];
		if ( empty( $map ) ) {
			$this->markTestSkipped( 'Dashboard did not aggregate deals (module inactive in this install).' );
		}

		$this->assertArrayHasKey( 'EUR', $map );
		$this->assertArrayHasKey( 'USD', $map );
		$this->assertSame( (float) $map['USD'], (float) $data['deals_won_value'] );
		$this->assertGreaterThan( (float) $data['deals_won_value'], (float) array_sum( $map ) );
	}

	/**
	 * @param string $currency Currency code.
	 * @param float  $amount   Line total.
	 * @return InvoiceModel
	 */
	private function make_invoice( $currency, $amount ): InvoiceModel {
		$invoice = new InvoiceModel();
		$invoice->fill(
			array(
				'contact_id'     => $this->make_contact(),
				'status'         => InvoiceStatus::UNPAID,
				'currency'       => $currency,
				'discount_type'  => 'none',
				'discount_value' => 0,
				'line_items'     => array(
					array(
						'qty'    => 1,
						'rate'   => $amount,
						'amount' => $amount,
					),
				),
				'invoice_date'   => current_time( 'Y-m-d' ),
				'due_date'       => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
			)
		);
		$invoice->save();

		return $invoice->fresh();
	}

	/**
	 * @param int    $contact_id Contact ID.
	 * @param string $currency   Stored currency.
	 * @param float  $value      Deal value.
	 * @return \DoubleScale\Pro\Modules\Deals\Models\DealModel
	 */
	private function make_deal( $contact_id, $currency, $value ) {
		$deal = new \DoubleScale\Pro\Modules\Deals\Models\DealModel();
		$deal->fill(
			array(
				'title'       => 'Won ' . $currency,
				'contact_id'  => (int) $contact_id,
				'pipeline_id' => 1,
				'stage_id'    => 1,
				'value'       => $value,
				'currency'    => $currency,
				'status'      => 'won',
			)
		);
		$deal->save();

		return $deal->fresh();
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
