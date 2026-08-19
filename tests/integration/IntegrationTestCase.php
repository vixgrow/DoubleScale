<?php
/**
 * Base class for DoubleScale integration tests.
 *
 * Extends WP_UnitTestCase so every test runs inside a real WordPress install
 * with `$wpdb` connected to MySQL. WP_UnitTestCase wraps each test in a DB
 * transaction that's rolled back in tearDown, so tests are isolated without
 * manual cleanup.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration;

use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * Shared helpers for REST dispatch, user setup, and DB seeding.
 */
abstract class IntegrationTestCase extends WP_UnitTestCase {

	/**
	 * Restore the plugin settings option to its pristine state.
	 *
	 * The transaction rollback normally handles this, but a test that runs DDL
	 * (ALTER/CREATE TABLE) triggers an implicit COMMIT in MySQL, ending the
	 * transaction early — anything written before that point, including this
	 * option, becomes permanent and leaks into every later test. That is how a
	 * migration test's EUR ended up failing an Authorize.Net USD fixture.
	 *
	 * The baseline comes from the bootstrap (DOUBLESCALE_TESTS_PRISTINE_SETTINGS),
	 * captured before any test ran. A per-test snapshot would be too late: by
	 * then an earlier test may already have committed its own value, and the
	 * restore would faithfully put the corruption back.
	 */
	protected function tearDown(): void {
		// Roll back first, then repair. For an ordinary test the rollback has
		// already undone the option and this is a no-op; for a DDL test the
		// rollback is gone (implicit COMMIT) and this is the only thing that
		// puts the option back.
		parent::tearDown();

		if ( ! defined( 'DOUBLESCALE_TESTS_PRISTINE_SETTINGS' ) ) {
			return;
		}

		$pristine = json_decode( DOUBLESCALE_TESTS_PRISTINE_SETTINGS, true );

		// Drop the cached copy first: update_option() short-circuits when the
		// cached value already equals what is being written, which would leave
		// a committed row untouched.
		wp_cache_delete( 'doublescale_settings', 'options' );
		wp_cache_delete( 'alloptions', 'options' );

		if ( null === $pristine ) {
			delete_option( 'doublescale_settings' );
		} else {
			update_option( 'doublescale_settings', $pristine );
		}
	}

	/**
	 * Dispatch a REST request against the running WordPress REST server.
	 *
	 * @param string                $method HTTP method (GET/POST/PUT/PATCH/DELETE).
	 * @param string                $route  Route with leading slash (e.g. '/doublescale/v1/contacts').
	 * @param array<string, mixed>  $body   Request body / query params.
	 * @param int|null              $user_id Optional WP user ID to authenticate as. Null = unauthenticated.
	 * @return WP_REST_Response
	 */
	protected function dispatch_rest( $method, $route, $body = array(), $user_id = null ) {
		if ( null !== $user_id ) {
			wp_set_current_user( (int) $user_id );
		} else {
			wp_set_current_user( 0 );
		}

		$request = new WP_REST_Request( strtoupper( $method ), $route );

		if ( \in_array( strtoupper( $method ), array( 'POST', 'PUT', 'PATCH' ), true ) ) {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		} else {
			foreach ( (array) $body as $k => $v ) {
				$request->set_param( $k, $v );
			}
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Create a user with the `administrator` role.
	 *
	 * @return int User ID.
	 */
	protected function make_admin_user() {
		return self::factory()->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Create a user with the `subscriber` role (used for permission tests).
	 *
	 * @return int User ID.
	 */
	protected function make_subscriber_user() {
		return self::factory()->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Insert a contact row directly into wp_doublescale_contacts.
	 *
	 * @param array<string, mixed> $overrides Column overrides.
	 * @return int Contact ID.
	 */
	protected function make_contact( array $overrides = array() ) {
		global $wpdb;

		$defaults = array(
			'hash_id'         => wp_generate_password( 32, false, false ),
			'email'           => 'contact-' . wp_generate_password( 8, false ) . '@example.test',
			'first_name'      => 'Test',
			'last_name'       => 'Contact',
			'email_status'    => 'subscribed',
			'sms_status'      => 'subscribed',
			'whatsapp_status' => 'subscribed',
			'created_at'      => current_time( 'mysql', true ),
			'updated_at'      => current_time( 'mysql', true ),
		);

		$data = array_merge( $defaults, $overrides );

		$wpdb->insert( $wpdb->prefix . 'doublescale_contacts', $data );

		return (int) $wpdb->insert_id;
	}

	/**
	 * Assert a table row count matches the expected number.
	 *
	 * @param string $table_suffix Table suffix (e.g. 'contacts' for wp_doublescale_contacts).
	 * @param int    $expected     Expected row count.
	 * @param string $where        Optional WHERE clause (without the leading WHERE).
	 * @return void
	 */
	protected function assert_table_row_count( $table_suffix, $expected, $where = '1=1' ) {
		global $wpdb;
		$table = $wpdb->prefix . 'doublescale_' . $table_suffix;
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM `{$table}` WHERE {$where}" );
		$this->assertSame( $expected, $count, "Row count mismatch for {$table} WHERE {$where}" );
	}
}
