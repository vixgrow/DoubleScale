<?php
/**
 * Who receives the automatic-merge notification.
 *
 * An automatic merge happens with nobody watching, so someone has to be told
 * after the fact. The recipient is a single address configured in settings —
 * not every admin — so the notice goes to whoever actually owns data quality,
 * which may not be a WordPress user at all.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\Services\ContactMergeNotifier;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

/**
 * @group contacts
 * @group merge
 */
final class ContactMergeNotificationTest extends TestCase {

	/**
	 * Resolve the recipient from a settings array.
	 *
	 * @param array $settings Contact-merge settings.
	 * @return string
	 */
	private function recipient( array $settings ): string {
		$method = new ReflectionMethod( ContactMergeNotifier::class, 'resolve_recipient' );
		$method->setAccessible( true );

		return (string) $method->invoke( null, $settings );
	}

	/**
	 * The configured address is used verbatim.
	 */
	public function test_configured_address_is_used(): void {
		$this->assertSame(
			'ops@example.test',
			$this->recipient( array( 'notify_email' => 'ops@example.test' ) )
		);
	}

	/**
	 * Surrounding whitespace is a typing accident, not part of the address.
	 */
	public function test_address_is_trimmed(): void {
		$this->assertSame(
			'ops@example.test',
			$this->recipient( array( 'notify_email' => '  ops@example.test  ' ) )
		);
	}

	/**
	 * No address configured means no notification — not a fallback to some
	 * other inbox that never agreed to receive it.
	 */
	public function test_missing_address_yields_no_recipient(): void {
		$this->assertSame( '', $this->recipient( array() ) );
		$this->assertSame( '', $this->recipient( array( 'notify_email' => '' ) ) );
		$this->assertSame( '', $this->recipient( array( 'notify_email' => '   ' ) ) );
	}

	/**
	 * A malformed address is dropped rather than handed to the mailer.
	 */
	public function test_invalid_address_is_rejected(): void {
		$this->assertSame( '', $this->recipient( array( 'notify_email' => 'not-an-email' ) ) );
		$this->assertSame( '', $this->recipient( array( 'notify_email' => 'ops@' ) ) );
	}

	/**
	 * A non-string value must not reach the mailer either.
	 */
	public function test_non_string_value_is_rejected(): void {
		$this->assertSame( '', $this->recipient( array( 'notify_email' => array( 'ops@example.test' ) ) ) );
		$this->assertSame( '', $this->recipient( array( 'notify_email' => null ) ) );
	}
}
