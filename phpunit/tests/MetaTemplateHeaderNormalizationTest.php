<?php
/**
 * Meta template header normalization tests.
 *
 * Bug #82: a template approved with an IMAGE/VIDEO/DOCUMENT header was stored
 * without any indication that it carries media, so the send path had nothing to
 * build a header component from and every media template was rejected by Meta.
 *
 * @package DoubleScale\Tests
 */

use PHPUnit\Framework\TestCase;
use DoubleScale\Modules\Campaigns\Services\MetaTemplateFetcher;

/**
 * Covers header format/media extraction in MetaTemplateFetcher::normalize_template().
 */
class MetaTemplateHeaderNormalizationTest extends TestCase {

	/**
	 * Normalize a raw Meta template payload.
	 *
	 * @param array $meta_template Raw template as Meta returns it.
	 * @return array Normalized template.
	 */
	private function normalize( array $meta_template ): array {
		$fetcher = new MetaTemplateFetcher();
		$method  = new ReflectionMethod( MetaTemplateFetcher::class, 'normalize_template' );
		$method->setAccessible( true );

		return $method->invoke( $fetcher, $meta_template );
	}

	/**
	 * Build a raw Meta template with the given components.
	 *
	 * @param array $components Component definitions.
	 * @return array Raw template payload.
	 */
	private function template( array $components ): array {
		return array(
			'name'       => 'promo',
			'language'   => 'en_US',
			'status'     => 'APPROVED',
			'category'   => 'MARKETING',
			'components' => $components,
		);
	}

	/**
	 * An IMAGE header is recorded as such, with Meta's approved sample as media.
	 */
	public function test_image_header_format_and_example_media_are_captured() {
		$normalized = $this->normalize(
			$this->template(
				array(
					array(
						'type'    => 'HEADER',
						'format'  => 'IMAGE',
						'example' => array(
							'header_handle' => array( 'https://example.test/approved-promo.jpg' ),
						),
					),
					array(
						'type' => 'BODY',
						'text' => 'Hi {{1}}',
					),
				)
			)
		);

		$this->assertSame( 'IMAGE', $normalized['settings']['header_format'] );
		$this->assertSame( 'image', $normalized['settings']['header_media']['type'] );
		$this->assertSame(
			'https://example.test/approved-promo.jpg',
			$normalized['settings']['header_media']['link']
		);
	}

	/**
	 * A DOCUMENT header derives a filename from the URL so WhatsApp shows a name.
	 */
	public function test_document_header_derives_filename_from_link() {
		$normalized = $this->normalize(
			$this->template(
				array(
					array(
						'type'    => 'HEADER',
						'format'  => 'DOCUMENT',
						'example' => array(
							'header_handle' => array( 'https://example.test/files/terms-2026.pdf' ),
						),
					),
				)
			)
		);

		$this->assertSame( 'document', $normalized['settings']['header_media']['type'] );
		$this->assertSame( 'terms-2026.pdf', $normalized['settings']['header_media']['filename'] );
	}

	/**
	 * A TEXT header records its format but has no media to attach.
	 */
	public function test_text_header_records_format_without_media() {
		$normalized = $this->normalize(
			$this->template(
				array(
					array(
						'type'   => 'HEADER',
						'format' => 'TEXT',
						'text'   => 'Order {{1}}',
					),
					array(
						'type' => 'BODY',
						'text' => 'Hi {{1}}',
					),
				)
			)
		);

		$this->assertSame( 'TEXT', $normalized['settings']['header_format'] );
		$this->assertArrayNotHasKey( 'header_media', $normalized['settings'] );
	}

	/**
	 * A media header with no approved example yields no media rather than a
	 * half-built descriptor carrying an empty link.
	 */
	public function test_media_header_without_example_yields_no_media() {
		$normalized = $this->normalize(
			$this->template(
				array(
					array(
						'type'   => 'HEADER',
						'format' => 'IMAGE',
					),
				)
			)
		);

		$this->assertSame( 'IMAGE', $normalized['settings']['header_format'] );
		$this->assertArrayNotHasKey( 'header_media', $normalized['settings'] );
	}

	/**
	 * Regression: a header-less template gains neither key, and the existing
	 * normalized shape is untouched.
	 */
	public function test_body_only_template_is_unchanged() {
		$normalized = $this->normalize(
			$this->template(
				array(
					array(
						'type' => 'BODY',
						'text' => 'Hi {{1}}, your order shipped.',
					),
				)
			)
		);

		$this->assertArrayNotHasKey( 'header_format', $normalized['settings'] );
		$this->assertArrayNotHasKey( 'header_media', $normalized['settings'] );

		$this->assertSame( 'promo:en_US', $normalized['sid'] );
		$this->assertSame( 'Hi {{1}}, your order shipped.', $normalized['body'] );
		$this->assertSame( 'meta-whatsapp', $normalized['settings']['provider'] );
		$this->assertSame( 'APPROVED', $normalized['settings']['status'] );
	}
}
