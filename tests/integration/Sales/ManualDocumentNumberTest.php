<?php
/**
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

/**
 * User-supplied proposal/invoice numbers via the REST API.
 */
final class ManualDocumentNumberTest extends IntegrationTestCase {

	/**
	 * @var int
	 */
	private $admin_id;

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_modules();
		$this->admin_id = $this->make_admin_user();
		do_action( 'rest_api_init' );
	}

	public function test_manual_proposal_number_is_persisted_verbatim(): void {
		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/proposals',
			$this->proposal_payload( array( 'proposal_number' => 'PROP-1542' ) ),
			$this->admin_id
		);

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'PROP-1542', $response->get_data()['proposal_number'] );
	}

	public function test_empty_proposal_number_falls_back_to_auto_numbering(): void {
		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/proposals',
			$this->proposal_payload( array( 'proposal_number' => '' ) ),
			$this->admin_id
		);

		$this->assertSame( 201, $response->get_status() );
		$this->assertMatchesRegularExpression(
			'/^PRO-\d{6}$/',
			(string) $response->get_data()['proposal_number']
		);
	}

	public function test_duplicate_proposal_number_is_rejected_with_400(): void {
		$first = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/proposals',
			$this->proposal_payload( array( 'proposal_number' => 'PROP-DUP' ) ),
			$this->admin_id
		);
		$this->assertSame( 201, $first->get_status() );

		$second = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/proposals',
			$this->proposal_payload( array( 'proposal_number' => 'PROP-DUP' ) ),
			$this->admin_id
		);

		$this->assertSame( 400, $second->get_status() );
		$this->assertSame( 'duplicate_number', $second->get_data()['code'] );
	}

	public function test_updating_proposal_keeps_its_own_number(): void {
		$created = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/proposals',
			$this->proposal_payload( array( 'proposal_number' => 'PROP-KEEP' ) ),
			$this->admin_id
		);
		$this->assertSame( 201, $created->get_status() );
		$id = (int) $created->get_data()['id'];

		// Re-sending the record's own number must not collide with itself.
		$updated = $this->dispatch_rest(
			'PUT',
			'/doublescale/v1/sales/proposals/' . $id,
			array(
				'subject'         => 'Renamed',
				'proposal_number' => 'PROP-KEEP',
			),
			$this->admin_id
		);

		$this->assertSame( 200, $updated->get_status() );
		$this->assertSame( 'PROP-KEEP', $updated->get_data()['proposal_number'] );
	}

	public function test_proposal_number_over_50_chars_is_rejected(): void {
		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/proposals',
			$this->proposal_payload( array( 'proposal_number' => str_repeat( 'A', 51 ) ) ),
			$this->admin_id
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_number', $response->get_data()['code'] );
	}

	public function test_manual_invoice_number_is_persisted_verbatim(): void {
		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices',
			array(
				'contact_id'     => $this->make_contact(),
				'invoice_number' => 'FAT-2026-0001',
				'currency'       => 'USD',
				'line_items'     => array( array( 'qty' => 1, 'rate' => 50 ) ),
			),
			$this->admin_id
		);

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'FAT-2026-0001', $response->get_data()['invoice_number'] );
	}

	public function test_duplicate_invoice_number_is_rejected_with_400(): void {
		$payload = array(
			'contact_id'     => $this->make_contact(),
			'invoice_number' => 'FAT-SAME',
			'currency'       => 'USD',
			'line_items'     => array( array( 'qty' => 1, 'rate' => 50 ) ),
		);

		$first = $this->dispatch_rest( 'POST', '/doublescale/v1/sales/invoices', $payload, $this->admin_id );
		$this->assertSame( 201, $first->get_status() );

		$second = $this->dispatch_rest( 'POST', '/doublescale/v1/sales/invoices', $payload, $this->admin_id );

		$this->assertSame( 400, $second->get_status() );
		$this->assertSame( 'duplicate_number', $second->get_data()['code'] );
	}

	/**
	 * @param array $overrides Fields to merge in.
	 * @return array
	 */
	private function proposal_payload( array $overrides = array() ): array {
		return array_merge(
			array(
				'contact_id' => $this->make_contact(),
				'subject'    => 'Orçamento',
				'currency'   => 'USD',
				'line_items' => array( array( 'qty' => 1, 'rate' => 100 ) ),
			),
			$overrides
		);
	}

	private function ensure_modules(): void {
		$modules = get_option( 'doublescale_enabled_modules', array() );
		foreach ( array( 'sales', 'documents' ) as $slug ) {
			if ( empty( $modules[ $slug ] ) ) {
				$modules[ $slug ] = true;
			}
		}
		update_option( 'doublescale_enabled_modules', $modules );

		ModuleManager::activateModule( 'sales' );
		ModuleManager::activateModule( 'documents' );
	}
}
