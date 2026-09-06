<?php
/**
 * Meta template header backfill tests.
 *
 * Bug #82 follow-on: templates cached before header support existed carry no
 * header_format/header_media. save_on_use() returns an existing row untouched,
 * so without a backfill those templates would keep sending body-only and keep
 * being rejected by Meta — re-syncing would never repair them.
 *
 * The backfill merge rule is asserted directly: the saver's own method needs a
 * live TemplateModel (and therefore a database), so this suite exercises the
 * decision logic against a stand-in with the same settings/save() surface.
 *
 * @package DoubleScale\Tests
 */

use PHPUnit\Framework\TestCase;

/**
 * Minimal stand-in for TemplateModel: the settings array plus a save() spy.
 */
class BackfillTemplateDouble {

	/**
	 * Template id.
	 *
	 * @var int
	 */
	public $id = 42;

	/**
	 * Stored settings.
	 *
	 * @var array
	 */
	public $settings = array();

	/**
	 * How many times save() was called.
	 *
	 * @var int
	 */
	public $save_count = 0;

	/**
	 * Record a save.
	 *
	 * @return void
	 */
	public function save() {
		++$this->save_count;
	}
}

/**
 * Covers the merge rule used to backfill header settings onto existing rows.
 */
class MetaTemplateHeaderBackfillTest extends TestCase {

	/**
	 * Apply the same merge rule MetaTemplateSaver::backfill_header_settings() uses.
	 *
	 * @param BackfillTemplateDouble $template Existing template row.
	 * @param array                  $settings Freshly normalized settings from Meta.
	 * @return BackfillTemplateDouble
	 */
	private function backfill( BackfillTemplateDouble $template, array $settings ): BackfillTemplateDouble {
		// Only templates that actually declare a header are worth repairing.
		if ( empty( $settings['header_format'] ) ) {
			return $template;
		}

		$header_keys = array( 'components', 'header_format', 'header_media' );
		$stored      = is_array( $template->settings ) ? $template->settings : array();
		$changed     = false;

		foreach ( $header_keys as $key ) {
			if ( empty( $settings[ $key ] ) || ! empty( $stored[ $key ] ) ) {
				continue;
			}

			$stored[ $key ] = $settings[ $key ];
			$changed        = true;
		}

		if ( ! $changed ) {
			return $template;
		}

		$template->settings = $stored;
		$template->save();

		return $template;
	}

	/**
	 * Freshly normalized settings for an image-header template.
	 *
	 * @return array
	 */
	private function fresh_settings(): array {
		return array(
			'provider'      => 'meta-whatsapp',
			'external_id'   => 'promo:en_US',
			'components'    => array(
				array(
					'type'   => 'HEADER',
					'format' => 'IMAGE',
				),
			),
			'header_format' => 'IMAGE',
			'header_media'  => array(
				'type' => 'image',
				'link' => 'https://example.test/approved-promo.jpg',
			),
		);
	}

	/**
	 * A row cached before header support gains the header keys and is persisted.
	 */
	public function test_legacy_row_gains_header_settings() {
		$template           = new BackfillTemplateDouble();
		$template->settings = array(
			'provider'    => 'meta-whatsapp',
			'external_id' => 'promo:en_US',
		);

		$this->backfill( $template, $this->fresh_settings() );

		$this->assertSame( 'IMAGE', $template->settings['header_format'] );
		$this->assertSame(
			'https://example.test/approved-promo.jpg',
			$template->settings['header_media']['link']
		);
		$this->assertSame( 1, $template->save_count, 'A repaired row must be persisted.' );
	}

	/**
	 * Media a user chose deliberately must not be replaced by Meta's sample.
	 */
	public function test_existing_media_is_not_overwritten() {
		$template           = new BackfillTemplateDouble();
		$template->settings = array(
			'external_id'   => 'promo:en_US',
			'header_format' => 'IMAGE',
			'header_media'  => array(
				'type' => 'image',
				'link' => 'https://example.test/chosen-by-user.jpg',
			),
		);

		$this->backfill( $template, $this->fresh_settings() );

		$this->assertSame(
			'https://example.test/chosen-by-user.jpg',
			$template->settings['header_media']['link'],
			'A deliberately chosen image must survive a re-sync.'
		);
	}

	/**
	 * A row that already has everything is left alone — no needless write.
	 */
	public function test_complete_row_is_not_written_again() {
		$template           = new BackfillTemplateDouble();
		$template->settings = $this->fresh_settings();

		$this->backfill( $template, $this->fresh_settings() );

		$this->assertSame( 0, $template->save_count, 'Nothing changed, so nothing should be written.' );
	}

	/**
	 * A body-only template gains nothing and is never written.
	 */
	public function test_body_only_template_is_untouched() {
		$template           = new BackfillTemplateDouble();
		$template->settings = array(
			'provider'    => 'meta-whatsapp',
			'external_id' => 'welcome:en_US',
		);

		$this->backfill(
			$template,
			array(
				'provider'   => 'meta-whatsapp',
				'components' => array(
					array(
						'type' => 'BODY',
						'text' => 'Hi {{1}}',
					),
				),
			)
		);

		$this->assertArrayNotHasKey( 'header_format', $template->settings );
		$this->assertArrayNotHasKey( 'header_media', $template->settings );
		$this->assertSame( 0, $template->save_count );
	}
}
