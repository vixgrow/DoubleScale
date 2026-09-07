<?php
/**
 * The contact-merge notification address, end to end through the settings API.
 *
 * The notifier reads `contact_merge.notify_email` and silently sends nothing
 * when the address is unusable. That silence is correct at send time — but it
 * makes a typo at save time invisible: the admin types a bad address, the save
 * succeeds, and no notification ever arrives with nothing to explain why. The
 * settings endpoint therefore has to reject an address the notifier would
 * refuse, at the moment it is entered.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Core\Settings\Settings;
use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Contacts\Services\ContactMergeNotifier;
use DoubleScale\Tests\Integration\IntegrationTestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

/**
 * @group contacts
 * @group merge
 * @group settings
 */
final class ContactMergeNotifyEmailSettingTest extends IntegrationTestCase {

	/**
	 * Save settings as an administrator.
	 *
	 * @param array $body Settings payload.
	 * @return \WP_REST_Response
	 */
	private function save_settings( array $body ) {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );

		return $this->dispatch_rest( 'POST', '/doublescale/v1/settings', $body, $user_id );
	}

	/**
	 * What the notifier would resolve out of the stored settings.
	 *
	 * @return string
	 */
	private function stored_recipient() {
		$stored = Settings::get( ContactMergeNotifier::SETTINGS_KEY, array() );
		$stored = is_array( $stored ) ? $stored : array();

		$method = new ReflectionMethod( ContactMergeNotifier::class, 'resolve_recipient' );
		$method->setAccessible( true );

		return (string) $method->invoke( null, $stored );
	}

	/**
	 * A valid address is stored and the notifier picks it up.
	 */
	public function test_valid_address_is_saved_and_reaches_the_notifier(): void {
		$response = $this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => 'dataquality@example.test' ) )
		);

		$this->assertSame( 200, $response->get_status() );

		$stored = Settings::get( ContactMergeNotifier::SETTINGS_KEY, array() );
		$this->assertIsArray( $stored );
		$this->assertSame( 'dataquality@example.test', $stored['notify_email'] );
		$this->assertSame( 'dataquality@example.test', $this->stored_recipient() );
	}

	/**
	 * A malformed address is refused rather than saved into a dead end.
	 *
	 * Without this the save reports success and the notifier then discards the
	 * address forever — the admin believes notifications are on and never finds
	 * out otherwise.
	 */
	public function test_malformed_address_is_rejected(): void {
		$response = $this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => 'not-an-email' ) )
		);

		$this->assertSame(
			400,
			$response->get_status(),
			'An address the notifier would throw away must not be accepted at save time.'
		);

		$stored = Settings::get( ContactMergeNotifier::SETTINGS_KEY, array() );
		$stored = is_array( $stored ) ? $stored : array();
		$this->assertSame(
			'',
			(string) ( $stored['notify_email'] ?? '' ),
			'The rejected address must not be persisted.'
		);
	}

	/**
	 * Clearing the field is how you turn notifications off, so empty is valid.
	 */
	public function test_empty_address_is_accepted_and_disables_notifications(): void {
		$this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => 'dataquality@example.test' ) )
		);

		$response = $this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => '' ) )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '', $this->stored_recipient() );
	}

	/**
	 * Whitespace around an otherwise valid address is a typing accident.
	 */
	public function test_surrounding_whitespace_is_accepted(): void {
		$response = $this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => '  dataquality@example.test  ' ) )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'dataquality@example.test', $this->stored_recipient() );
	}

	/**
	 * Saving the merge address must not disturb settings owned by other tabs.
	 *
	 * Settings are persisted with a shallow `array_replace`, so a payload that
	 * carries only `contact_merge` has to leave neighbouring top-level keys
	 * alone. The field sits on the Business tab, which makes `business` the
	 * neighbour most likely to be collateral damage.
	 */
	public function test_saving_the_address_leaves_other_settings_alone(): void {
		Settings::update( 'business', array( 'business_name' => 'Acme CRM' ) );

		$response = $this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => 'dataquality@example.test' ) )
		);
		$this->assertSame( 200, $response->get_status() );

		$business = Settings::get( 'business', array() );
		$this->assertSame( 'Acme CRM', $business['business_name'] );
	}

	/**
	 * The reverse: saving another tab must not silently clear the address.
	 */
	public function test_saving_other_settings_leaves_the_address_alone(): void {
		$this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => 'dataquality@example.test' ) )
		);

		$response = $this->save_settings(
			array( 'business' => array( 'business_name' => 'Renamed Co' ) )
		);
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( 'dataquality@example.test', $this->stored_recipient() );
	}

	/**
	 * A sales rep has no business setting a site-wide notification address.
	 *
	 * The Business tab is hidden from limited-access roles in the admin, but
	 * hiding a tab is not access control — the endpoint has to refuse too.
	 */
	public function test_sales_rep_cannot_set_the_address(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::SALES_REP ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/settings',
			array( 'contact_merge' => array( 'notify_email' => 'rep@example.test' ) ),
			$user_id
		);

		$this->assertGreaterThanOrEqual(
			400,
			$response->get_status(),
			'A sales rep must not be able to write site-wide settings.'
		);
		$this->assertSame( '', $this->stored_recipient() );
	}

	/**
	 * The saved address comes back on a read, so the settings screen can show it.
	 */
	public function test_saved_address_is_returned_by_the_settings_endpoint(): void {
		$this->save_settings(
			array( 'contact_merge' => array( 'notify_email' => 'dataquality@example.test' ) )
		);

		$user_id  = self::factory()->user->create( array( 'role' => UserRoles::ADMINISTRATOR ) );
		$response = $this->dispatch_rest( 'GET', '/doublescale/v1/settings', array(), $user_id );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'contact_merge', $data );
		$this->assertSame( 'dataquality@example.test', $data['contact_merge']['notify_email'] );
	}
}
