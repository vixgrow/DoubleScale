<?php
/**
 * Declared automation sources must ship real primitives.
 *
 * A source declared in set_sources() but never implemented renders as a
 * permanently empty card in the builder — this is the guard against that.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class EmptyActionSourceTest extends TestCase {

	private function actions_manager_source(): string {
		return (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/ActionsManager.php'
		);
	}

	private function module_source(): string {
		return (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Module.php'
		);
	}

	/**
	 * Presto Player contributes triggers only. An action source for it would be
	 * permanently empty, since no action classes exist in either plugin.
	 */
	public function test_no_video_action_source_is_declared(): void {
		$contents = $this->actions_manager_source();

		$this->assertStringNotContainsString(
			"'video'       => array(",
			$contents,
			'ActionsManager must not declare a video/Presto Player action source.'
		);
		$this->assertStringNotContainsString(
			'PRESTO_PLAYER_PLUGIN_FILE',
			$contents,
			'Presto Player is a trigger-only integration; ActionsManager should not reference it.'
		);
	}

	/**
	 * The trigger side is real and must keep working.
	 */
	public function test_presto_player_trigger_source_is_still_declared(): void {
		$contents = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/TriggersManager.php'
		);

		$this->assertStringContainsString( 'PRESTO_PLAYER_PLUGIN_FILE', $contents );
		$this->assertStringContainsString( "'prestoplayer'", $contents );

		foreach ( array( 'VideoWatched', 'VideoCompleted' ) as $class ) {
			$this->assertFileExists(
				DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Triggers/Prestoplayer/' . $class . '.php',
				"Presto Player trigger {$class} must still ship."
			);
		}
	}

	public function test_module_does_not_glob_a_nonexistent_action_directory(): void {
		$this->assertStringNotContainsString(
			'Actions/Prestoplayer/*.php',
			$this->module_source(),
			'Dead glob: no Actions/Prestoplayer directory exists.'
		);
	}

	/**
	 * Every action directory the loader globs must actually exist, otherwise the
	 * source tree and the filesystem have drifted apart again.
	 */
	public function test_every_globbed_action_directory_exists_and_has_files(): void {
		preg_match_all(
			"#'(includes/Modules/Automations/Actions/[^']+)/\*\.php'#",
			$this->module_source(),
			$matches
		);

		$this->assertNotEmpty( $matches[1], 'Expected action globs in Module.php.' );

		foreach ( $matches[1] as $relative ) {
			$dir = DOUBLESCALE_PLUGIN_DIR . $relative;

			$this->assertDirectoryExists( $dir, "Globbed directory is missing: {$relative}" );
			$this->assertNotEmpty(
				glob( $dir . '/*.php' ) ?: array(),
				"Globbed directory has no action files: {$relative}"
			);
		}
	}

	/**
	 * Each action group declared in set_sources() must correspond to at least one
	 * shipped action class. Catches the next "declared but never built" category.
	 */
	public function test_declared_action_groups_have_implementations(): void {
		$contents = $this->actions_manager_source();

		// Group keys that map onto an Actions/<Dir> tree.
		$group_to_dir = array(
			'deal'         => 'Deal',
			'task'         => 'Task',
			'support'      => 'Support',
			'order'        => 'Woocommerce',
			'coupon'       => 'Woocommerce',
			'user'         => 'Wordpress',
			'learndash'    => 'Learndash',
			'tutorlms'     => 'Tutorlms',
			'lifterlms'    => 'Lifterlms',
			'learnpress'   => 'Learnpress',
			'memberpress'  => 'Memberpress',
			'pmpro'        => 'Pmpro',
			'email'        => 'Email',
			'sms'          => 'Messaging',
			'whatsapp'     => 'Messaging',
			'prestoplayer' => 'Prestoplayer',
		);

		foreach ( $group_to_dir as $group => $dir ) {
			if ( false === strpos( $contents, "'{$group}'" ) ) {
				continue; // Group not declared — nothing to check.
			}

			$free = glob( DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Actions/' . $dir . '/*.php' ) ?: array();

			$this->assertNotEmpty(
				$free,
				"Action group '{$group}' is declared in set_sources() but Actions/{$dir}/ ships no classes."
			);
		}
	}
}
