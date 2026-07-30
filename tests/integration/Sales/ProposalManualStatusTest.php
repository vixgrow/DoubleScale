<?php
/**
 * Admin-driven proposal status changes.
 *
 * Covers the "closed over the phone/WhatsApp" case: the customer never clicks
 * Accept on the public link, so a rep marks the proposal accepted from the
 * dashboard. That must behave like a real acceptance, including the automatic
 * draft invoice.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Documents\Constants\ProposalStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\ProposalModel;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class ProposalManualStatusTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Capabilities::ensure_capabilities_synced();
	}

	private function status_route( int $proposal_id ): string {
		return '/doublescale/v1/sales/proposals/' . $proposal_id . '/status';
	}

	public function test_admin_can_mark_a_sent_proposal_accepted(): void {
		$admin    = $this->make_admin_user();
		$proposal = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );

		$response = $this->dispatch_rest(
			'POST',
			$this->status_route( (int) $proposal->id ),
			array( 'status' => ProposalStatus::ACCEPTED ),
			$admin
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( ProposalStatus::ACCEPTED, $response->get_data()['status'] );

		$proposal->refresh();
		$this->assertSame( ProposalStatus::ACCEPTED, (string) $proposal->status );
		$this->assertNotEmpty( $proposal->accepted_at );
	}

	/**
	 * The whole point of routing this through a dedicated endpoint rather than a
	 * plain update: accepting fires the lifecycle action that auto-creates the
	 * draft invoice.
	 */
	public function test_manual_accept_auto_creates_the_draft_invoice(): void {
		$admin    = $this->make_admin_user();
		$proposal = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );

		$this->assertNull(
			InvoiceModel::query()->where( 'proposal_id', (int) $proposal->id )->first()
		);

		$this->dispatch_rest(
			'POST',
			$this->status_route( (int) $proposal->id ),
			array( 'status' => ProposalStatus::ACCEPTED ),
			$admin
		);

		$invoice = InvoiceModel::query()->where( 'proposal_id', (int) $proposal->id )->first();
		$this->assertNotNull( $invoice );
		$this->assertSame( (float) $proposal->total, (float) $invoice->total );
	}

	public function test_accepting_an_already_accepted_proposal_does_not_duplicate_the_invoice(): void {
		$admin    = $this->make_admin_user();
		$proposal = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );

		for ( $i = 0; $i < 2; $i++ ) {
			$this->dispatch_rest(
				'POST',
				$this->status_route( (int) $proposal->id ),
				array( 'status' => ProposalStatus::ACCEPTED ),
				$admin
			);
		}

		$count = InvoiceModel::query()->where( 'proposal_id', (int) $proposal->id )->count();
		$this->assertSame( 1, (int) $count );
	}

	public function test_manual_decline_stores_the_reason(): void {
		$admin    = $this->make_admin_user();
		$proposal = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );

		$response = $this->dispatch_rest(
			'POST',
			$this->status_route( (int) $proposal->id ),
			array(
				'status'         => ProposalStatus::DECLINED,
				'decline_reason' => 'Budget moved to next quarter.',
			),
			$admin
		);

		$this->assertSame( 200, $response->get_status() );

		$proposal->refresh();
		$this->assertSame( ProposalStatus::DECLINED, (string) $proposal->status );
		$this->assertNotEmpty( $proposal->declined_at );
		$this->assertSame( 'Budget moved to next quarter.', (string) $proposal->decline_reason );
	}

	public function test_status_change_is_logged_against_the_acting_user(): void {
		$admin    = $this->make_admin_user();
		$proposal = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );

		$this->dispatch_rest(
			'POST',
			$this->status_route( (int) $proposal->id ),
			array( 'status' => ProposalStatus::ACCEPTED ),
			$admin
		);

		// `contact_id` is virtual input on ActivityModel (stored as an association
		// row), so filter on the payload rather than a column.
		$activity = ActivityModel::query()
			->orderByDesc( 'id' )
			->get()
			->first(
				static function ( $row ) use ( $proposal ) {
					$data = is_array( $row->data ) ? $row->data : array();
					return isset( $data['proposal_id'], $data['manual'] )
						&& (int) $data['proposal_id'] === (int) $proposal->id;
				}
			);

		$this->assertNotNull( $activity, 'Expected a manual status-change activity.' );
		$this->assertSame( $admin, (int) $activity->user_id );
	}

	public function test_invalid_status_is_rejected(): void {
		$admin    = $this->make_admin_user();
		$proposal = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );

		$response = $this->dispatch_rest(
			'POST',
			$this->status_route( (int) $proposal->id ),
			array( 'status' => 'totally-not-a-status' ),
			$admin
		);

		$this->assertSame( 400, $response->get_status() );

		$proposal->refresh();
		$this->assertSame( ProposalStatus::SENT, (string) $proposal->status );
	}

	public function test_unknown_proposal_returns_404(): void {
		$admin = $this->make_admin_user();

		$response = $this->dispatch_rest(
			'POST',
			$this->status_route( 999999 ),
			array( 'status' => ProposalStatus::ACCEPTED ),
			$admin
		);

		$this->assertSame( 404, $response->get_status() );
	}

	public function test_guests_cannot_change_status(): void {
		$proposal = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );

		$response = $this->dispatch_rest(
			'POST',
			$this->status_route( (int) $proposal->id ),
			array( 'status' => ProposalStatus::ACCEPTED )
		);

		$this->assertContains( $response->get_status(), array( 401, 403 ) );

		$proposal->refresh();
		$this->assertSame( ProposalStatus::SENT, (string) $proposal->status );
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
