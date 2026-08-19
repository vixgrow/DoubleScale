<?php
/**
 * Self-service MCP keys must not become a way to see or revoke other people's.
 *
 * Opening key management to any DoubleScale role widened the route gate, and the
 * store's original read and delete were both site-wide. That combination is the
 * bug this pins: without owner scoping a sales rep could enumerate every key on
 * the site — the labels and usernames alone map out who holds agent access — and
 * revoke a colleague's key by id.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\Mcp\ApiKeyStore;
use DoubleScale\Core\UserRoles\Permissions;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class McpKeyOwnerScopeTest extends TestCase {

	private const ADMIN      = 1;
	private const SALES_REP  = 3;
	private const OTHER_REP  = 4;
	private const SUBSCRIBER = 5;

	protected function setUp(): void {
		parent::setUp();

		$GLOBALS['__doublescale_phpunit_options']         = array();
		$GLOBALS['__doublescale_phpunit_current_user_id'] = self::SALES_REP;

		$GLOBALS['__doublescale_phpunit_users'] = array(
			self::ADMIN      => array( 'roles' => array( 'administrator' ) ),
			self::SALES_REP  => array( 'roles' => array( 'doublescale_sales_rep' ) ),
			self::OTHER_REP  => array( 'roles' => array( 'doublescale_sales_rep' ) ),
			self::SUBSCRIBER => array( 'roles' => array( 'subscriber' ) ),
		);

		$GLOBALS['__doublescale_phpunit_user_caps'] = array(
			self::ADMIN      => array( 'manage_options' => true ),
			self::SALES_REP  => array(),
			self::OTHER_REP  => array(),
			self::SUBSCRIBER => array(),
		);
	}

	protected function tearDown(): void {
		unset(
			$GLOBALS['__doublescale_phpunit_current_user_id'],
			$GLOBALS['__doublescale_phpunit_users'],
			$GLOBALS['__doublescale_phpunit_user_caps']
		);
		$GLOBALS['__doublescale_phpunit_options'] = array();

		parent::tearDown();
	}

	/**
	 * A CRM user may mint their own key — the whole point of the change.
	 */
	public function test_crm_user_may_manage_their_own_key(): void {
		$this->assertTrue( Permissions::can_manage_own_mcp_key( self::SALES_REP ) );
	}

	/**
	 * An administrator keeps the wider permission too.
	 */
	public function test_administrator_may_manage_own_key(): void {
		$this->assertTrue( Permissions::can_manage_own_mcp_key( self::ADMIN ) );
	}

	/**
	 * A roleless user would authenticate into zero tools, so they are refused
	 * at the gate rather than handed a key that silently does nothing.
	 */
	public function test_user_without_a_doublescale_role_may_not(): void {
		$this->assertFalse( Permissions::can_manage_own_mcp_key( self::SUBSCRIBER ) );
	}

	/**
	 * The weaker key permission must NOT confer the admin surface — the
	 * endpoint toggle and the site-wide key list stay administrator-only.
	 */
	public function test_own_key_permission_is_not_the_admin_permission(): void {
		$this->assertTrue( Permissions::can_manage_own_mcp_key( self::SALES_REP ) );
		$this->assertFalse( Permissions::can_manage_mcp( self::SALES_REP ) );
	}

	/**
	 * A scoped listing shows the caller's keys and nobody else's.
	 */
	public function test_list_for_user_returns_only_that_users_keys(): void {
		ApiKeyStore::create( 'rep laptop', self::SALES_REP );
		ApiKeyStore::create( 'other rep laptop', self::OTHER_REP );
		ApiKeyStore::create( 'admin laptop', self::ADMIN );

		$mine = ApiKeyStore::list_for_user( self::SALES_REP );

		$this->assertCount( 1, $mine );
		$this->assertSame( self::SALES_REP, $mine[0]['user_id'] );
		$this->assertSame( 'rep laptop', $mine[0]['label'] );

		// The unscoped list still exists for administrators.
		$this->assertCount( 3, ApiKeyStore::list_for_display() );
	}

	/**
	 * Revoking your own key works.
	 */
	public function test_delete_own_removes_your_key(): void {
		$mine = ApiKeyStore::create( 'rep laptop', self::SALES_REP );

		$this->assertTrue( ApiKeyStore::delete_own( $mine['id'], self::SALES_REP ) );
		$this->assertSame( array(), ApiKeyStore::list_for_user( self::SALES_REP ) );
	}

	/**
	 * Revoking someone else's must fail AND leave it in place. A false return
	 * that had still deleted the row would be the worst of both.
	 */
	public function test_delete_own_refuses_another_users_key(): void {
		$theirs = ApiKeyStore::create( 'other rep laptop', self::OTHER_REP );

		$this->assertFalse( ApiKeyStore::delete_own( $theirs['id'], self::SALES_REP ) );

		// Still there, and still theirs.
		$still = ApiKeyStore::list_for_user( self::OTHER_REP );
		$this->assertCount( 1, $still );
		$this->assertSame( $theirs['id'], $still[0]['id'] );
	}

	/**
	 * A key that does not exist is refused the same way one owned by someone
	 * else is, so a failed revoke cannot be used to probe for real key ids.
	 */
	public function test_unknown_key_and_foreign_key_are_indistinguishable(): void {
		$theirs = ApiKeyStore::create( 'other rep laptop', self::OTHER_REP );

		$foreign = ApiKeyStore::delete_own( $theirs['id'], self::SALES_REP );
		$unknown = ApiKeyStore::delete_own( 'deadbeefdeadbeef', self::SALES_REP );

		$this->assertSame( $unknown, $foreign );
		$this->assertFalse( $foreign );
	}

	/**
	 * A zero/anonymous owner must never match a stored key.
	 */
	public function test_anonymous_owner_cannot_delete_anything(): void {
		$mine = ApiKeyStore::create( 'rep laptop', self::SALES_REP );

		$this->assertFalse( ApiKeyStore::delete_own( $mine['id'], 0 ) );
		$this->assertCount( 1, ApiKeyStore::list_for_user( self::SALES_REP ) );
	}
}
