<?php
/**
 * Integration tests for the support write abilities.
 *
 * These exist because the structural tests in
 * `phpunit/tests/Core/Abilities/SupportWriteSafetyTest.php` assert only on the
 * definition arrays — they never invoke an execute_callback. That gap was proven
 * by swapping `add_reply()` and `add_note()` inside
 * {@see \DoubleScale\Modules\Support\Abilities\SupportAbilities::append_to_thread()},
 * which makes "add an internal note" email the customer and makes "reply"
 * silent. The entire fast suite still passed. Nothing here would.
 *
 * So these tests run the real callbacks against a real database and assert the
 * OBSERVABLE consequence: which activity type landed on the ticket, and whether
 * a mail actually left. `wp_mail` is intercepted, never delivered.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Support\Abilities\SupportAbilities;
use DoubleScale\Modules\Smtp\Settings as SmtpSettings;
use DoubleScale\Modules\Support\Models\MailboxModel;
use DoubleScale\Modules\Support\Models\TicketModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class SupportWriteAbilitiesTest extends IntegrationTestCase {

	/**
	 * Mails intercepted during a test, newest last.
	 *
	 * Static so the capturing filter survives WP_UnitTestCase's filter restore.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $sent_mail = array();

	protected function setUp(): void {
		parent::setUp();

		self::$sent_mail = array();

		// Short-circuit wp_mail entirely: returning a non-null array from this
		// filter makes wp_mail return early without touching the mailer, so a
		// reply test can assert "an email was attempted" without a real send.
		add_filter(
			'pre_wp_mail',
			static function ( $short_circuit, $atts ) {
				self::$sent_mail[] = (array) $atts;
				return true;
			},
			10,
			2
		);

		// Support roles are NOT in Permissions::default_ai_access(), so the
		// ability gate would refuse every call in this file. Widening it here is
		// what a site enabling MCP for its support team would do; the gate
		// itself is asserted separately in test_ability_gate_refuses_*.
		$this->allow_ai_for( array( UserRoles::SUPPORT_MANAGER, UserRoles::SUPPORT_AGENT ) );
	}

	protected function tearDown(): void {
		self::$sent_mail = array();
		parent::tearDown();
	}

	/**
	 * Put a set of roles on the AI allow-list the ability gate consults.
	 *
	 * @param array<int, string> $roles Roles to permit.
	 * @return void
	 */
	private function allow_ai_for( array $roles ): void {
		$settings = (array) get_option( 'doublescale_settings', array() );

		$settings['ai'] = array_merge(
			(array) ( $settings['ai'] ?? array() ),
			array(
				'access' => array(
					'enabled'       => true,
					'allowed_roles' => array_merge( array( UserRoles::ADMINISTRATOR ), $roles ),
				),
			)
		);

		update_option( 'doublescale_settings', $settings );
	}

	/**
	 * Register an SMTP connection that sends from the given address.
	 *
	 * @param string $from_email Address the mailbox sends as.
	 * @return void
	 */
	private function register_smtp_connection( string $from_email ): void {
		$settings = (array) get_option( SmtpSettings::OPTION_NAME, array() );

		$connections = isset( $settings['connections'] ) && is_array( $settings['connections'] )
			? $settings['connections']
			: array();

		$connections[ 'conn-' . md5( $from_email ) ] = array(
			'from_email' => $from_email,
			'from_name'  => 'Support Desk',
			'mailer'     => 'php',
		);

		$settings['connections'] = $connections;

		update_option( SmtpSettings::OPTION_NAME, $settings );
	}

	/**
	 * A ticket assigned to a given agent.
	 *
	 * The mailbox gets a matching SMTP connection deliberately. Outbound support
	 * mail is skipped-and-logged unless an SMTP connection sends from the
	 * mailbox's own From address — there is no fallback to the site default,
	 * because that would deliver under a right-looking From with misaligned
	 * SPF/DKIM. Without this wiring every reply test would pass its activity
	 * assertions and silently prove nothing about the email.
	 *
	 * @param int|null $agent_user_id Assigned agent, or null for unassigned.
	 * @return TicketModel
	 */
	private function make_ticket( $agent_user_id = null ): TicketModel {
		$suffix     = wp_generate_password( 8, false, false );
		$from_email = 'mb-' . $suffix . '@example.test';

		$this->register_smtp_connection( $from_email );

		$mailbox = MailboxModel::create(
			array(
				'box_type' => 'web',
				'data'     => array(
					'name'     => 'Mailbox ' . $suffix,
					'identity' => array( 'from_email' => $from_email ),
				),
			)
		);

		return TicketModel::create(
			array(
				'hash'          => md5( wp_generate_password( 32, false, false ) ),
				'title'         => 'Printer is on fire',
				'status'        => 'open',
				'priority'      => 'normal',
				'mailbox_id'    => (int) $mailbox->id,
				'contact_id'    => $this->make_contact(),
				'agent_user_id' => $agent_user_id,
			)
		);
	}

	/**
	 * Activity rows of a given type recorded against a ticket.
	 *
	 * @param int    $ticket_id Ticket.
	 * @param string $type      Activity type constant.
	 * @return int
	 */
	private function count_activities( int $ticket_id, string $type ): int {
		$rows = ActivityModel::query()->where( 'activity_type', $type )->get();

		$hits = 0;
		foreach ( $rows as $row ) {
			$data = $row->data;
			if ( ! is_array( $data ) ) {
				$data = (array) json_decode( (string) $data, true );
			}
			if ( (int) ( $data['ticket_id'] ?? 0 ) === $ticket_id ) {
				++$hits;
			}
		}

		return $hits;
	}

	/**
	 * THE test the mutation defeated: a note is internal and sends no mail.
	 */
	public function test_add_ticket_note_records_a_note_and_sends_no_email(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$ticket = $this->make_ticket( $manager );

		$result = SupportAbilities::add_ticket_note(
			array(
				'ticket_id' => (int) $ticket->id,
				'content'   => 'Customer sounded upset. Escalating internally.',
			)
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['created'] );
		$this->assertFalse(
			$result['emailed_customer'],
			'A note must report that it did not email the customer.'
		);

		$this->assertSame(
			1,
			$this->count_activities( (int) $ticket->id, ActivityTypes::SUPPORT_NOTE ),
			'add-ticket-note must record a SUPPORT_NOTE activity.'
		);
		$this->assertSame(
			0,
			$this->count_activities( (int) $ticket->id, ActivityTypes::SUPPORT_REPLY ),
			'add-ticket-note must NOT record a customer-visible reply.'
		);
		$this->assertSame(
			array(),
			self::$sent_mail,
			'add-ticket-note must never send mail — this is the whole point of an internal note.'
		);
	}

	/**
	 * The other half of the mutation: a reply is customer-visible and DOES mail.
	 */
	public function test_reply_to_ticket_records_a_reply_and_emails_the_customer(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$ticket = $this->make_ticket( $manager );

		$result = SupportAbilities::reply_to_ticket(
			array(
				'ticket_id' => (int) $ticket->id,
				'content'   => 'We have shipped a replacement, arriving Tuesday.',
			)
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['created'] );
		$this->assertTrue(
			$result['emailed_customer'],
			'A reply must report that the customer was emailed.'
		);

		$this->assertSame(
			1,
			$this->count_activities( (int) $ticket->id, ActivityTypes::SUPPORT_REPLY ),
			'reply-to-ticket must record a SUPPORT_REPLY activity.'
		);
		$this->assertSame(
			0,
			$this->count_activities( (int) $ticket->id, ActivityTypes::SUPPORT_NOTE ),
			'reply-to-ticket must NOT record an internal note.'
		);
		$this->assertNotSame(
			array(),
			self::$sent_mail,
			'reply-to-ticket must actually attempt an email to the customer.'
		);
	}

	/**
	 * The two must never be confusable. Asserted as a pair in one test so a
	 * swapped wiring fails here even if someone "fixes" a single-sided test by
	 * flipping its expectation.
	 */
	public function test_note_and_reply_are_not_interchangeable(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$note_ticket  = $this->make_ticket( $manager );
		$reply_ticket = $this->make_ticket( $manager );

		SupportAbilities::add_ticket_note(
			array(
				'ticket_id' => (int) $note_ticket->id,
				'content'   => 'internal only',
			)
		);
		$mail_after_note = count( self::$sent_mail );

		SupportAbilities::reply_to_ticket(
			array(
				'ticket_id' => (int) $reply_ticket->id,
				'content'   => 'customer facing',
			)
		);
		$mail_after_reply = count( self::$sent_mail );

		$this->assertSame( 0, $mail_after_note, 'The note leaked an email to the customer.' );
		$this->assertGreaterThan(
			$mail_after_note,
			$mail_after_reply,
			'The reply failed to email the customer.'
		);

		// And the activity types must be the right way round.
		$this->assertSame( 1, $this->count_activities( (int) $note_ticket->id, ActivityTypes::SUPPORT_NOTE ) );
		$this->assertSame( 1, $this->count_activities( (int) $reply_ticket->id, ActivityTypes::SUPPORT_REPLY ) );
	}

	/**
	 * Gate 3 on a write: an agent must not reply on someone else's ticket.
	 * A read-side leak shows data; a write-side leak puts words in another
	 * agent's mouth and mails them to a customer.
	 */
	public function test_agent_cannot_reply_to_a_ticket_assigned_to_someone_else(): void {
		$mine   = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_AGENT ) );
		$theirs = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_AGENT ) );

		$ticket = $this->make_ticket( $theirs );

		wp_set_current_user( $mine );

		$result = SupportAbilities::reply_to_ticket(
			array(
				'ticket_id' => (int) $ticket->id,
				'content'   => 'I should not be able to say this.',
			)
		);

		$this->assertTrue( is_wp_error( $result ), 'Replying to another agent’s ticket must be refused.' );
		$this->assertSame( 'doublescale_forbidden', $result->get_error_code() );
		$this->assertSame(
			0,
			$this->count_activities( (int) $ticket->id, ActivityTypes::SUPPORT_REPLY ),
			'A refused reply must leave no activity behind.'
		);
		$this->assertSame( array(), self::$sent_mail, 'A refused reply must send no mail.' );
	}

	/**
	 * The same boundary for notes.
	 */
	public function test_agent_cannot_note_on_a_ticket_assigned_to_someone_else(): void {
		$mine   = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_AGENT ) );
		$theirs = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_AGENT ) );

		$ticket = $this->make_ticket( $theirs );

		wp_set_current_user( $mine );

		$result = SupportAbilities::add_ticket_note(
			array(
				'ticket_id' => (int) $ticket->id,
				'content'   => 'not my ticket',
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_forbidden', $result->get_error_code() );
	}

	/**
	 * A manager sees every ticket, so the same call that a scoped agent is
	 * refused must succeed for them — otherwise the refusal above could be
	 * passing for the wrong reason.
	 */
	public function test_manager_may_reply_to_an_unassigned_ticket(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		$ticket  = $this->make_ticket( null );

		wp_set_current_user( $manager );

		$result = SupportAbilities::reply_to_ticket(
			array(
				'ticket_id' => (int) $ticket->id,
				'content'   => 'Taking this one.',
			)
		);

		$this->assertIsArray( $result, 'A support manager must be able to reply to any ticket.' );
		$this->assertTrue( $result['created'] );
	}

	/**
	 * Empty content must be refused BEFORE anything is written, so a blank
	 * reply cannot reach a customer as an empty email.
	 */
	public function test_blank_content_is_refused_and_writes_nothing(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$ticket = $this->make_ticket( $manager );

		$result = SupportAbilities::reply_to_ticket(
			array(
				'ticket_id' => (int) $ticket->id,
				'content'   => '',
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame(
			0,
			$this->count_activities( (int) $ticket->id, ActivityTypes::SUPPORT_REPLY )
		);
		$this->assertSame( array(), self::$sent_mail );
	}

	/**
	 * A missing ticket is a 404, not a crash and not a silent success.
	 */
	public function test_unknown_ticket_is_refused(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$result = SupportAbilities::reply_to_ticket(
			array(
				'ticket_id' => 99999999,
				'content'   => 'hello?',
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_not_found', $result->get_error_code() );
		$this->assertSame( array(), self::$sent_mail );
	}

	/**
	 * update-ticket applies the fields it is given.
	 */
	public function test_update_ticket_changes_status_and_priority(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$ticket = $this->make_ticket( $manager );

		$result = SupportAbilities::update_ticket(
			array(
				'ticket_id' => (int) $ticket->id,
				'status'    => 'closed',
				'priority'  => 'high',
			)
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['updated'] );

		$fresh = TicketModel::query()->where( 'id', (int) $ticket->id )->first();
		$this->assertSame( 'closed', (string) $fresh->status );
		$this->assertSame( 'high', (string) $fresh->priority );
	}

	/**
	 * Reassignment is a separate permission from working your own tickets.
	 * Without this an agent could hand their ticket to anyone.
	 */
	public function test_agent_cannot_reassign_a_ticket(): void {
		$agent = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_AGENT ) );
		$other = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_AGENT ) );

		$ticket = $this->make_ticket( $agent );

		wp_set_current_user( $agent );

		$result = SupportAbilities::update_ticket(
			array(
				'ticket_id'     => (int) $ticket->id,
				'agent_user_id' => $other,
			)
		);

		$this->assertTrue( is_wp_error( $result ), 'An agent must not be able to reassign tickets.' );
		$this->assertSame( 'doublescale_forbidden', $result->get_error_code() );

		$fresh = TicketModel::query()->where( 'id', (int) $ticket->id )->first();
		$this->assertSame(
			$agent,
			(int) $fresh->agent_user_id,
			'A refused reassignment must leave the original agent in place.'
		);
	}

	/**
	 * An update naming no editable field is a 400, not a silent no-op that an
	 * agent would report to the user as a successful change.
	 */
	public function test_update_with_no_fields_is_refused(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$ticket = $this->make_ticket( $manager );

		$result = SupportAbilities::update_ticket( array( 'ticket_id' => (int) $ticket->id ) );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_nothing_to_update', $result->get_error_code() );
	}

	/**
	 * An invalid status must be named, with the accepted values, rather than
	 * written through to a column the dashboard cannot render.
	 */
	public function test_invalid_status_is_refused_with_the_allowed_values(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SUPPORT_MANAGER ) );
		wp_set_current_user( $manager );

		$ticket = $this->make_ticket( $manager );

		$result = SupportAbilities::update_ticket(
			array(
				'ticket_id' => (int) $ticket->id,
				'status'    => 'banana',
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_invalid_value', $result->get_error_code() );

		$fresh = TicketModel::query()->where( 'id', (int) $ticket->id )->first();
		$this->assertSame( 'open', (string) $fresh->status, 'A rejected status must not be written.' );
	}
}
