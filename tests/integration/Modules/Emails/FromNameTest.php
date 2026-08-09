<?php
/**
 * Diagnostic: does a custom From name actually reach PHPMailer?
 *
 * Reported bug: emails always go out with the default (site) From name even
 * when a custom one is set. This walks the real wp_mail() path and inspects the
 * PHPMailer instance that would be handed to the SMTP provider.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration\Modules\Emails;

use DoubleScale\Modules\Emails\Emails;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group emails
 */
final class FromNameTest extends IntegrationTestCase {

	/** @var array<string, string> */
	private $captured = array();

	/**
	 * Send through the real wp_mail() path and return what PHPMailer ended up
	 * configured with. The capture hook aborts the transport, so nothing is
	 * actually delivered.
	 *
	 * @param Emails $emails Configured mailer.
	 * @return array<string, string>
	 */
	private function capture_send( Emails $emails ): array {
		try {
			$emails->send( 'recipient@example.com', 'Subject', '<p>Body</p>' );
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement
			// Transport aborted on purpose by the phpmailer_init hook.
		}

		return $this->captured;
	}

	public function setUp(): void {
		parent::setUp();

		$this->captured = array();

		// Capture the fully-configured PHPMailer just before send, which is
		// exactly what the SMTP override/provider reads From/FromName from.
		//
		// Throwing here both captures the values and aborts the real send:
		// wp_mail() wraps ->send() in a try/catch for phpmailerException, so
		// this keeps the test hermetic without short-circuiting wp_mail()
		// before PHPMailer is ever configured (which pre_wp_mail would do).
		add_action(
			'phpmailer_init',
			function ( $phpmailer ) {
				$this->captured['From']     = $phpmailer->From;
				$this->captured['FromName'] = $phpmailer->FromName;

				throw new \PHPMailer\PHPMailer\Exception( 'aborted-by-test' );
			},
			// Late, so plugin hooks on the same action have run.
			9999
		);
	}

	public function test_custom_from_name_reaches_phpmailer(): void {
		update_option( 'blogname', 'DEFAULT_SITE_NAME' );

		$emails               = new Emails();
		$emails->from_name    = 'CUSTOM_SENDER_NAME';
		$emails->from_address = 'sender@example.com';

		$captured = $this->capture_send( $emails );

		$this->assertSame(
			'CUSTOM_SENDER_NAME',
			$captured['FromName'] ?? null,
			'PHPMailer::FromName is not the custom name — the sender name never reaches the mailer.'
		);
	}

	public function test_custom_from_address_reaches_phpmailer(): void {
		$emails               = new Emails();
		$emails->from_name    = 'CUSTOM_SENDER_NAME';
		$emails->from_address = 'sender@example.com';

		$captured = $this->capture_send( $emails );

		$this->assertSame( 'sender@example.com', $captured['From'] ?? null );
	}

	/**
	 * With no custom name set, the site name is the expected fallback.
	 */
	public function test_falls_back_to_site_name_when_unset(): void {
		update_option( 'blogname', 'DEFAULT_SITE_NAME' );

		$emails               = new Emails();
		$emails->from_address = 'sender@example.com';

		$captured = $this->capture_send( $emails );

		$this->assertSame( 'DEFAULT_SITE_NAME', $captured['FromName'] ?? null );
	}
}
