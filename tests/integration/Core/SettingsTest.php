<?php
/**
 * Integration test for \DoubleScale\Core\Settings\Settings.
 *
 * Covers the get/update/delete pipeline through the real `wp_options` table,
 * the get_currency() fallback, and the encrypt_value()/decrypt_value() round-trip.
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Core\Settings\Settings;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class SettingsTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		Settings::delete_all();
	}

	public function test_get_returns_default_when_unset(): void {
		$this->assertSame( 'fallback', Settings::get( 'no_such_key', 'fallback' ) );
		$this->assertFalse( Settings::get( 'no_such_key' ) );
	}

	public function test_update_then_get_round_trips_a_scalar(): void {
		$this->assertTrue( Settings::update( 'site_name', 'Acme CRM' ) );
		$this->assertSame( 'Acme CRM', Settings::get( 'site_name' ) );
	}

	public function test_update_then_get_round_trips_a_nested_array(): void {
		Settings::update( 'currency', array( 'currency' => 'EUR', 'symbol' => '€' ) );
		$this->assertSame(
			array( 'currency' => 'EUR', 'symbol' => '€' ),
			Settings::get( 'currency' )
		);
	}

	public function test_update_many_merges_with_existing(): void {
		Settings::update( 'a', 1 );
		Settings::update_many( array( 'b' => 2, 'c' => 3 ) );

		$this->assertSame( 1, Settings::get( 'a' ) );
		$this->assertSame( 2, Settings::get( 'b' ) );
		$this->assertSame( 3, Settings::get( 'c' ) );
	}

	public function test_update_many_with_non_array_input_is_a_noop(): void {
		Settings::update( 'preserved', 'still-here' );
		// @phpstan-ignore-next-line  intentional bad input
		Settings::update_many( 'not-an-array' );
		$this->assertSame( 'still-here', Settings::get( 'preserved' ) );
	}

	public function test_delete_removes_just_one_key(): void {
		Settings::update_many( array( 'keep' => 'me', 'drop' => 'me' ) );
		Settings::delete( 'drop' );

		$this->assertSame( 'me', Settings::get( 'keep' ) );
		$this->assertFalse( Settings::get( 'drop' ) );
	}

	public function test_delete_all_clears_the_option_entirely(): void {
		Settings::update_many( array( 'a' => 1, 'b' => 2 ) );
		$this->assertNotEmpty( Settings::get_all() );

		Settings::delete_all();
		$this->assertSame( array(), get_option( Settings::OPTION_NAME, array() ) );
	}

	public function test_get_currency_returns_usd_when_unset(): void {
		$this->assertSame( 'USD', Settings::get_currency() );
	}

	public function test_get_currency_reads_nested_currency_setting(): void {
		Settings::update( 'currency', array( 'currency' => 'GBP' ) );
		$this->assertSame( 'GBP', Settings::get_currency() );
	}

	public function test_document_currency_null_inherits_global_regardless_of_sent_at(): void {
		Settings::update( 'currency', array( 'currency' => 'EUR' ) );

		$this->assertSame( 'EUR', Settings::document_currency( null, null ) );
		$this->assertSame( 'EUR', Settings::document_currency( '', '2026-01-01 00:00:00' ) );
		$this->assertSame( 'USD', Settings::document_currency( 'USD', null ) );
		$this->assertSame( 'GBP', Settings::document_currency( 'GBP', '2026-01-01 00:00:00' ) );
	}

	public function test_get_default_email_footer_contains_unsubscribe_merge_tag(): void {
		$this->assertStringContainsString( '{{contact:unsubscribe_link}}', Settings::get_default_email_footer() );
	}

	public function test_get_default_opt_in_subject_and_content_are_non_empty(): void {
		$this->assertNotEmpty( Settings::get_default_opt_in_subject() );
		$this->assertNotEmpty( Settings::get_default_opt_in_content() );
		$this->assertStringContainsString( '{{contact:subscribe_link}}', Settings::get_default_opt_in_content() );
	}

	public function test_encrypt_then_decrypt_round_trips_a_plaintext(): void {
		$plaintext = 'super-secret-smtp-password-' . wp_generate_password( 16, false );

		$ciphertext = Settings::encrypt_value( $plaintext );
		$this->assertNotEmpty( $ciphertext );
		$this->assertNotSame( $plaintext, $ciphertext );

		$decrypted = Settings::decrypt_value( $ciphertext );
		$this->assertSame( $plaintext, $decrypted );
	}

	public function test_encrypt_value_returns_empty_string_for_empty_input(): void {
		$this->assertSame( '', Settings::encrypt_value( '' ) );
		$this->assertSame( '', Settings::encrypt_value( null ) );
	}
}
