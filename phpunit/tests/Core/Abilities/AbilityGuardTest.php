<?php
/**
 * The security-critical half of the abilities layer.
 *
 * Gate 1 is applied twice on purpose — once when collecting definitions and
 * again inside the composed permission callback. These tests pin the second
 * one, which is the half that survives a module being toggled off after the
 * ability registry was already built for the request.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityGuard;
use DoubleScale\Core\ModuleRequestCache;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

// Supplies WP_Error + is_wp_error(), which the composed permission callback
// and the execute wrapper both return through.
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class AbilityGuardTest extends TestCase {

	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleRequestCache.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';
	}

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options'] = array();
		ModuleRequestCache::flush();
		$this->configure_ai_access();
	}

	/**
	 * The composed callback checks Permissions::has_ai_access() first, which
	 * requires a configured provider and an allowed role. These tests are
	 * about the module and capability gates, so satisfy the AI gate up front
	 * and let each test exercise the gate it is actually pinning.
	 */
	private function configure_ai_access(): void {
		$GLOBALS['__doublescale_phpunit_current_user_id'] = 1;
		$GLOBALS['__doublescale_phpunit_users']           = array(
			1 => array( 'roles' => array( 'administrator' ) ),
		);

		$GLOBALS['__doublescale_phpunit_options']['doublescale_settings'] = array(
			'ai' => array(
				'provider' => 'openai',
				'access'   => array(
					'enabled'       => true,
					'allowed_roles' => array( 'administrator' ),
				),
			),
		);
	}

	protected function tearDown(): void {
		$GLOBALS['__doublescale_phpunit_options']         = array();
		$GLOBALS['__doublescale_phpunit_users']           = array();
		$GLOBALS['__doublescale_phpunit_current_user_id'] = 0;
		ModuleRequestCache::flush();
		parent::tearDown();
	}

	/**
	 * @param array<string, mixed> $stored Module toggle state.
	 */
	private function set_stored_modules( array $stored ): void {
		$GLOBALS['__doublescale_phpunit_options']['doublescale_enabled_modules'] = $stored;
		ModuleRequestCache::flush();
	}

	public function test_module_active_reflects_stored_state(): void {
		$this->set_stored_modules( array( 'support' => true ) );
		$this->assertTrue( AbilityGuard::module_active( 'support' ) );

		$this->set_stored_modules( array( 'support' => false ) );
		$this->assertFalse( AbilityGuard::module_active( 'support' ) );
	}

	/**
	 * The scenario registration-time filtering alone cannot cover: the ability
	 * was registered while the module was on, the user then switched it off,
	 * and WP does not rebuild its registry mid-request. Without this check the
	 * stale ability stays callable — over REST as well.
	 */
	public function test_permission_denied_when_module_switched_off_after_registration(): void {
		$this->set_stored_modules( array( 'support' => true ) );
		$callback = AbilityGuard::compose_permission(
			'doublescale/list-tickets',
			'support',
			static function () {
				return true;
			}
		);

		$this->set_stored_modules( array( 'support' => false ) );

		$result = $callback();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'doublescale_module_inactive', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
		$this->assertSame( 'support', $result->get_error_data()['module'] );
		$this->assertStringContainsString( 'switched off', $result->get_error_message() );
		$this->assertStringContainsString( 'Helpdesk', $result->get_error_message() );
	}

	public function test_inactive_module_error_uses_supplied_label(): void {
		$error = AbilityGuard::inactive_module_error(
			'doublescale/list-tickets',
			'support',
			'Helpdesk'
		);

		$this->assertSame( 'doublescale_module_inactive', $error->get_error_code() );
		$this->assertStringContainsString( 'Helpdesk', $error->get_error_message() );
		$this->assertStringNotContainsString( '"support"', $error->get_error_message() );
	}

	public function test_permission_denied_when_module_capability_fails(): void {
		$this->set_stored_modules( array( 'support' => true ) );

		$callback = AbilityGuard::compose_permission(
			'doublescale/list-tickets',
			'support',
			static function () {
				return false;
			}
		);

		$result = $callback();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'doublescale_forbidden', $result->get_error_code() );
	}

	public function test_permission_granted_when_module_on_and_capability_passes(): void {
		$this->set_stored_modules( array( 'support' => true ) );

		$callback = AbilityGuard::compose_permission(
			'doublescale/list-tickets',
			'support',
			static function () {
				return true;
			}
		);

		$this->assertTrue( $callback() );
	}

	/**
	 * An unconfigured AI provider must NOT close the abilities layer.
	 *
	 * This assertion used to be the opposite, and that was the bug: nothing in
	 * the abilities layer calls an AI provider — an external agent connects in
	 * and reads CRM data — so demanding an OpenAI key first published zero
	 * tools on sites that never wanted the in-dashboard assistant. Every client
	 * reported that as a failed connection rather than an unconfigured one.
	 *
	 * The provider check still guards the outbound features, which do call a
	 * provider; see Permissions::has_ai_access().
	 */
	public function test_missing_ai_provider_does_not_block_abilities(): void {
		$this->set_stored_modules( array( 'support' => true ) );
		unset( $GLOBALS['__doublescale_phpunit_options']['doublescale_settings'] );

		$callback = AbilityGuard::compose_permission(
			'doublescale/list-tickets',
			'support',
			static function () {
				return true;
			}
		);

		$this->assertTrue(
			$callback(),
			'An unconfigured AI provider must not close the abilities layer.'
		);
	}

	public function test_wrap_execute_passes_through_a_successful_result(): void {
		$wrapped = AbilityGuard::wrap_execute(
			'doublescale/list-tickets',
			static function ( $input ) {
				return array( 'ok' => true, 'got' => $input );
			}
		);

		$result = $wrapped( array( 'limit' => 5 ) );

		$this->assertTrue( $result['ok'] );
		$this->assertSame( array( 'limit' => 5 ), $result['got'] );
	}

	/**
	 * Two failures are prevented here. An agent given an ambiguous response
	 * retries tools that already succeeded; and raw exception text leaks table
	 * names, query fragments, and filesystem paths to whoever called the tool.
	 */
	public function test_wrap_execute_converts_exception_without_leaking_detail(): void {
		$secret  = 'SELECT * FROM wp_doublescale_sales_invoices WHERE secret_token = "abc123"';
		$wrapped = AbilityGuard::wrap_execute(
			'doublescale/list-invoices',
			static function () use ( $secret ) {
				throw new \RuntimeException( $secret );
			}
		);

		$result = $wrapped( array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'doublescale_ability_failed', $result->get_error_code() );

		$message = $result->get_error_message();
		$this->assertStringNotContainsString( $secret, $message );
		$this->assertStringNotContainsString( 'wp_doublescale_sales_invoices', $message );
		$this->assertStringNotContainsString( 'RuntimeException', $message );
		$this->assertStringNotContainsString( __FILE__, $message );

		$data = $result->get_error_data();
		$this->assertSame( 500, $data['status'] );
		$this->assertSame( 'doublescale/list-invoices', $data['ability'] );
		$this->assertMatchesRegularExpression( '/^[a-f0-9]{12}$/', $data['error_id'] );
	}

	/**
	 * A PHP Error (not just Exception) must be caught too — a type error in a
	 * shaper would otherwise fatal the whole REST request.
	 */
	public function test_wrap_execute_catches_php_errors(): void {
		$wrapped = AbilityGuard::wrap_execute(
			'doublescale/get-invoice',
			static function () {
				throw new \TypeError( 'bad type' );
			}
		);

		$this->assertInstanceOf( \WP_Error::class, $wrapped( array() ) );
	}

	public function test_wrap_execute_normalises_non_array_input(): void {
		$wrapped = AbilityGuard::wrap_execute(
			'doublescale/get-context',
			static function ( $input ) {
				return $input;
			}
		);

		$this->assertSame( array(), $wrapped( null ) );
		$this->assertSame( array(), $wrapped( 'not-an-array' ) );
	}
}
