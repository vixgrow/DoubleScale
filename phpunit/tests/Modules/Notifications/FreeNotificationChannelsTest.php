<?php
/**
 * Free Notifications engine: email is the only channel out of the box, and the
 * Pro channels (bell/browser/push) light up only when something hooks the
 * `doublescale_notification_allowed_channels` filter (as Pro does).
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Notifications;

use DoubleScale\Modules\Notifications\Module;
use DoubleScale\Modules\Notifications\Services\NotificationChannels;
use DoubleScale\Modules\Notifications\Services\NotificationPreferences;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class FreeNotificationChannelsTest extends TestCase {

	/**
	 * Remove any allowed-channels filters a prior test (or Pro shim) registered
	 * so each case starts from the free default.
	 */
	protected function setUp(): void {
		parent::setUp();
		unset( $GLOBALS['__doublescale_phpunit_filters']['doublescale_notification_allowed_channels'] );
	}

	protected function tearDown(): void {
		unset( $GLOBALS['__doublescale_phpunit_filters']['doublescale_notification_allowed_channels'] );
		parent::tearDown();
	}

	public function test_allowed_channels_default_to_email_only(): void {
		$this->assertSame(
			array( 'email' ),
			NotificationChannels::allowed(),
			'Free installs must expose only the email channel.'
		);
		$this->assertTrue( NotificationChannels::is_allowed( 'email' ) );
		$this->assertFalse( NotificationChannels::is_allowed( 'bell' ) );
		$this->assertFalse( NotificationChannels::is_allowed( 'browser' ) );
		$this->assertFalse( NotificationChannels::is_allowed( 'push' ) );
	}

	public function test_pro_filter_unlocks_all_channels(): void {
		add_filter(
			'doublescale_notification_allowed_channels',
			static function () {
				return NotificationChannels::ALL;
			}
		);

		$this->assertSame(
			array( 'bell', 'email', 'browser', 'push' ),
			NotificationChannels::allowed(),
			'When Pro hooks the filter, every channel becomes available.'
		);
	}

	public function test_email_is_forced_back_even_if_a_filter_drops_it(): void {
		add_filter(
			'doublescale_notification_allowed_channels',
			static function () {
				return array( 'bell' );
			}
		);

		$allowed = NotificationChannels::allowed();
		$this->assertContains( 'email', $allowed, 'Email must never be removable.' );
	}

	public function test_defaults_expose_only_email_on_free_and_email_is_on(): void {
		$defaults = NotificationPreferences::get_defaults();

		$this->assertSame(
			array( 'email' ),
			array_keys( $defaults['channels'] ),
			'Free defaults must only carry the email channel key.'
		);
		$this->assertTrue(
			$defaults['channels']['email'],
			'Email is the headline free channel and defaults on.'
		);

		// Every subcategory row is likewise reduced to the email key only.
		foreach ( $defaults['subcategories'] as $subcat => $channels ) {
			$this->assertSame(
				array( 'email' ),
				array_keys( $channels ),
				"Subcategory {$subcat} should only expose the email channel on free."
			);
		}
	}

	public function test_defaults_expose_all_channels_when_pro_filter_present(): void {
		add_filter(
			'doublescale_notification_allowed_channels',
			static function () {
				return NotificationChannels::ALL;
			}
		);

		$defaults = NotificationPreferences::get_defaults();
		$keys     = array_keys( $defaults['channels'] );

		$this->assertContains( 'bell', $keys );
		$this->assertContains( 'email', $keys );
		$this->assertContains( 'browser', $keys );
		$this->assertContains( 'push', $keys );
	}

	public function test_is_enabled_is_false_for_disallowed_channel(): void {
		// is_enabled() gates on channel availability first, so a disallowed
		// channel short-circuits to false before any stored pref is read.
		$this->assertFalse(
			NotificationPreferences::is_enabled( 1, 'system_error', 'bell' ),
			'A disallowed channel is never "enabled" on free.'
		);
	}

	public function test_module_metadata(): void {
		$module = new Module();
		$this->assertSame( 'notifications', $module->slug() );
		$this->assertFalse( $module->is_toggleable(), 'Notifications is foundational and not toggleable.' );
		$this->assertContains(
			'DoubleScale\\Modules\\Notifications\\Rest\\Controllers\\RestNotificationsController',
			$module->restControllers()
		);
		$this->assertContains(
			'DoubleScale\\Modules\\Notifications\\Rest\\Controllers\\RestNotificationPreferencesController',
			$module->restControllers()
		);
	}
}
