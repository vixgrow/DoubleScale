<?php
/**
 * Regression: resolve_imap_provider_for_email() must not fatal when Pro is absent.
 *
 * The Support module reaches RestSettingsControllerPro::resolve_imap_provider_for_email()
 * from a free-only path (RestMailboxController -> Smtp\Settings::get_connections_for_support()
 * -> is_from_email_receivable()). That method's first two steps read smtp's OAuth account
 * store via the Pro class DoubleScale\Pro\Modules\Inbox\Oauth\EmailOauth. When Pro is
 * disabled that class does not exist, so the unguarded EmailOauth::mailer_settings_option_name()
 * call threw a fatal "Class ... EmailOauth not found". This test pins the guard that lets the
 * method fall through to the standalone-OAuth path (step 3) and return the 'custom' fallback.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Settings;

use DoubleScale\Core\Settings\Rest\RestSettingsControllerPro;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class ResolveImapProviderWithoutProTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options']     = array();
		$GLOBALS['__doublescale_phpunit_filters']     = array();
		$GLOBALS['__doublescale_phpunit_hooks']       = array();
		$GLOBALS['__doublescale_phpunit_transients']  = array();
	}

	/**
	 * Guard precondition: the Pro OAuth class genuinely is not loaded in the test
	 * process, so this exercises the real "Pro disabled" code path (no mocking).
	 */
	public function test_pro_email_oauth_class_is_absent_in_test_runtime(): void {
		$this->assertFalse(
			class_exists( 'DoubleScale\\Pro\\Modules\\Inbox\\Oauth\\EmailOauth' ),
			'Test runtime must not have Pro EmailOauth loaded, otherwise this regression is not exercised.'
		);
	}

	/**
	 * The crash repro: with Pro absent, the call must return cleanly rather than fatal.
	 */
	public function test_returns_custom_fallback_when_pro_absent(): void {
		$resolved = RestSettingsControllerPro::resolve_imap_provider_for_email( 'agent@example.com' );

		$this->assertIsArray( $resolved );
		$this->assertSame( 'custom', $resolved['imap_provider'] );
		$this->assertSame( '', $resolved['smtp_gmail_account'] );
		$this->assertSame( '', $resolved['smtp_outlook_account'] );
	}

	/**
	 * Empty address short-circuits before any EmailOauth touch — still safe, still 'custom'.
	 */
	public function test_empty_email_returns_custom_fallback(): void {
		$resolved = RestSettingsControllerPro::resolve_imap_provider_for_email( '' );

		$this->assertIsArray( $resolved );
		$this->assertSame( 'custom', $resolved['imap_provider'] );
	}

	/**
	 * Step 3 (standalone OAuth, smtp not installed) stays reachable with Pro off:
	 * a matching email_inbound OAuth record still resolves to its provider.
	 */
	public function test_standalone_oauth_match_still_resolves_with_pro_absent(): void {
		update_option(
			'doublescale_settings',
			array(
				'email_inbound' => array(
					'oauth' => array(
						'gmail' => array(
							'access_token' => 'tok',
							'email'        => 'agent@example.com',
						),
					),
				),
			)
		);

		$resolved = RestSettingsControllerPro::resolve_imap_provider_for_email( 'AGENT@example.com' );

		$this->assertSame( 'gmail', $resolved['imap_provider'] );
	}

	/**
	 * The Support entry point that triggered the production fatal must also be safe:
	 * is_from_email_receivable() delegates into resolve_imap_provider_for_email().
	 */
	public function test_smtp_is_from_email_receivable_safe_when_pro_absent(): void {
		$this->assertFalse(
			\DoubleScale\Modules\Smtp\Settings::is_from_email_receivable( 'agent@example.com' )
		);
	}
}
