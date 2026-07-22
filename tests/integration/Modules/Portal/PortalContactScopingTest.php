<?php
/**
 * Security-critical contact-scoping guarantees for the logged-in Client Portal.
 *
 * The portal serves customer data to logged-in *contacts* (not WP admins), so
 * the load-bearing invariant is that a contact can only ever see and edit their
 * OWN data. Identity is always derived server-side from the session email via
 * {@see PortalIdentity::current_contact()} — never from a request parameter —
 * so there is no id to tamper with on the core routes. These tests lock that in:
 *
 *   - timeline returns only the authenticated contact's activity (no cross leak)
 *   - the contact endpoint reads/writes only the current contact
 *   - a logged-out request is 401
 *   - a support staff member who is not a contact is blocked (403)
 *   - a logged-in user with no matching contact gets an empty 200, not an error
 *
 * @package DoubleScale\Tests\Integration\Modules\Portal
 */

namespace DoubleScale\Tests\Integration\Modules\Portal;

use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Portal\Services\PortalActivityWhitelist;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group portal
 */
final class PortalContactScopingTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();

		// Routes register on rest_api_init; the shared REST server was built during
		// bootstrap before this module's controllers loaded, so re-fire it.
		do_action( 'rest_api_init' );

		// Opt one activity type into the deny-by-default portal whitelist so the
		// timeline has something it is *allowed* to surface. Without an opt-in the
		// whitelist is empty and every timeline is trivially empty.
		add_filter(
			'doublescale_portal_timeline_activity_types',
			static function ( array $types ): array {
				$types[] = ActivityTypes::NOTE;
				return $types;
			}
		);
	}

	/**
	 * Create a WP subscriber whose email matches a CRM contact — the exact link
	 * the portal authenticates on.
	 *
	 * @param string $email Shared email.
	 * @return array{user_id:int, contact_id:int}
	 */
	private function make_portal_customer( string $email ): array {
		$user_id    = self::factory()->user->create(
			array(
				'role'       => 'subscriber',
				'user_email' => $email,
			)
		);
		$contact_id = $this->make_contact( array( 'email' => $email ) );

		return array(
			'user_id'    => $user_id,
			'contact_id' => $contact_id,
		);
	}

	/**
	 * Attach a whitelisted (note) activity to a contact so it can appear on the
	 * portal timeline. Passing `contact_id` makes ActivityModel write the CONTACT
	 * association itself, so we must not add a second one (unique-key clash).
	 *
	 * @param int    $contact_id Owning contact.
	 * @param string $content    Note body.
	 * @return void
	 */
	private function add_timeline_note( int $contact_id, string $content ): void {
		ActivityModel::create(
			array(
				'activity_type' => ActivityTypes::NOTE,
				'contact_id'    => $contact_id,
				'data'          => array( 'content' => $content ),
			)
		);
	}

	/**
	 * Row count on a contact's portal timeline.
	 *
	 * The timeline shaper deliberately strips note bodies (privacy), so scoping is
	 * asserted by ownership/count, not by matching content text.
	 *
	 * @param int $user_id Authenticated WP user.
	 * @return int
	 */
	private function timeline_count( int $user_id ): int {
		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/portal/timeline',
			array(),
			$user_id
		);
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		return (int) ( $data['total'] ?? count( $data['data'] ?? array() ) );
	}

	/**
	 * The whitelist opt-in in setUp must actually take effect, otherwise the
	 * timeline tests below would pass vacuously (empty because nothing is allowed,
	 * not because scoping works).
	 */
	public function test_note_is_whitelisted_for_timeline(): void {
		$this->assertTrue(
			PortalActivityWhitelist::is_allowed( ActivityTypes::NOTE ),
			'setUp must opt NOTE into the timeline whitelist for these tests to be meaningful.'
		);
	}

	/**
	 * A logged-out request is rejected with 401.
	 */
	public function test_timeline_requires_login(): void {
		$response = $this->dispatch_rest( 'GET', '/doublescale/v1/portal/timeline' );
		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * SECURITY: contact A's timeline must never contain contact B's activity.
	 */
	public function test_timeline_is_scoped_to_the_authenticated_contact(): void {
		$alice = $this->make_portal_customer( 'alice@zz.test' );
		$bob   = $this->make_portal_customer( 'bob@zz.test' );

		// Alice owns two notes, Bob owns three. Each must see exactly their own.
		$this->add_timeline_note( $alice['contact_id'], 'ALICE_1' );
		$this->add_timeline_note( $alice['contact_id'], 'ALICE_2' );
		$this->add_timeline_note( $bob['contact_id'], 'BOB_1' );
		$this->add_timeline_note( $bob['contact_id'], 'BOB_2' );
		$this->add_timeline_note( $bob['contact_id'], 'BOB_3' );

		$this->assertSame(
			2,
			$this->timeline_count( $alice['user_id'] ),
			'Alice must see exactly her own 2 notes — never Bob\'s.'
		);
		$this->assertSame(
			3,
			$this->timeline_count( $bob['user_id'] ),
			'Bob must see exactly his own 3 notes — never Alice\'s.'
		);
	}

	/**
	 * SECURITY: the contact endpoint reads only the current contact, and carries
	 * no id parameter to tamper with, so it cannot read another contact.
	 */
	public function test_contact_endpoint_returns_only_the_current_contact(): void {
		$alice = $this->make_portal_customer( 'alice2@zz.test' );
		$this->make_portal_customer( 'bob2@zz.test' );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/portal/contact',
			array(),
			$alice['user_id']
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'alice2@zz.test', strtolower( (string) ( $data['email'] ?? '' ) ) );
	}

	/**
	 * SECURITY: a self-edit updates only the caller's contact, even if a contact
	 * id is smuggled into the body (the endpoint ignores it — no id is honored).
	 */
	public function test_contact_update_cannot_touch_another_contact(): void {
		$alice = $this->make_portal_customer( 'alice3@zz.test' );
		$bob   = $this->make_portal_customer( 'bob3@zz.test' );

		$response = $this->dispatch_rest(
			'PUT',
			'/doublescale/v1/portal/contact',
			array(
				// A tampering client trying to target Bob's row + rewrite his name.
				'id'         => $bob['contact_id'],
				'contact_id' => $bob['contact_id'],
				'first_name' => 'HackedByAlice',
			),
			$alice['user_id']
		);

		$this->assertSame( 200, $response->get_status() );

		global $wpdb;
		$bob_name = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT first_name FROM {$wpdb->prefix}doublescale_contacts WHERE id = %d",
				$bob['contact_id']
			)
		);
		$this->assertNotSame( 'HackedByAlice', $bob_name, 'Bob\'s contact must be untouched.' );

		$alice_name = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT first_name FROM {$wpdb->prefix}doublescale_contacts WHERE id = %d",
				$alice['contact_id']
			)
		);
		$this->assertSame( 'HackedByAlice', $alice_name, 'Only Alice\'s own contact should change.' );
	}

	/**
	 * A logged-in user whose email matches no contact gets an empty 200 (empty
	 * state), not an error — the portal renders an empty dashboard for them.
	 */
	public function test_no_contact_yields_empty_timeline_not_error(): void {
		$orphan = self::factory()->user->create(
			array(
				'role'       => 'subscriber',
				'user_email' => 'orphan@zz.test',
			)
		);

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/portal/timeline',
			array(),
			$orphan
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEmpty(
			$data['data'] ?? array(),
			'A user with no contact must get an empty timeline.'
		);
		$this->assertSame( 0, (int) ( $data['total'] ?? 0 ) );
	}

	/**
	 * SECURITY: support staff (an admin who is not also a contact) is blocked from
	 * the customer portal with 403.
	 */
	public function test_staff_without_contact_is_blocked(): void {
		$admin = self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_email' => 'staffonly@zz.test',
			)
		);

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/portal/bootstrap',
			array(),
			$admin
		);

		$this->assertSame( 403, $response->get_status() );
	}
}
