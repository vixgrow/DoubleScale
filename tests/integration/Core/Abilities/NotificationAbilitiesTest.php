<?php
/**
 * Integration tests for the notification abilities.
 *
 * The guarantee worth executing here is that there is NO cross-user read path.
 * Notifications are per-recipient, the abilities take no `user_id` input, and
 * `forUser()` is applied unconditionally — but "the input schema has no user_id"
 * is a structural fact, not proof that the query is scoped. Only running the
 * callback with two users' rows in the table proves it.
 *
 * The other behaviour under test is the empty-bell case. A user who has switched
 * the in-app bell off collects nothing, so a bare empty list would tell them they
 * have no notifications when in fact none are being gathered. The abilities return
 * a `reason` instead, and that string is the only thing standing between the agent
 * and a confidently wrong answer.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Modules\Notifications\Abilities\NotificationAbilities;
use DoubleScale\Modules\Notifications\Models\NotificationModel;
use DoubleScale\Modules\Notifications\Services\NotificationCategories;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class NotificationAbilitiesTest extends IntegrationTestCase {

	/**
	 * Preference meta key used by NotificationPreferences.
	 */
	private const PREFS_META = '_doublescale_notification_preferences';

	/**
	 * Subcategories these tests switch the bell on for.
	 */
	private const SUBCATS = array(
		NotificationCategories::SUPPORT_TICKET_ASSIGNED,
		NotificationCategories::PIPELINE_DEAL_WON_LOST,
	);

	/**
	 * Restrict the in-app bell to an explicit set of subcategories.
	 *
	 * The bell is ON for every subcategory by default, so this NARROWS rather than
	 * enables — which is what makes the "hidden category" test meaningful.
	 *
	 * @param int                $user_id  User.
	 * @param array<int, string> $subcats  Subcategories to enable.
	 * @return void
	 */
	private function enable_bell( int $user_id, array $subcats = self::SUBCATS ): void {
		$subcategories = array();
		foreach ( $subcats as $subcat ) {
			$subcategories[ $subcat ] = array( 'bell' => true );
		}

		update_user_meta(
			$user_id,
			self::PREFS_META,
			array(
				'channels'      => array( 'bell' => true ),
				'subcategories' => $subcategories,
			)
		);
	}

	/**
	 * Switch the in-app bell off entirely for a user.
	 *
	 * `get_bell_enabled_subcategories()` short-circuits on the global channel
	 * flag, so this is the state a user reaches by turning the bell off.
	 *
	 * @param int $user_id User.
	 * @return void
	 */
	private function disable_bell( int $user_id ): void {
		update_user_meta(
			$user_id,
			self::PREFS_META,
			array(
				'channels'      => array( 'bell' => false ),
				'subcategories' => array(),
			)
		);
	}

	/**
	 * A notification addressed to one user.
	 *
	 * @param int    $user_id     Recipient.
	 * @param string $subcategory Subcategory key.
	 * @param string $title       Title stored in the data blob.
	 * @param bool   $is_read     Read state.
	 * @return int Notification id.
	 */
	private function make_notification( int $user_id, string $subcategory, string $title, bool $is_read = false ): int {
		$notification = NotificationModel::create(
			array(
				'user_id'     => $user_id,
				'subcategory' => $subcategory,
				'data'        => array(
					'title'   => $title,
					'message' => 'Body of ' . $title,
				),
				'is_read'     => $is_read ? 1 : 0,
				'created_at'  => current_time( 'mysql', true ),
			)
		);

		return (int) $notification->id;
	}

	/**
	 * A user who can reach the abilities at all (needs `doublescale_access`).
	 *
	 * @return int
	 */
	private function make_crm_user(): int {
		$user_id = self::factory()->user->create( array( 'role' => 'doublescale_support_agent' ) );
		$this->enable_bell( $user_id );

		return $user_id;
	}

	// -----------------------------------------------------------------
	// The isolation guarantee
	// -----------------------------------------------------------------

	/**
	 * THE test: one user must never see another's notifications. There is no
	 * user_id input to abuse, so this proves the query itself is scoped.
	 */
	public function test_a_user_never_sees_another_users_notifications(): void {
		$mine   = $this->make_crm_user();
		$theirs = $this->make_crm_user();

		$this->make_notification( $mine, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'For me' );
		$this->make_notification( $theirs, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'For them' );

		wp_set_current_user( $mine );

		$result = NotificationAbilities::list_my_notifications( array() );

		$this->assertCount( 1, $result['items'], 'Notifications must never cross users.' );
		$this->assertSame( 'For me', $result['items'][0]['title'] );
	}

	/**
	 * The same isolation in the summary — a count that included other people's
	 * unread rows would send a user hunting for notifications they cannot open.
	 */
	public function test_summary_counts_only_your_own_unread(): void {
		$mine   = $this->make_crm_user();
		$theirs = $this->make_crm_user();

		$this->make_notification( $mine, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Mine A' );
		$this->make_notification( $theirs, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Theirs A' );
		$this->make_notification( $theirs, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Theirs B' );

		wp_set_current_user( $mine );

		$result = NotificationAbilities::get_notification_summary( array() );

		$this->assertSame( 1, $result['unread_total'] );
	}

	/**
	 * A `user_id` in the input must be inert. Even though the schema does not
	 * declare it, an agent may pass one hopefully — and it must not be honoured.
	 */
	public function test_a_supplied_user_id_is_ignored(): void {
		$mine   = $this->make_crm_user();
		$theirs = $this->make_crm_user();

		$this->make_notification( $theirs, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'For them' );

		wp_set_current_user( $mine );

		$result = NotificationAbilities::list_my_notifications( array( 'user_id' => $theirs ) );

		$this->assertSame(
			array(),
			$result['items'],
			'Passing another user id must not read their notifications.'
		);
	}

	// -----------------------------------------------------------------
	// The empty-bell case
	// -----------------------------------------------------------------

	/**
	 * With no bell-enabled category, the list must explain itself rather than
	 * reading as "you have no notifications".
	 */
	public function test_empty_bell_explains_itself_in_the_listing(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'doublescale_support_agent' ) );
		$this->disable_bell( $user_id );

		// A row exists, but the bell channel is switched off.
		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Unreachable' );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::list_my_notifications( array() );

		$this->assertSame( array(), $result['items'] );
		$this->assertArrayHasKey(
			'reason',
			$result,
			'An empty bell must say why, or an agent reports "no notifications" as fact.'
		);
		$this->assertStringContainsString( 'bell', strtolower( (string) $result['reason'] ) );
	}

	/**
	 * The same explanation on the summary.
	 */
	public function test_empty_bell_explains_itself_in_the_summary(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'doublescale_support_agent' ) );
		$this->disable_bell( $user_id );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::get_notification_summary( array() );

		$this->assertSame( 0, $result['unread_total'] );
		$this->assertArrayHasKey( 'reason', $result );
	}

	/**
	 * A category the user has NOT enabled must stay hidden, so the agent's view
	 * matches the dashboard bell exactly.
	 */
	public function test_categories_without_the_bell_enabled_are_hidden(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'doublescale_support_agent' ) );
		$this->enable_bell( $user_id, array( NotificationCategories::SUPPORT_TICKET_ASSIGNED ) );

		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Shown' );
		$this->make_notification( $user_id, NotificationCategories::PIPELINE_DEAL_WON_LOST, 'Hidden' );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::list_my_notifications( array() );

		$this->assertCount( 1, $result['items'] );
		$this->assertSame( 'Shown', $result['items'][0]['title'] );
	}

	// -----------------------------------------------------------------
	// Listing behaviour
	// -----------------------------------------------------------------

	/**
	 * Newest first.
	 */
	public function test_notifications_are_newest_first(): void {
		$user_id = $this->make_crm_user();

		$old = NotificationModel::create(
			array(
				'user_id'     => $user_id,
				'subcategory' => NotificationCategories::SUPPORT_TICKET_ASSIGNED,
				'data'        => array( 'title' => 'Older' ),
				'is_read'     => 0,
				'created_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '-5 days' ) ),
			)
		);
		$this->assertNotEmpty( $old->id );

		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Newer' );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::list_my_notifications( array() );

		$this->assertSame( 'Newer', $result['items'][0]['title'] );
		$this->assertSame( 'Older', $result['items'][1]['title'] );
	}

	/**
	 * `unread_only` withholds the ones already seen.
	 */
	public function test_unread_only_filter_excludes_read_notifications(): void {
		$user_id = $this->make_crm_user();

		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Unseen', false );
		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Seen', true );

		wp_set_current_user( $user_id );

		$all    = NotificationAbilities::list_my_notifications( array() );
		$unread = NotificationAbilities::list_my_notifications( array( 'unread_only' => true ) );

		$this->assertSame( 2, $all['total'] );
		$this->assertSame( 1, $unread['total'] );
		$this->assertSame( 'Unseen', $unread['items'][0]['title'] );
	}

	/**
	 * The total must reflect every match, not the page — and the count query and
	 * the fetch query are built separately in the implementation, which is
	 * exactly where a filter can be applied to one and not the other.
	 */
	public function test_paging_total_respects_the_unread_filter(): void {
		$user_id = $this->make_crm_user();

		foreach ( range( 1, 4 ) as $i ) {
			$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Unread ' . $i, false );
		}
		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Read one', true );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::list_my_notifications(
			array(
				'unread_only' => true,
				'limit'       => 2,
			)
		);

		$this->assertCount( 2, $result['items'], 'The page must honour the limit.' );
		$this->assertSame(
			4,
			$result['total'],
			'The total must count unread rows only — the count and fetch queries must agree.'
		);
		$this->assertTrue( $result['has_more'] );
	}

	/**
	 * The read state is reported, so an agent can say what is new.
	 */
	public function test_read_state_is_reported(): void {
		$user_id = $this->make_crm_user();

		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Seen', true );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::list_my_notifications( array() );

		$this->assertTrue( $result['items'][0]['is_read'] );
	}

	// -----------------------------------------------------------------
	// Summary
	// -----------------------------------------------------------------

	/**
	 * The breakdown groups by category so a user can see where the noise is.
	 */
	public function test_summary_groups_unread_by_category(): void {
		$user_id = $this->make_crm_user();

		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'T1' );
		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'T2' );
		$this->make_notification( $user_id, NotificationCategories::PIPELINE_DEAL_WON_LOST, 'D1' );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::get_notification_summary( array() );

		$this->assertSame( 3, $result['unread_total'] );
		$this->assertSame( 2, $result['by_category'][ NotificationCategories::SUPPORT_TICKET_ASSIGNED ] );
		$this->assertSame( 1, $result['by_category'][ NotificationCategories::PIPELINE_DEAL_WON_LOST ] );
	}

	/**
	 * Already-read rows must not be counted as outstanding.
	 */
	public function test_summary_ignores_read_notifications(): void {
		$user_id = $this->make_crm_user();

		$this->make_notification( $user_id, NotificationCategories::SUPPORT_TICKET_ASSIGNED, 'Handled', true );

		wp_set_current_user( $user_id );

		$result = NotificationAbilities::get_notification_summary( array() );

		$this->assertSame( 0, $result['unread_total'] );
	}
}
