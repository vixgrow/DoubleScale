<?php
/**
 * Covers the Client Portal page provisioner's one-time guard — the invariant
 * that an admin who deletes the auto-created page is not fought on the next
 * admin load. Does not exercise the wp_insert_post path (no real WP DB here).
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\Modules\Portal\Services\PortalPageProvisioner;
use DoubleScale\Modules\Portal\Services\PortalUrl;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group portal
 */
final class PortalPageProvisionerTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options'] = array();
	}

	public function test_exposes_expected_public_api(): void {
		$this->assertSame( 'doublescale_client_portal_page_provisioned', PortalPageProvisioner::PROVISIONED_FLAG );
		$this->assertTrue( method_exists( PortalPageProvisioner::class, 'maybe_provision' ) );
		$this->assertTrue( method_exists( PortalPageProvisioner::class, 'provision' ) );
		$this->assertTrue( method_exists( PortalPageProvisioner::class, 'get_status' ) );
	}

	public function test_maybe_provision_is_noop_once_flag_is_set(): void {
		// Simulate "already provisioned, then admin trashed the page".
		update_option( PortalPageProvisioner::PROVISIONED_FLAG, 'yes' );

		PortalPageProvisioner::maybe_provision();

		// The guard must short-circuit before any page lookup/creation, so the
		// recorded page id is never (re)written.
		$this->assertSame( 0, (int) get_option( PortalUrl::PAGE_ID_OPTION, 0 ) );
	}
}
