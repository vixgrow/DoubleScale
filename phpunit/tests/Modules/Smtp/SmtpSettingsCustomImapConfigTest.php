<?php
/**
 * Unit tests for the custom-IMAP resolution helpers added to Smtp\Settings —
 * the core "unlock" that lets a support email channel poll a non-OAuth inbox.
 *
 * Covers {@see \DoubleScale\Modules\Smtp\Settings::mailbox_has_custom_imap()}
 * and {@see \DoubleScale\Modules\Smtp\Settings::build_custom_imap_config()},
 * including that the stored (encrypted) password is DECRYPTED back to plaintext
 * for the poll and the config uses basic `login` auth (not XOAUTH2).
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Smtp;

require_once __DIR__ . '/../../../SupportImapTestStubs.php';

use DoubleScale\Core\Settings\Settings as CoreSettings;
use DoubleScale\Modules\Smtp\Settings;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class SmtpSettingsCustomImapConfigTest extends TestCase {

	/**
	 * A complete block (host + username + password) is recognised.
	 */
	public function test_mailbox_has_custom_imap_true_when_complete(): void {
		$data = array(
			'imap' => array(
				'host'     => 'imap.example.com',
				'username' => 'help@example.com',
				'password' => 'secret',
			),
		);
		$this->assertTrue( Settings::mailbox_has_custom_imap( $data ) );
	}

	/**
	 * Missing any of host/username/password → not usable. Also tolerates a
	 * non-array / absent blob without erroring.
	 *
	 * @dataProvider incomplete_blocks
	 * @param mixed $data Mailbox data blob.
	 */
	public function test_mailbox_has_custom_imap_false_when_incomplete( $data ): void {
		$this->assertFalse( Settings::mailbox_has_custom_imap( $data ) );
	}

	/**
	 * @return array<string, array{0: mixed}>
	 */
	public function incomplete_blocks(): array {
		return array(
			'no imap key'      => array( array( 'name' => 'X' ) ),
			'empty imap'       => array( array( 'imap' => array() ) ),
			'missing password' => array( array( 'imap' => array( 'host' => 'h', 'username' => 'u' ) ) ),
			'missing host'     => array( array( 'imap' => array( 'username' => 'u', 'password' => 'p' ) ) ),
			'blank host'       => array( array( 'imap' => array( 'host' => '   ', 'username' => 'u', 'password' => 'p' ) ) ),
			'not an array'     => array( 'nope' ),
		);
	}

	/**
	 * The headline behaviour: a stored ENCRYPTED password is decrypted back to
	 * plaintext, and the config is shaped for ImapClient with `login` auth.
	 */
	public function test_build_custom_imap_config_decrypts_and_uses_login_auth(): void {
		$plaintext = 'sup3r-s3cret-pass';
		$encrypted = CoreSettings::encrypt_value( $plaintext );
		$this->assertNotSame( $plaintext, $encrypted, 'Pre-condition: value must actually be encrypted.' );

		$data = array(
			'imap' => array(
				'host'       => 'imap.example.com',
				'port'       => 143,
				'encryption' => 'tls',
				'username'   => 'help@example.com',
				'password'   => $encrypted,
			),
		);

		$config = Settings::build_custom_imap_config( $data );

		$this->assertIsArray( $config );
		$this->assertSame( 'imap.example.com', $config['host'] );
		$this->assertSame( 143, $config['port'] );
		$this->assertSame( 'tls', $config['encryption'] );
		$this->assertSame( 'help@example.com', $config['username'] );
		$this->assertSame( $plaintext, $config['password'], 'Password must be decrypted for the poll.' );
		$this->assertSame( 'login', $config['authentication'], 'Custom IMAP uses basic login, not XOAUTH2.' );
	}

	/**
	 * Defaults: missing port → 993, invalid encryption → ssl.
	 */
	public function test_build_custom_imap_config_applies_defaults(): void {
		$data = array(
			'imap' => array(
				'host'       => 'imap.example.com',
				'encryption' => 'bogus',
				'username'   => 'help@example.com',
				'password'   => CoreSettings::encrypt_value( 'pw' ),
			),
		);

		$config = Settings::build_custom_imap_config( $data );

		$this->assertSame( 993, $config['port'] );
		$this->assertSame( 'ssl', $config['encryption'] );
	}

	/**
	 * An incomplete block yields null (poller then treats the box as send-only).
	 */
	public function test_build_custom_imap_config_null_when_incomplete(): void {
		$this->assertNull( Settings::build_custom_imap_config( array( 'imap' => array( 'host' => 'h' ) ) ) );
		$this->assertNull( Settings::build_custom_imap_config( array() ) );
	}
}
