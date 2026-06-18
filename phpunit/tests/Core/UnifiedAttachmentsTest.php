<?php
/**
 * Unified attachment store — schema safety, signatures, and module adapters.
 *
 * @package DoubleScale\Tests\Core
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Database\Migrations\AttachmentsTable;
use DoubleScale\Core\Models\AttachmentModel;
use DoubleScale\Core\Services\AttachmentService;
use DoubleScale\Pro\Modules\Contracts\Models\ContractAttachmentModel;
use DoubleScale\Modules\Support\Models\AttachmentModel as SupportAttachmentModel;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class UnifiedAttachmentsTest extends TestCase {

	public function test_attachments_table_query_is_db_delta_safe(): void {
		$migration = new AttachmentsTable();
		$query     = $migration->get_query();

		$this->assertStringNotContainsString( 'COMMENT', $query );
		$this->assertStringNotContainsString( ';', $query );
		$this->assertStringContainsString( 'attachable_type', $query );
		$this->assertStringContainsString( 'idx_attachable', $query );
		$this->assertStringContainsString( 'idx_activity_status', $query );
	}

	public function test_signature_round_trip(): void {
		$service = new AttachmentService();
		$sign    = $service->generate_signature( 42 );

		$this->assertNotSame( '', $sign );
		$this->assertTrue( $service->verify_signature( 42, $sign ) );
		$this->assertFalse( $service->verify_signature( 42, 'tampered' ) );
		$this->assertFalse( $service->verify_signature( 99, $sign ) );
	}

	public function test_signed_url_uses_module_agnostic_query_args(): void {
		$attachment       = new AttachmentModel();
		$attachment->id   = 7;
		$attachment->file_hash = 'abc123hash';

		$url = ( new AttachmentService() )->signed_url( $attachment );

		$this->assertStringContainsString( 'ds_file=abc123hash', $url );
		$this->assertStringContainsString( 'ds_sign=', $url );
		$this->assertStringNotContainsString( 'ds_support_file', $url );
	}

	public function test_support_signed_url_keeps_legacy_query_args(): void {
		$attachment              = new SupportAttachmentModel();
		$attachment->id          = 3;
		$attachment->file_hash   = 'legacyhash99';
		$attachment->attachable_type = SupportAttachmentModel::ATTACHABLE_TYPE;
		$attachment->attachable_id   = 10;

		$url = ( new \DoubleScale\Modules\Support\Services\AttachmentService() )->signed_url( $attachment );

		$this->assertStringContainsString( 'ds_support_file=legacyhash99', $url );
		$this->assertStringContainsString( 'ds_support_sign=', $url );
	}

	public function test_module_attachable_type_constants(): void {
		if ( ! class_exists( ContractAttachmentModel::class ) ) {
			$this->markTestSkipped( 'Contracts module (Pro) is not loaded.' );
		}
		$this->assertSame( 'support_ticket', SupportAttachmentModel::ATTACHABLE_TYPE );
		$this->assertSame( 'sales_contract', ContractAttachmentModel::ATTACHABLE_TYPE );
	}

	public function test_support_ticket_id_accessor_maps_to_attachable_id(): void {
		$attachment = new SupportAttachmentModel();
		$attachment->ticket_id = 55;

		$this->assertSame( 'support_ticket', $attachment->attachable_type );
		$this->assertSame( 55, (int) $attachment->attachable_id );
		$this->assertSame( 55, (int) $attachment->ticket_id );
	}

	public function test_contract_id_accessor_maps_to_attachable_id(): void {
		if ( ! class_exists( ContractAttachmentModel::class ) ) {
			$this->markTestSkipped( 'Contracts module (Pro) is not loaded.' );
		}
		$attachment = new ContractAttachmentModel();
		$attachment->contract_id = 88;

		$this->assertSame( 'sales_contract', $attachment->attachable_type );
		$this->assertSame( 88, (int) $attachment->attachable_id );
		$this->assertSame( 88, (int) $attachment->contract_id );
	}

	public function test_contract_shape_for_api_returns_signed_url(): void {
		if ( ! class_exists( ContractAttachmentModel::class ) ) {
			$this->markTestSkipped( 'Contracts module (Pro) is not loaded.' );
		}
		$attachment            = new ContractAttachmentModel();
		$attachment->id        = 12;
		$attachment->file_hash = 'contractfile1';
		$attachment->file_name = 'nda.pdf';
		$attachment->file_size = 1024;
		$attachment->file_type = 'application/pdf';

		$shaped = ( new \DoubleScale\Pro\Modules\Contracts\Services\ContractAttachmentService() )->shape_for_api( $attachment );

		$this->assertArrayHasKey( 'url', $shaped );
		$this->assertStringContainsString( 'ds_file=contractfile1', (string) $shaped['url'] );
		$this->assertStringNotContainsString( '/wp-json/', (string) $shaped['url'] );
	}
}
