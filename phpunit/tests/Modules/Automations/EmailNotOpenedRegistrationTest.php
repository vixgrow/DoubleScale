<?php
/**
 * Email Not Opened free stub is glob-loaded and listed in the Pro catalog.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class EmailNotOpenedRegistrationTest extends TestCase {

	public function test_stub_exists_and_is_glob_loaded(): void {
		$stub = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Triggers/EmailNotOpened.php';
		$this->assertFileExists( $stub );

		$contents = (string) file_get_contents( $stub );
		$this->assertStringContainsString( 'extends TriggerPro', $contents );
		$this->assertStringContainsString( "public \$slug = 'email_not_opened'", $contents );
		$this->assertStringContainsString( 'TriggersManager::instance()->register(', $contents );

		$module = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Module.php'
		);
		$this->assertStringContainsString( 'includes/Modules/Automations/Triggers/*.php', $module );
	}

	public function test_catalog_lists_the_pro_class(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Config/ProAutomationCatalog.php'
		);
		$this->assertStringContainsString( 'Triggers\\EmailNotOpened::class', $contents );
	}
}
