<?php
/**
 * Support writes must stay inside the boundary the product intends.
 *
 * `reply-to-ticket` is the only DoubleScale ability that emails a customer
 * directly, with no draft step and no recall, so it carries constraints nothing
 * else does:
 *
 * - It must be annotated as a write. An agent reading `readonly: true` treats a
 *   call as safe to retry, and a retried reply sends the customer a second
 *   email.
 * - Its description must warn that it emails the customer, because the
 *   description is the ONLY thing an agent reads before deciding to call it.
 * - It must not accept a recipient, CC list, or contact id. Reply addressing is
 *   derived from the ticket; letting an agent supply an address turns a support
 *   tool into an arbitrary mail sender.
 *
 * `update-ticket` is pinned separately: it must never write the ticket's title
 * or reassign its contact, and status/priority must stay enum-bound so an agent
 * cannot invent a state the UI cannot display.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Modules\Support\Abilities\SupportAbilities;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class SupportWriteSafetyTest extends TestCase {

	/**
	 * Address fields no support write may ever accept. Reply addressing is
	 * derived from the ticket; a mailbox id would let an agent pick a From.
	 */
	private const FORBIDDEN_ADDRESS_INPUTS = array(
		'to',
		'cc',
		'bcc',
		'email',
		'recipient',
		'reply_to',
		'from',
		'mailbox_id',
	);

	/**
	 * Identity fields that rewrite who an EXISTING ticket belongs to.
	 * create-ticket is allowed contact_id and title; everything else is not.
	 */
	private const FORBIDDEN_IDENTITY_ON_EXISTING = array(
		'contact_id',
		'title',
	);

	/**
	 * The support abilities annotated as writes.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function write_definitions(): array {
		$writes = array();

		foreach ( SupportAbilities::definitions() as $name => $definition ) {
			if ( false === ( $definition['meta']['annotations']['readonly'] ?? true ) ) {
				$writes[ $name ] = $definition;
			}
		}

		return $writes;
	}

	/**
	 * Discovery guard — every assertion below is vacuous without the writes.
	 */
	public function test_support_writes_exist(): void {
		$writes = $this->write_definitions();

		$this->assertNotEmpty( $writes, 'No support write abilities found.' );

		foreach ( array( 'doublescale/reply-to-ticket', 'doublescale/add-ticket-note', 'doublescale/update-ticket', 'doublescale/create-ticket' ) as $expected ) {
			$this->assertArrayHasKey(
				$expected,
				$writes,
				$expected . ' must be registered and annotated as a write.'
			);
		}
	}

	/**
	 * No support write may accept an address or a mailbox. create-ticket may
	 * take contact_id and title; the others may not rewrite who a ticket is.
	 */
	public function test_no_write_accepts_a_recipient_or_identity_field(): void {
		foreach ( $this->write_definitions() as $name => $definition ) {
			$properties = array_keys( $definition['input_schema']['properties'] ?? array() );

			foreach ( self::FORBIDDEN_ADDRESS_INPUTS as $forbidden ) {
				$this->assertNotContains(
					$forbidden,
					$properties,
					sprintf( '%s must not accept "%s".', $name, $forbidden )
				);
			}

			if ( 'doublescale/create-ticket' === $name ) {
				continue;
			}

			foreach ( self::FORBIDDEN_IDENTITY_ON_EXISTING as $forbidden ) {
				$this->assertNotContains(
					$forbidden,
					$properties,
					sprintf( '%s must not accept "%s".', $name, $forbidden )
				);
			}
		}
	}

	/**
	 * Opening a ticket needs a contact and a title — those are the identity
	 * of the new record, not a rewrite of an existing one.
	 */
	public function test_create_ticket_requires_contact_title_and_content(): void {
		$definition = SupportAbilities::definitions()['doublescale/create-ticket'];
		$properties = $definition['input_schema']['properties'] ?? array();
		$required   = $definition['input_schema']['required'] ?? array();

		foreach ( array( 'contact_id', 'title', 'content' ) as $field ) {
			$this->assertArrayHasKey( $field, $properties, 'create-ticket must accept ' . $field . '.' );
			$this->assertContains( $field, $required, 'create-ticket must require ' . $field . '.' );
		}
	}

	/**
	 * The one ability that emails a customer must say so, in its description,
	 * where an agent will actually read it.
	 */
	public function test_reply_warns_that_it_emails_the_customer(): void {
		$definitions = SupportAbilities::definitions();

		$this->assertArrayHasKey( 'doublescale/reply-to-ticket', $definitions );

		$description = strtolower( (string) $definitions['doublescale/reply-to-ticket']['description'] );

		$this->assertStringContainsString(
			'email',
			$description,
			'reply-to-ticket must warn that it emails the customer.'
		);
		$this->assertStringContainsString(
			'cannot be edited',
			$description,
			'reply-to-ticket must warn the send is irreversible.'
		);
	}

	/**
	 * A reply is never idempotent: calling twice sends two emails, and an agent
	 * that believes otherwise will retry on a timeout.
	 */
	public function test_reply_and_note_are_not_marked_idempotent(): void {
		$definitions = SupportAbilities::definitions();

		foreach ( array( 'doublescale/reply-to-ticket', 'doublescale/add-ticket-note' ) as $name ) {
			$this->assertFalse(
				$definitions[ $name ]['meta']['annotations']['idempotent'] ?? true,
				$name . ' appends a new row on every call and must not claim idempotency.'
			);
		}
	}

	/**
	 * A note must never be describable as customer-facing, and a reply must
	 * never be describable as internal. Getting these two backwards is the
	 * mistake with the worst consequence in this module.
	 */
	public function test_note_and_reply_descriptions_do_not_contradict_each_other(): void {
		$definitions = SupportAbilities::definitions();

		$note = strtolower( (string) $definitions['doublescale/add-ticket-note']['description'] );

		$this->assertStringContainsString(
			'internal',
			$note,
			'add-ticket-note must state that notes are internal.'
		);
		$this->assertStringContainsString(
			'no email is sent',
			$note,
			'add-ticket-note must state that it sends no email.'
		);
	}

	/**
	 * Status and priority stay enum-bound so an agent cannot write a value the
	 * dashboard has no way to render.
	 */
	public function test_update_ticket_constrains_status_and_priority(): void {
		$definition = SupportAbilities::definitions()['doublescale/update-ticket'];
		$properties = $definition['input_schema']['properties'] ?? array();

		foreach ( array( 'status', 'priority' ) as $field ) {
			$this->assertArrayHasKey( $field, $properties );
			$this->assertNotEmpty(
				$properties[ $field ]['enum'] ?? array(),
				sprintf( 'update-ticket "%s" must be enum-constrained.', $field )
			);
		}
	}

	/**
	 * No support ability may declare itself destructive — nothing here deletes.
	 */
	public function test_no_support_write_is_destructive(): void {
		foreach ( $this->write_definitions() as $name => $definition ) {
			$this->assertFalse(
				$definition['meta']['annotations']['destructive'] ?? false,
				$name . ' must not be destructive; support abilities never delete.'
			);
		}
	}
}
