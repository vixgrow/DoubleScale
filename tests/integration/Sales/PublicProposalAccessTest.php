<?php
/**
 * Guest proposal REST: view, accept, decline, PDF.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Documents\Constants\ProposalStatus;
use DoubleScale\Modules\Documents\Models\ProposalModel;
use DoubleScale\Modules\Sales\Services\SalesSettings;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class PublicProposalAccessTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Capabilities::ensure_capabilities_synced();
	}

	public function test_guest_can_view_sent_proposal_and_status_becomes_open(): void {
		$proposal = $this->make_proposal(
			array(
				'status'    => ProposalStatus::SENT,
				'open_till' => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
			)
		);

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/public/proposals/' . $proposal->hash
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( (string) $proposal->proposal_number, $data['proposal_number'] );
		$this->assertTrue( $data['can_accept'] );
		$this->assertTrue( $data['can_decline'] );
		$this->assertFalse( $data['is_expired'] );
		$this->assertArrayNotHasKey( 'signature', $data );

		$proposal->refresh();
		$this->assertSame( ProposalStatus::OPEN, (string) $proposal->status );
	}

	public function test_guest_can_accept_proposal_with_signature(): void {
		$settings = SalesSettings::get_all();
		$settings['require_signature_on_accept'] = true;
		SalesSettings::update( $settings );

		$proposal = $this->make_proposal(
			array(
				'status'    => ProposalStatus::SENT,
				'open_till' => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
			)
		);

		$signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/public/proposals/' . $proposal->hash . '/accept',
			array(
				'signed_name' => 'Jane Customer',
				'signature'   => $signature,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( ProposalStatus::ACCEPTED, $data['status'] );
		$this->assertSame( 'Jane Customer', $data['signed_name'] );
		$this->assertTrue( $data['has_signature'] );
		$this->assertArrayNotHasKey( 'signature', $data );

		$proposal->refresh();
		$this->assertSame( ProposalStatus::ACCEPTED, (string) $proposal->status );
		$this->assertSame( 'Jane Customer', (string) $proposal->signed_name );
	}

	public function test_guest_can_decline_proposal_with_reason(): void {
		$proposal = $this->make_proposal(
			array(
				'status'    => ProposalStatus::OPEN,
				'open_till' => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/public/proposals/' . $proposal->hash . '/decline',
			array(
				'reason' => 'Budget constraints',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( ProposalStatus::DECLINED, $data['status'] );
		$this->assertSame( 'Budget constraints', $data['decline_reason'] );
	}

	public function test_proposal_pdf_endpoint_streams_pdf_bytes(): void {
		if ( ! class_exists( 'DoubleScale\\Vendor\\Dompdf\\Dompdf' ) ) {
			$this->markTestSkipped( 'Scoped Dompdf is not built. Run: cd dependencies && composer install && cd .. && composer scope:vendor' );
		}

		$proposal = $this->make_proposal(
			array(
				'status' => ProposalStatus::OPEN,
			)
		);

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/public/proposals/' . $proposal->hash . '/pdf'
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringStartsWith( '%PDF', (string) $response->get_data() );
		$headers = $response->get_headers();
		$this->assertStringContainsString( 'application/pdf', (string) ( $headers['content-type'] ?? '' ) );
	}

	public function test_bad_hash_returns_404(): void {
		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/public/proposals/' . str_repeat( '0', 32 )
		);

		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * @param array<string, mixed> $overrides Proposal attributes.
	 * @return ProposalModel
	 */
	private function make_proposal( array $overrides = array() ): ProposalModel {
		$contact_id = $this->make_contact();
		$defaults   = array(
			'contact_id'     => $contact_id,
			'subject'        => 'Integration test proposal',
			'status'         => ProposalStatus::DRAFT,
			'currency'       => 'USD',
			'discount_type'  => 'none',
			'discount_value' => 0,
			'line_items'     => array(
				array(
					'description' => 'Service',
					'qty'         => 1,
					'rate'        => 100,
					'amount'      => 100,
				),
			),
			'date'           => current_time( 'Y-m-d' ),
			'open_till'      => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
			'to_name'        => 'Jane Customer',
			'email'          => 'jane@example.com',
		);

		$proposal = new ProposalModel();
		$proposal->fill( array_merge( $defaults, $overrides ) );
		$proposal->save();

		return $proposal->fresh();
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
