<?php
/**
 * Encryption round-trip edge cases for {@see \DoubleScale\Core\Settings\Settings}.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

require_once __DIR__ . '/../../SupportImapTestStubs.php';

use DoubleScale\Core\Settings\Settings;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class SettingsEncryptionTest extends TestCase {

	public function test_encrypt_decrypt_round_trip(): void {
		$plaintext = 'sup3r-s3cret-pass';
		$encrypted = Settings::encrypt_value( $plaintext );

		$this->assertNotSame( $plaintext, $encrypted );
		$this->assertSame( $plaintext, Settings::decrypt_value( $encrypted ) );
	}

	/**
	 * Legacy payloads could embed 0x3A bytes inside the IV; delimiter-based
	 * parsing must not split on the first in-IV "::".
	 */
	public function test_decrypt_legacy_payload_when_iv_contains_colon_bytes(): void {
		$key = hash( 'sha256', SECURE_AUTH_KEY, true );
		$iv  = str_repeat( "\x00", 14 ) . '::';
		$this->assertSame( 16, strlen( $iv ) );

		$ciphertext = openssl_encrypt( 'legacy-secret', 'aes-256-cbc', $key, 0, $iv );
		$payload    = base64_encode( $iv . '::' . $ciphertext );

		$this->assertSame( 'legacy-secret', Settings::decrypt_value( $payload ) );
	}
}
