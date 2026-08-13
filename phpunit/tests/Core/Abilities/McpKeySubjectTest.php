<?php
/**
 * Who an administrator may mint an MCP API key for.
 *
 * A key carries its subject's permissions for as long as it exists, so the
 * subject choice IS the security boundary — the ability gates downstream can
 * only enforce whatever identity this class hands them.
 *
 * Two refusals are pinned here because both protect something the gates cannot:
 * an administrator subject would be permanent full access with no login record,
 * and a roleless subject would authenticate into zero tools, which reads as a
 * broken integration rather than a denied one.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\Mcp\KeySubject;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class McpKeySubjectTest extends TestCase {

	private const ADMIN      = 1;
	private const OTHER_ADMIN = 2;
	private const SALES_REP  = 3;
	private const SUBSCRIBER = 4;
	private const UNKNOWN    = 999;

	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Abilities/Mcp/KeySubject.php';
	}

	protected function setUp(): void {
		parent::setUp();

		$GLOBALS['__doublescale_phpunit_current_user_id'] = self::ADMIN;

		$GLOBALS['__doublescale_phpunit_users'] = array(
			self::ADMIN       => array( 'roles' => array( 'administrator' ) ),
			self::OTHER_ADMIN => array( 'roles' => array( 'administrator' ) ),
			self::SALES_REP   => array( 'roles' => array( 'doublescale_sales_rep' ) ),
			self::SUBSCRIBER  => array( 'roles' => array( 'subscriber' ) ),
		);

		$GLOBALS['__doublescale_phpunit_user_caps'] = array(
			self::ADMIN       => array( 'manage_options' => true ),
			self::OTHER_ADMIN => array( 'manage_options' => true ),
			self::SALES_REP   => array(),
			self::SUBSCRIBER  => array(),
		);
	}

	protected function tearDown(): void {
		unset(
			$GLOBALS['__doublescale_phpunit_current_user_id'],
			$GLOBALS['__doublescale_phpunit_users'],
			$GLOBALS['__doublescale_phpunit_user_caps']
		);

		parent::tearDown();
	}

	/**
	 * The common case must keep working exactly as before this feature existed.
	 */
	public function test_administrator_may_issue_a_key_for_themselves(): void {
		$this->assertSame( self::ADMIN, KeySubject::validate( self::ADMIN ) );
	}

	/**
	 * The whole point: a key bound to the teammate who will use it, so owner
	 * scoping still applies to them rather than to the administrator.
	 */
	public function test_administrator_may_issue_a_key_for_a_crm_user(): void {
		$this->assertSame( self::SALES_REP, KeySubject::validate( self::SALES_REP ) );
	}

	/**
	 * Permanent full access that survives the target's removal and never shows
	 * up in a login log. They can create their own from the same screen.
	 */
	public function test_another_administrator_is_refused(): void {
		$result = KeySubject::validate( self::OTHER_ADMIN );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_mcp_admin_subject', $result->get_error_code() );
	}

	/**
	 * A key that authenticates and then exposes nothing is a support ticket,
	 * not a feature — refuse it with a reason instead.
	 */
	public function test_user_without_a_doublescale_role_is_refused(): void {
		$result = KeySubject::validate( self::SUBSCRIBER );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_mcp_no_crm_access', $result->get_error_code() );
	}

	/**
	 * @dataProvider invalid_id_provider
	 *
	 * @param int $user_id Requested subject.
	 */
	public function test_unknown_user_is_refused( int $user_id ): void {
		$result = KeySubject::validate( $user_id );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_mcp_unknown_user', $result->get_error_code() );
	}

	/**
	 * @return array<string, array{0: int}>
	 */
	public function invalid_id_provider(): array {
		return array(
			'nonexistent' => array( self::UNKNOWN ),
			'zero'        => array( 0 ),
			'negative'    => array( -1 ),
		);
	}

	/**
	 * A non-administrator who somehow reaches this code may still only act for
	 * themselves — the check must not rely on the settings screen being hidden.
	 */
	public function test_non_administrator_cannot_issue_for_someone_else(): void {
		$GLOBALS['__doublescale_phpunit_current_user_id'] = self::SALES_REP;

		$result = KeySubject::validate( self::SUBSCRIBER );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_mcp_forbidden_subject', $result->get_error_code() );
	}

	/**
	 * ...but issuing for themselves stays allowed, so the rule narrows who a
	 * key may point at without taking away self-service.
	 */
	public function test_non_administrator_may_still_issue_for_themselves(): void {
		$GLOBALS['__doublescale_phpunit_current_user_id'] = self::SALES_REP;

		$this->assertSame( self::SALES_REP, KeySubject::validate( self::SALES_REP ) );
	}

	/**
	 * Nobody may be offered as a subject to a caller who cannot manage MCP.
	 */
	public function test_eligible_list_is_empty_for_non_administrators(): void {
		$GLOBALS['__doublescale_phpunit_current_user_id'] = self::SALES_REP;

		$this->assertSame( array(), KeySubject::eligible() );
	}
}
