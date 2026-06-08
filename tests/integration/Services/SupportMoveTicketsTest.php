<?php
/**
 * Integration tests for bulk-moving tickets between support mailboxes.
 *
 * Covers {@see \DoubleScale\Modules\Support\Rest\Controllers\RestMailboxController::move_tickets()}:
 * move-all, subset move, source-mailbox scoping (security), validation errors,
 * permission gate, and the `doublescale_support_tickets_moved` action hook.
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Modules\Support\Models\MailboxModel;
use DoubleScale\Modules\Support\Models\TicketModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class SupportMoveTicketsTest extends IntegrationTestCase {

	/**
	 * Captured hook args — static so closures survive WP_UnitTestCase filter restore.
	 *
	 * @var array{source: int|null, dest: int|null, moved: int|null}
	 */
	private static $hook_captured = array(
		'source' => null,
		'dest'   => null,
		'moved'  => null,
	);

	/**
	 * Create a mailbox row via the model so boot events populate slug/email.
	 *
	 * @param array<string, mixed> $overrides Column overrides.
	 * @return int Mailbox ID.
	 */
	private function make_mailbox( array $overrides = array() ) {
		$suffix = wp_generate_password( 8, false, false );

		$defaults = array(
			'box_type' => 'web',
			'data'     => array(
				'name'     => 'Mailbox ' . $suffix,
				'identity' => array(
					'from_email' => 'mb-' . $suffix . '@example.test',
				),
			),
		);

		$mailbox = MailboxModel::create( array_merge( $defaults, $overrides ) );

		return (int) $mailbox->id;
	}

	/**
	 * Create a ticket on a mailbox (requires a contact).
	 *
	 * @param int                  $mailbox_id Source mailbox.
	 * @param array<string, mixed> $overrides  Column overrides.
	 * @return int Ticket ID.
	 */
	private function make_ticket( int $mailbox_id, array $overrides = array() ) {
		$contact_id = isset( $overrides['contact_id'] ) ? (int) $overrides['contact_id'] : $this->make_contact();
		unset( $overrides['contact_id'] );

		$defaults = array(
			'hash'       => md5( wp_generate_password( 32, false, false ) ),
			'title'      => 'Test ticket',
			'status'     => 'open',
			'priority'   => 'normal',
			'mailbox_id' => $mailbox_id,
			'contact_id' => $contact_id,
		);

		$ticket = TicketModel::create( array_merge( $defaults, $overrides ) );

		return (int) $ticket->id;
	}

	/**
	 * POST move-tickets for a source mailbox.
	 *
	 * @param int                  $source_id Source mailbox ID.
	 * @param array<string, mixed> $body      JSON body.
	 * @param int|null             $user_id   Authenticated user.
	 * @return \WP_REST_Response
	 */
	private function move_tickets( int $source_id, array $body, $user_id = null ) {
		return $this->dispatch_rest(
			'POST',
			"/doublescale/v1/support/mailboxes/{$source_id}/move-tickets",
			$body,
			$user_id
		);
	}

	public function test_move_all_tickets_to_destination() {
		$admin   = $this->make_admin_user();
		$source  = $this->make_mailbox();
		$dest    = $this->make_mailbox();
		$ticket1 = $this->make_ticket( $source );
		$ticket2 = $this->make_ticket( $source );
		$ticket3 = $this->make_ticket( $source );

		$response = $this->move_tickets( $source, array( 'new_box_id' => $dest ), $admin );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 3, $response->get_data()['moved'] );

		$this->assert_table_row_count( 'support_tickets', 0, "mailbox_id = {$source}" );
		$this->assert_table_row_count( 'support_tickets', 3, "mailbox_id = {$dest}" );

		$this->assertSame( $dest, (int) TicketModel::find( $ticket1 )->mailbox_id );
		$this->assertSame( $dest, (int) TicketModel::find( $ticket2 )->mailbox_id );
		$this->assertSame( $dest, (int) TicketModel::find( $ticket3 )->mailbox_id );
	}

	public function test_subset_move_moves_only_named_tickets() {
		$admin  = $this->make_admin_user();
		$source = $this->make_mailbox();
		$dest   = $this->make_mailbox();

		$keep   = $this->make_ticket( $source );
		$move_a = $this->make_ticket( $source );
		$move_b = $this->make_ticket( $source );

		$response = $this->move_tickets(
			$source,
			array(
				'new_box_id'  => $dest,
				'ticket_ids'  => array( $move_a, $move_b ),
			),
			$admin
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 2, $response->get_data()['moved'] );

		$this->assert_table_row_count( 'support_tickets', 1, "mailbox_id = {$source}" );
		$this->assert_table_row_count( 'support_tickets', 2, "mailbox_id = {$dest}" );
		$this->assertSame( $source, (int) TicketModel::find( $keep )->mailbox_id );
		$this->assertSame( $dest, (int) TicketModel::find( $move_a )->mailbox_id );
		$this->assertSame( $dest, (int) TicketModel::find( $move_b )->mailbox_id );
	}

	public function test_subset_cannot_move_tickets_from_another_mailbox() {
		$admin   = $this->make_admin_user();
		$source  = $this->make_mailbox();
		$other   = $this->make_mailbox();
		$dest    = $this->make_mailbox();
		$on_src  = $this->make_ticket( $source );
		$foreign = $this->make_ticket( $other );

		$response = $this->move_tickets(
			$source,
			array(
				'new_box_id' => $dest,
				'ticket_ids' => array( $on_src, $foreign ),
			),
			$admin
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 1, $response->get_data()['moved'] );

		$this->assertSame( $dest, (int) TicketModel::find( $on_src )->mailbox_id );
		$this->assertSame( $other, (int) TicketModel::find( $foreign )->mailbox_id );
		$this->assert_table_row_count( 'support_tickets', 0, "mailbox_id = {$source}" );
		$this->assert_table_row_count( 'support_tickets', 1, "mailbox_id = {$dest}" );
		$this->assert_table_row_count( 'support_tickets', 1, "mailbox_id = {$other}" );
	}

	public function test_returns_404_for_missing_source_mailbox() {
		$admin = $this->make_admin_user();
		$dest  = $this->make_mailbox();

		$response = $this->move_tickets(
			999999,
			array( 'new_box_id' => $dest ),
			$admin
		);

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'not_found', $response->get_data()['code'] );
	}

	/**
	 * @dataProvider invalid_destination_provider
	 *
	 * @param array<string, mixed> $body Request body (may omit new_box_id).
	 */
	public function test_rejects_invalid_destination( array $body ) {
		$admin  = $this->make_admin_user();
		$source = $this->make_mailbox();

		$response = $this->move_tickets( $source, $body, $admin );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_destination', $response->get_data()['code'] );
	}

	/**
	 * @return array<string, array{0: array<string, mixed>}>
	 */
	public function invalid_destination_provider() {
		return array(
			'missing new_box_id' => array( array() ),
			'zero new_box_id'    => array( array( 'new_box_id' => 0 ) ),
			'nonexistent dest'   => array( array( 'new_box_id' => 999999 ) ),
		);
	}

	public function test_rejects_invalid_destination_same_as_source() {
		$admin  = $this->make_admin_user();
		$source = $this->make_mailbox();

		$response = $this->move_tickets(
			$source,
			array( 'new_box_id' => $source ),
			$admin
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_destination', $response->get_data()['code'] );
	}

	public function test_subscriber_cannot_move_tickets() {
		$subscriber = $this->make_subscriber_user();
		$source     = $this->make_mailbox();
		$dest       = $this->make_mailbox();
		$this->make_ticket( $source );

		$response = $this->move_tickets(
			$source,
			array( 'new_box_id' => $dest ),
			$subscriber
		);

		$this->assertSame( 403, $response->get_status() );
		$this->assert_table_row_count( 'support_tickets', 1, "mailbox_id = {$source}" );
		$this->assert_table_row_count( 'support_tickets', 0, "mailbox_id = {$dest}" );
	}

	public function test_fires_doublescale_support_tickets_moved_action() {
		$admin = $this->make_admin_user();

		self::$hook_captured = array(
			'source' => null,
			'dest'   => null,
			'moved'  => null,
		);

		add_action(
			'doublescale_support_tickets_moved',
			function ( $source_id, $dest_id, $moved ) {
				self::$hook_captured['source'] = (int) $source_id;
				self::$hook_captured['dest']   = (int) $dest_id;
				self::$hook_captured['moved']  = (int) $moved;
			},
			10,
			3
		);

		$source = $this->make_mailbox();
		$dest   = $this->make_mailbox();
		$this->make_ticket( $source );
		$this->make_ticket( $source );

		$response = $this->move_tickets( $source, array( 'new_box_id' => $dest ), $admin );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 2, $response->get_data()['moved'] );
		$this->assertSame( $source, self::$hook_captured['source'] );
		$this->assertSame( $dest, self::$hook_captured['dest'] );
		$this->assertSame( 2, self::$hook_captured['moved'] );
	}
}
