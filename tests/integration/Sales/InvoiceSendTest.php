<?php
/**
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Renderer\InvoiceFrontendHandler;
use DoubleScale\Modules\Documents\Services\InvoiceUrl;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class InvoiceSendTest extends IntegrationTestCase {

	/** @var int */
	private $admin_id;

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Capabilities::ensure_capabilities_synced();
		$this->admin_id = $this->make_admin_user();
		InvoiceUrl::flush_cache();
	}

	public function test_send_returns_400_when_no_invoice_page_exists(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::DRAFT ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/send',
			array(),
			$this->admin_id
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'no_invoice_page', $response->as_error()->get_error_code() );
	}

	public function test_send_sets_sent_at_and_flips_draft_to_unpaid(): void {
		$this->create_invoice_page();

		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::DRAFT ) );

		add_filter(
			'pre_wp_mail',
			static function () {
				return true;
			}
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/send',
			array( 'message' => 'Please pay soon.' ),
			$this->admin_id
		);

		remove_all_filters( 'pre_wp_mail' );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['sent'] );
		$this->assertSame( InvoiceStatus::UNPAID, $data['invoice']['status'] );
		$this->assertNotEmpty( $data['invoice']['sent_at'] );

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::UNPAID, (string) $invoice->status );
		$this->assertNotEmpty( $invoice->sent_at );
	}

	public function test_send_freezes_null_currency_to_global(): void {
		$this->create_invoice_page();
		\DoubleScale\Core\Settings\Settings::update( 'currency', array( 'currency' => 'EUR' ) );

		$invoice = $this->make_invoice(
			array(
				'status'   => InvoiceStatus::DRAFT,
				'currency' => null,
			)
		);

		add_filter(
			'pre_wp_mail',
			static function () {
				return true;
			}
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/send',
			array(),
			$this->admin_id
		);

		remove_all_filters( 'pre_wp_mail' );

		$this->assertSame( 200, $response->get_status() );
		$invoice->refresh();
		$this->assertSame( 'EUR', (string) $invoice->currency );
		$this->assertNotEmpty( $invoice->sent_at );
	}

	public function test_patch_rejects_currency_change_after_send(): void {
		$this->create_invoice_page();

		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::DRAFT, 'currency' => 'USD' ) );

		add_filter(
			'pre_wp_mail',
			static function () {
				return true;
			}
		);
		$this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/send',
			array(),
			$this->admin_id
		);
		remove_all_filters( 'pre_wp_mail' );

		$response = $this->dispatch_rest(
			'PATCH',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id,
			array( 'currency' => 'EUR' ),
			$this->admin_id
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'currency_locked', $response->as_error()->get_error_code() );
	}

	public function test_patch_rejects_currency_change_when_amount_paid(): void {
		$invoice = $this->make_invoice(
			array(
				'status'      => InvoiceStatus::DRAFT,
				'currency'    => 'USD',
				'amount_paid' => 10,
			)
		);

		$response = $this->dispatch_rest(
			'PATCH',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id,
			array( 'currency' => 'EUR' ),
			$this->admin_id
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'currency_locked', $response->as_error()->get_error_code() );
	}

	public function test_post_rejects_junk_currency_and_normalises_lowercase(): void {
		$contact_id = $this->make_contact();

		$junk = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices',
			array(
				'contact_id' => $contact_id,
				'currency'   => 'XYZ',
				'line_items' => array( array( 'qty' => 1, 'rate' => 10 ) ),
			),
			$this->admin_id
		);
		$this->assertSame( 400, $junk->get_status() );
		$this->assertSame( 'invalid_currency', $junk->as_error()->get_error_code() );

		$lower = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices',
			array(
				'contact_id' => $contact_id,
				'currency'   => 'eur',
				'line_items' => array( array( 'qty' => 1, 'rate' => 10 ) ),
			),
			$this->admin_id
		);
		$this->assertSame( 201, $lower->get_status() );
		$this->assertSame( 'EUR', $lower->get_data()['currency'] );
		$this->assertSame( 'EUR', $lower->get_data()['currency_stored'] );

		$inherit = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices',
			array(
				'contact_id' => $contact_id,
				'currency'   => null,
				'line_items' => array( array( 'qty' => 1, 'rate' => 10 ) ),
			),
			$this->admin_id
		);
		$this->assertSame( 201, $inherit->get_status() );
		$this->assertNull( $inherit->get_data()['currency_stored'] );

		$empty = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices',
			array(
				'contact_id' => $contact_id,
				'currency'   => '',
				'line_items' => array( array( 'qty' => 1, 'rate' => 10 ) ),
			),
			$this->admin_id
		);
		$this->assertSame( 201, $empty->get_status() );
		$this->assertNull( $empty->get_data()['currency_stored'] );
	}

	private function create_invoice_page(): int {
		return (int) self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => 'Invoice Portal',
				'post_content' => '[' . InvoiceFrontendHandler::SHORTCODE_NAME . ']',
			)
		);
	}

	/**
	 * @param array<string, mixed> $overrides Invoice attributes.
	 * @return InvoiceModel
	 */
	private function make_invoice( array $overrides = array() ): InvoiceModel {
		$contact_id = $this->make_contact();
		$defaults   = array(
			'contact_id'     => $contact_id,
			'status'         => InvoiceStatus::DRAFT,
			'currency'       => 'USD',
			'discount_type'  => 'none',
			'discount_value' => 0,
			'line_items'     => array(
				array(
					'qty'    => 1,
					'rate'   => 100,
					'amount' => 100,
				),
			),
			'invoice_date'   => current_time( 'Y-m-d' ),
			'due_date'       => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
		);

		$invoice = new InvoiceModel();
		$invoice->fill( array_merge( $defaults, $overrides ) );
		$invoice->save();

		return $invoice->fresh();
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
