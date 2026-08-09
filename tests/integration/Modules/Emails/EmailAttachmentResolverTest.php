<?php
/**
 * Email attachment resolver integration tests.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration\Modules\Emails;

use DoubleScale\Modules\Campaigns\Services\TemplateDataPreparer;
use DoubleScale\Modules\Emails\EmailAttachmentResolver;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group emails
 * @group attachments
 */
final class EmailAttachmentResolverTest extends IntegrationTestCase {

	public function test_sanitize_attachments_accepts_valid_media_file(): void {
		$upload = wp_upload_bits(
			'lead-magnet.pdf',
			null,
			'%PDF-1.4 test content'
		);

		$this->assertFalse( $upload['error'] );

		$attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => 'application/pdf',
				'post_title'     => 'lead-magnet',
				'post_content'   => '',
				'post_status'    => 'inherit',
			),
			$upload['file']
		);

		$this->assertGreaterThan( 0, $attachment_id );

		$sanitized = EmailAttachmentResolver::sanitize_attachments(
			array(
				array(
					'id'       => $attachment_id,
					'filename' => 'lead-magnet.pdf',
					'mime'     => 'application/pdf',
					'size'     => 18,
				),
			)
		);

		$this->assertCount( 1, $sanitized );
		$this->assertSame( $attachment_id, $sanitized[0]['id'] );

		$paths = EmailAttachmentResolver::resolve_paths( $sanitized );
		$this->assertCount( 1, $paths );
		$this->assertFileExists( $paths[0] );
	}

	public function test_extract_from_builder_body_reads_nested_attachments(): void {
		$upload = wp_upload_bits(
			'guide.pdf',
			null,
			'%PDF-1.4 guide'
		);
		$attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => 'application/pdf',
				'post_title'     => 'guide',
				'post_status'    => 'inherit',
			),
			$upload['file']
		);

		$body = wp_json_encode(
			array(
				'type'  => 'builder',
				'value' => array(
					'sections'    => array(),
					'attachments' => array(
						array(
							'id'       => $attachment_id,
							'filename' => 'guide.pdf',
							'mime'     => 'application/pdf',
							'size'     => 12,
						),
					),
				),
			)
		);

		$extracted = EmailAttachmentResolver::extract_from_builder_body( $body );

		$this->assertCount( 1, $extracted );
		$this->assertSame( $attachment_id, $extracted[0]['id'] );
	}

	public function test_template_data_preparer_copies_attachments_from_settings(): void {
		$upload = wp_upload_bits(
			'ebook.pdf',
			null,
			'%PDF-1.4 ebook'
		);
		$attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => 'application/pdf',
				'post_title'     => 'ebook',
				'post_status'    => 'inherit',
			),
			$upload['file']
		);

		$data = TemplateDataPreparer::prepare_email_template_data(
			'Lead magnet',
			'{"type":"builder","value":{"sections":[]}}',
			array(
				'attachments' => array(
					array(
						'id'       => $attachment_id,
						'filename' => 'ebook.pdf',
						'mime'     => 'application/pdf',
						'size'     => 2048,
					),
				),
			)
		);

		$this->assertArrayHasKey( 'attachments', $data['settings'] );
		$this->assertCount( 1, $data['settings']['attachments'] );
	}

	public function test_allowed_mimes_includes_pdf(): void {
		$this->assertContains(
			'application/pdf',
			EmailAttachmentResolver::allowed_mimes()
		);
	}
}
