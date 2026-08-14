<?php
/**
 * MCP API key issuance and verification.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\Mcp\ApiKeyStore;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class McpApiKeyStoreTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options'] = array();
		$GLOBALS['__doublescale_phpunit_users']   = array(
			5 => array( 'roles' => array( 'administrator' ) ),
		);
	}

	protected function tearDown(): void {
		$GLOBALS['__doublescale_phpunit_options'] = array();
		$GLOBALS['__doublescale_phpunit_users']   = array();
		parent::tearDown();
	}

	public function test_created_key_resolves_to_its_user(): void {
		$created = ApiKeyStore::create( 'laptop', 5 );

		$this->assertSame( 5, ApiKeyStore::resolve_user( $created['key'] ) );
	}

	public function test_key_carries_an_identifiable_prefix(): void {
		$created = ApiKeyStore::create( 'laptop', 5 );

		// Makes a leaked key greppable and recognisable to whoever finds it.
		$this->assertStringStartsWith( 'dsmcp_', $created['key'] );
		$this->assertGreaterThan( 40, strlen( $created['key'] ) );
	}

	/**
	 * Only a hash is persisted, so a database dump cannot be replayed against
	 * the endpoint.
	 */
	public function test_plaintext_key_is_never_stored(): void {
		$created = ApiKeyStore::create( 'laptop', 5 );

		$stored = wp_json_encode( get_option( ApiKeyStore::OPTION, array() ) );

		$this->assertStringNotContainsString( $created['key'], (string) $stored );
	}

	public function test_unknown_and_empty_keys_resolve_to_nobody(): void {
		ApiKeyStore::create( 'laptop', 5 );

		$this->assertSame( 0, ApiKeyStore::resolve_user( 'dsmcp_wrong' ) );
		$this->assertSame( 0, ApiKeyStore::resolve_user( '' ) );
		$this->assertSame( 0, ApiKeyStore::resolve_user( '   ' ) );
	}

	public function test_revoked_key_stops_working(): void {
		$created = ApiKeyStore::create( 'laptop', 5 );
		$this->assertSame( 5, ApiKeyStore::resolve_user( $created['key'] ) );

		$this->assertTrue( ApiKeyStore::delete( $created['id'] ) );
		$this->assertSame( 0, ApiKeyStore::resolve_user( $created['key'] ) );
	}

	public function test_delete_reports_false_for_unknown_id(): void {
		$this->assertFalse( ApiKeyStore::delete( 'does-not-exist' ) );
	}

	public function test_each_key_is_distinct(): void {
		$first  = ApiKeyStore::create( 'one', 5 );
		$second = ApiKeyStore::create( 'two', 5 );

		$this->assertNotSame( $first['key'], $second['key'] );
		$this->assertNotSame( $first['id'], $second['id'] );
		$this->assertSame( 5, ApiKeyStore::resolve_user( $first['key'] ) );
		$this->assertSame( 5, ApiKeyStore::resolve_user( $second['key'] ) );
	}

	/**
	 * The display list backs the settings screen, so it must never carry the
	 * hash out to the browser.
	 */
	public function test_display_list_excludes_hashes(): void {
		ApiKeyStore::create( 'laptop', 5 );

		$rows = ApiKeyStore::list_for_display();

		$this->assertCount( 1, $rows );
		$this->assertArrayNotHasKey( 'hash', $rows[0] );
		$this->assertSame( 'laptop', $rows[0]['label'] );
		$this->assertSame( 5, $rows[0]['user_id'] );
	}

	public function test_blank_label_falls_back_to_a_default(): void {
		$created = ApiKeyStore::create( '   ', 5 );

		$this->assertNotSame( '', trim( $created['label'] ) );
	}
}
