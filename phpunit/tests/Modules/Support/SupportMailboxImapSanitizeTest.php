<?php
/**
 * Unit tests for the custom-IMAP sanitisation + masking added to
 * {@see \DoubleScale\Modules\Support\Rest\Controllers\RestMailboxController}.
 *
 * Verifies the security-sensitive boundaries:
 *   - a new password is ENCRYPTED at rest (never stored/returned in clear);
 *   - the '********' sentinel PRESERVES the previously-stored encrypted value;
 *   - `encryption` is whitelisted and `port` defaulted;
 *   - an empty block is dropped (no dangling IMAP keys on a web box);
 *   - `shape_mailbox()` MASKS the password on output (never leaks ciphertext).
 *
 * The methods under test are private; we drive them through reflection. The model
 * is instantiated without a DB (Eloquent allows `new` + attribute access).
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Support;

require_once __DIR__ . '/../../../SupportImapTestStubs.php';

use DoubleScale\Core\Settings\Settings as CoreSettings;
use DoubleScale\Modules\Support\Models\MailboxModel;
use DoubleScale\Modules\Support\Rest\Controllers\RestMailboxController;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

final class SupportMailboxImapSanitizeTest extends TestCase {

	/**
	 * Invoke a private method on a fresh controller via reflection.
	 *
	 * @param string $method Method name.
	 * @param array  $args   Positional args.
	 * @return mixed
	 */
	private function invoke( string $method, array $args ) {
		$controller = new RestMailboxController();
		$ref        = new ReflectionMethod( RestMailboxController::class, $method );
		$ref->setAccessible( true );
		return $ref->invokeArgs( $controller, $args );
	}

	/**
	 * A new plaintext password is encrypted at rest (round-trips via decrypt).
	 */
	public function test_sanitize_data_encrypts_new_password(): void {
		$data = array(
			'imap' => array(
				'host'       => 'imap.example.com',
				'port'       => 993,
				'encryption' => 'ssl',
				'username'   => 'help@example.com',
				'password'   => 'plain-text-pw',
			),
		);

		$clean  = $this->invoke( 'sanitize_data', array( $data, null ) );
		$stored = $clean['imap']['password'];

		$this->assertNotSame( 'plain-text-pw', $stored, 'Password must not be stored in clear.' );
		$this->assertSame( 'plain-text-pw', CoreSettings::decrypt_value( $stored ), 'Stored value must decrypt back.' );
	}

	/**
	 * The '********' sentinel keeps the existing stored (encrypted) password.
	 */
	public function test_sanitize_data_preserves_masked_password(): void {
		$existing_encrypted = CoreSettings::encrypt_value( 'original-pw' );

		$existing       = new MailboxModel();
		$existing->data = array(
			'imap' => array(
				'host'     => 'imap.example.com',
				'username' => 'help@example.com',
				'password' => $existing_encrypted,
			),
		);

		// Partial update: operator changes the host but leaves the password masked.
		$data  = array(
			'imap' => array(
				'host'     => 'imap.newhost.com',
				'username' => 'help@example.com',
				'password' => '********',
			),
		);
		$clean = $this->invoke( 'sanitize_data', array( $data, $existing ) );

		$this->assertSame( $existing_encrypted, $clean['imap']['password'], 'Masked password must keep the stored value.' );
		$this->assertSame( 'imap.newhost.com', $clean['imap']['host'] );
	}

	/**
	 * Invalid encryption falls back to ssl; missing port defaults to 993.
	 */
	public function test_sanitize_data_whitelists_encryption_and_defaults_port(): void {
		$data  = array(
			'imap' => array(
				'host'       => 'imap.example.com',
				'encryption' => 'evil',
				'username'   => 'u@example.com',
				'password'   => 'pw',
			),
		);
		$clean = $this->invoke( 'sanitize_data', array( $data, null ) );

		$this->assertSame( 'ssl', $clean['imap']['encryption'] );
		$this->assertSame( 993, $clean['imap']['port'] );
	}

	/**
	 * An entirely empty IMAP block is dropped so a web box keeps no IMAP keys.
	 */
	public function test_sanitize_data_drops_empty_block(): void {
		$data  = array(
			'name' => 'Support',
			'imap' => array(
				'host'     => '',
				'username' => '',
				'password' => '',
			),
		);
		$clean = $this->invoke( 'sanitize_data', array( $data, null ) );

		$this->assertArrayNotHasKey( 'imap', $clean );
		$this->assertSame( 'Support', $clean['name'] );
	}

	/**
	 * shape_mailbox() must mask a stored password as '********' and never leak it.
	 */
	public function test_shape_mailbox_masks_password(): void {
		$mailbox       = new MailboxModel();
		// Pre-populate tickets_count so shape_mailbox() skips the live relation
		// count (no DB in the stub harness).
		$mailbox->tickets_count = 0;
		$mailbox->data          = array(
			'identity' => array( 'from_email' => 'help@example.com' ),
			'imap'     => array(
				'host'     => 'imap.example.com',
				'username' => 'help@example.com',
				'password' => CoreSettings::encrypt_value( 'top-secret' ),
			),
		);

		$shaped = $this->invoke( 'shape_mailbox', array( $mailbox ) );

		$this->assertSame( '********', $shaped['data']['imap']['password'] );
		$this->assertStringNotContainsString( 'top-secret', wp_json_encode( $shaped ) );
	}

	/**
	 * shape_mailbox() emits '' (not '********') when no password is stored.
	 */
	public function test_shape_mailbox_empty_password_renders_blank(): void {
		$mailbox                = new MailboxModel();
		$mailbox->tickets_count = 0;
		$mailbox->data          = array(
			'imap' => array(
				'host'     => 'imap.example.com',
				'username' => 'help@example.com',
				'password' => '',
			),
		);

		$shaped = $this->invoke( 'shape_mailbox', array( $mailbox ) );

		$this->assertSame( '', $shaped['data']['imap']['password'] );
	}
}
