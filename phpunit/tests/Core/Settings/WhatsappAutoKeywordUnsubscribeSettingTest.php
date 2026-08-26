<?php
/**
 * WhatsApp automatic keyword unsubscribe setting tests.
 *
 * @package DoubleScale\Tests\Core\Settings
 */

namespace DoubleScale\Tests\Core\Settings;

use DoubleScale\Core\Settings\Settings;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class WhatsappAutoKeywordUnsubscribeSettingTest extends TestCase {

	protected function tearDown(): void {
		Settings::delete_all();
		parent::tearDown();
	}

	public function test_defaults_to_enabled_when_setting_missing(): void {
		$this->assertTrue( Settings::is_whatsapp_auto_keyword_unsubscribe_enabled() );
	}

	public function test_respects_disabled_setting(): void {
		Settings::update_many(
			array(
				'whatsapp' => array(
					'auto_keyword_unsubscribe' => false,
				),
			)
		);

		$this->assertFalse( Settings::is_whatsapp_auto_keyword_unsubscribe_enabled() );
	}

	public function test_respects_enabled_setting(): void {
		Settings::update_many(
			array(
				'whatsapp' => array(
					'auto_keyword_unsubscribe' => true,
				),
			)
		);

		$this->assertTrue( Settings::is_whatsapp_auto_keyword_unsubscribe_enabled() );
	}
}
