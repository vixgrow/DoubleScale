<?php
/**
 * Unit tests for the broadened receivability gate in
 * {@see \DoubleScale\Modules\Support\Rest\Controllers\RestMailboxController}.
 *
 * An `box_type='email'` mailbox is now valid via EITHER an OAuth-receivable From
 * address OR a complete custom-IMAP block. These tests pin the custom-IMAP route
 * (the OAuth route is covered indirectly by ResolveImapProviderWithoutProTest).
 *
 * Pro is absent in the test runtime, so `from_email_is_receivable()` always
 * returns false (resolve_imap_provider_for_email() → 'custom'); that isolates the
 * custom-IMAP branch as the only way these boxes can pass.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Support;

require_once __DIR__ . '/../../../SupportImapTestStubs.php';

use DoubleScale\Modules\Support\Models\MailboxModel;
use DoubleScale\Modules\Support\Rest\Controllers\RestMailboxController;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

final class SupportMailboxCustomImapValidationTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options'] = array();
	}

	/**
	 * @param array             $params   Request body.
	 * @param MailboxModel|null $existing Existing row.
	 * @return mixed true|WP_Error
	 */
	private function validate( array $params, ?MailboxModel $existing ) {
		$controller = new RestMailboxController();
		$ref        = new ReflectionMethod( RestMailboxController::class, 'validate_receivability' );
		$ref->setAccessible( true );
		return $ref->invokeArgs( $controller, array( $params, $existing ) );
	}

	/**
	 * Pre-condition: with Pro absent, no address is OAuth-receivable, so any pass
	 * below is attributable to the custom-IMAP branch.
	 */
	public function test_no_address_is_oauth_receivable_in_test_runtime(): void {
		$this->assertFalse(
			\DoubleScale\Modules\Smtp\Settings::is_from_email_receivable( 'help@example.com' )
		);
	}

	/**
	 * A web box never needs receivability — always valid.
	 */
	public function test_web_box_always_valid(): void {
		$this->assertTrue( $this->validate( array( 'box_type' => 'web' ), null ) );
	}

	/**
	 * An email box with a complete custom-IMAP block in the payload validates.
	 */
	public function test_email_box_with_complete_custom_imap_is_valid(): void {
		$params = array(
			'box_type' => 'email',
			'data'     => array(
				'identity' => array( 'from_email' => 'help@example.com' ),
				'imap'     => array(
					'host'     => 'imap.example.com',
					'username' => 'help@example.com',
					'password' => 'pw',
				),
			),
		);

		$this->assertTrue( $this->validate( $params, null ) );
	}

	/**
	 * An email box with no OAuth and no/incomplete custom IMAP is rejected.
	 */
	public function test_email_box_without_imap_is_rejected(): void {
		$params = array(
			'box_type' => 'email',
			'data'     => array(
				'identity' => array( 'from_email' => 'help@example.com' ),
				'imap'     => array( 'host' => 'imap.example.com' ), // missing username + password
			),
		);

		$result = $this->validate( $params, null );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'connection_not_receivable', $result->get_error_code() );
	}

	/**
	 * Partial PUT: payload sends only the masked password; host/username come from
	 * the existing row. The EFFECTIVE (merged) block is complete, so it validates.
	 */
	public function test_partial_update_merges_existing_imap_for_gate(): void {
		$existing       = new MailboxModel();
		$existing->box_type = 'email';
		$existing->data = array(
			'identity' => array( 'from_email' => 'help@example.com' ),
			'imap'     => array(
				'host'     => 'imap.example.com',
				'username' => 'help@example.com',
				'password' => \DoubleScale\Core\Settings\Settings::encrypt_value( 'stored-pw' ),
			),
		);

		// Body changes nothing about IMAP except re-sending the masked password.
		$params = array(
			'data' => array(
				'imap' => array( 'password' => '********' ),
			),
		);

		$this->assertTrue( $this->validate( $params, $existing ) );
	}
}
