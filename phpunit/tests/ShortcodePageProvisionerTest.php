<?php
/**
 * Covers the shared shortcode-page provisioner: the registry every module
 * registers into, the one-time guard per shortcode, and the invariant that an
 * admin who deletes an auto-created page is not fought on the next admin load.
 *
 * Page creation itself (wp_insert_post) is not exercised here — the fast suite
 * has no WP database. That path is proven against the live site.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\Core\Services\ShortcodePageProvisioner;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group provisioning
 */
final class ShortcodePageProvisionerTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options'] = array();
		ShortcodePageProvisioner::reset_registry_for_tests();
	}

	protected function tearDown(): void {
		ShortcodePageProvisioner::reset_registry_for_tests();
		parent::tearDown();
	}

	/**
	 * Registering a shortcode makes it resolvable by name, so each module owns
	 * its own descriptor instead of a central hardcoded list.
	 */
	public function test_register_exposes_the_descriptor(): void {
		ShortcodePageProvisioner::register(
			'doublescale_proposal',
			array(
				'title' => 'Proposal',
				'slug'  => 'proposal',
			)
		);

		$registered = ShortcodePageProvisioner::get_registered();

		$this->assertArrayHasKey( 'doublescale_proposal', $registered );
		$this->assertSame( 'Proposal', $registered['doublescale_proposal']['title'] );
		$this->assertSame( 'proposal', $registered['doublescale_proposal']['slug'] );
	}

	/**
	 * Every shortcode gets its own flag and page-id option, so provisioning one
	 * never suppresses or overwrites another.
	 */
	public function test_option_keys_are_namespaced_per_shortcode(): void {
		$this->assertNotSame(
			ShortcodePageProvisioner::provisioned_flag( 'doublescale_proposal' ),
			ShortcodePageProvisioner::provisioned_flag( 'doublescale_invoice' )
		);
		$this->assertNotSame(
			ShortcodePageProvisioner::page_id_option( 'doublescale_proposal' ),
			ShortcodePageProvisioner::page_id_option( 'doublescale_invoice' )
		);
	}

	/**
	 * The Client Portal shipped before this class existed, using its own option
	 * names. Those must be preserved verbatim or every existing install
	 * re-provisions a duplicate portal page on upgrade.
	 */
	public function test_client_portal_keeps_its_legacy_option_names(): void {
		$this->assertSame(
			'doublescale_client_portal_page_provisioned',
			ShortcodePageProvisioner::provisioned_flag( 'doublescale_client_portal' )
		);
		$this->assertSame(
			'doublescale_client_portal_page_id',
			ShortcodePageProvisioner::page_id_option( 'doublescale_client_portal' )
		);
	}

	/**
	 * The one-time guard: once provisioned, an admin who trashes the page is not
	 * fought on the next admin load.
	 */
	public function test_maybe_provision_is_noop_once_flag_is_set(): void {
		ShortcodePageProvisioner::register(
			'doublescale_proposal',
			array(
				'title' => 'Proposal',
				'slug'  => 'proposal',
			)
		);

		update_option( ShortcodePageProvisioner::provisioned_flag( 'doublescale_proposal' ), 'yes' );

		ShortcodePageProvisioner::maybe_provision_all();

		// Short-circuits before any lookup/creation, so no page id is recorded.
		$this->assertSame(
			0,
			(int) get_option( ShortcodePageProvisioner::page_id_option( 'doublescale_proposal' ), 0 )
		);
	}

	/**
	 * A shortcode with no page yet must report itself as missing, which is what
	 * drives the admin settings card and the auto-provision run.
	 */
	public function test_status_reports_missing_page_for_unprovisioned_shortcode(): void {
		ShortcodePageProvisioner::register(
			'doublescale_booking',
			array(
				'title' => 'Booking',
				'slug'  => 'booking',
			)
		);

		$status = ShortcodePageProvisioner::get_status( 'doublescale_booking' );

		$this->assertFalse( $status['provisioned'] );
		$this->assertFalse( $status['exists'] );
		$this->assertSame( 0, $status['page_id'] );
		$this->assertSame( '[doublescale_booking]', $status['shortcode'] );
	}

	/**
	 * get_all_status() backs the settings screen listing every page at once.
	 * Asserts the collection is non-empty before trusting the per-row shape.
	 */
	public function test_get_all_status_covers_every_registered_shortcode(): void {
		ShortcodePageProvisioner::register(
			'doublescale_proposal',
			array(
				'title' => 'Proposal',
				'slug'  => 'proposal',
			)
		);
		ShortcodePageProvisioner::register(
			'doublescale_invoice',
			array(
				'title' => 'Invoice',
				'slug'  => 'invoice',
			)
		);

		$all = ShortcodePageProvisioner::get_all_status();

		$this->assertNotEmpty( $all, 'Status collection must not be empty, or the assertions below pass vacuously.' );
		$this->assertCount( 2, $all );

		foreach ( $all as $shortcode => $status ) {
			$this->assertArrayHasKey( 'page_id', $status, "Missing page_id for {$shortcode}" );
			$this->assertArrayHasKey( 'exists', $status, "Missing exists for {$shortcode}" );
			$this->assertSame( '[' . $shortcode . ']', $status['shortcode'] );
		}
	}

	/**
	 * Registering the same shortcode twice (free boots, then Pro re-registers)
	 * must not create a second entry.
	 */
	public function test_register_is_idempotent(): void {
		ShortcodePageProvisioner::register(
			'doublescale_proposal',
			array(
				'title' => 'Proposal',
				'slug'  => 'proposal',
			)
		);
		ShortcodePageProvisioner::register(
			'doublescale_proposal',
			array(
				'title' => 'Proposal',
				'slug'  => 'proposal',
			)
		);

		$this->assertCount( 1, ShortcodePageProvisioner::get_registered() );
	}
}
