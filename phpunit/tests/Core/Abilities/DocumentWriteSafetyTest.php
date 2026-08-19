<?php
/**
 * Sales documents must never expose a financial field to an agent.
 *
 * `line_items`, `discount_type`, `discount_value`, and `adjustment` all feed
 * TotalsCalculator inside InvoiceModel/ProposalModel `saving()`, so writing any
 * of them silently rewrites subtotal/total_tax/total — changing what a customer
 * owes on a document that may already be in their inbox, with no undo anywhere
 * in the product. `status` is equally off-limits: transitions like sent/paid
 * fire automation triggers and reach customers.
 *
 * This pins the allow-list at the schema layer so a future edit cannot widen it
 * without the test failing.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Modules\Documents\Abilities\DocumentAbilities;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class DocumentWriteSafetyTest extends TestCase {

	/**
	 * Fields that move money or reach a customer.
	 */
	private const FORBIDDEN = array(
		'line_items',
		'subtotal',
		'total',
		'total_tax',
		'discount_type',
		'discount_value',
		'adjustment',
		'amount_paid',
		'status',
		'contact_id',
		'currency',
		'sent_at',
	);

	/**
	 * @return array<string, array{0: string, 1: array<string, mixed>}>
	 */
	public function document_write_provider(): array {
		$out = array();
		foreach ( DocumentAbilities::definitions() as $name => $definition ) {
			$readonly = $definition['meta']['annotations']['readonly'] ?? true;
			if ( false === $readonly ) {
				$out[ $name ] = array( $name, $definition );
			}
		}

		// Fail loudly rather than silently passing if the writes disappear.
		if ( array() === $out ) {
			$out['no-document-writes-found'] = array( '', array() );
		}

		return $out;
	}

	/**
	 * @dataProvider document_write_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_no_financial_field_is_writable( string $name, array $definition ): void {
		$this->assertNotSame( '', $name, 'Expected at least one document write ability.' );

		$properties = array_keys( $definition['input_schema']['properties'] ?? array() );

		foreach ( self::FORBIDDEN as $field ) {
			$this->assertNotContains(
				$field,
				$properties,
				$name . ' exposes "' . $field . '", which changes money or reaches the customer.'
			);
		}
	}

	/**
	 * Abilities allowed to contact a customer, and therefore exempt from the
	 * "edits never send" rule below.
	 *
	 * Deliberately an explicit allow-list rather than a pattern: adding a new
	 * sending ability should require editing this test, so the decision to give
	 * an agent a channel to a customer is always a conscious one.
	 */
	private const MAY_SEND = array(
		'doublescale/send-invoice',
	);

	/**
	 * EDITING a document must never reach the customer.
	 *
	 * Sending is now a first-class ability of its own (send-invoice), which is
	 * exactly why editing must stay silent: a user who asks to correct a due
	 * date has not asked to re-notify the customer, and an edit that mailed as
	 * a side effect would do that with no way back.
	 *
	 * @dataProvider document_write_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_document_edits_do_not_reach_the_customer( string $name, array $definition ): void {
		$this->assertNotSame( '', $name );

		if ( in_array( $name, self::MAY_SEND, true ) ) {
			$this->addToAssertionCount( 1 );
			return;
		}

		$annotations = $definition['meta']['annotations'] ?? array();

		$this->assertFalse(
			$annotations['openWorldHint'] ?? false,
			$name . ' claims to reach outside the site; document edits must not send anything.'
		);
		$this->assertStringNotContainsStringIgnoringCase(
			'send',
			(string) ( $definition['label'] ?? '' ),
			$name . ' is labelled as if it sends.'
		);
	}

	/**
	 * An ability that DOES email a customer carries obligations of its own.
	 *
	 * A send that an agent believes is retryable is the failure that matters
	 * here: on a timeout it calls again and the customer receives the invoice
	 * twice. The description is the only warning an agent reads before deciding.
	 *
	 * @dataProvider document_write_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_sending_abilities_declare_themselves_honestly( string $name, array $definition ): void {
		if ( ! in_array( $name, self::MAY_SEND, true ) ) {
			$this->addToAssertionCount( 1 );
			return;
		}

		$annotations = $definition['meta']['annotations'] ?? array();

		$this->assertTrue(
			$annotations['openWorldHint'] ?? false,
			$name . ' emails a customer and must declare openWorldHint.'
		);
		$this->assertFalse(
			$annotations['idempotent'] ?? true,
			$name . ' sends a fresh email on every call and must not claim idempotency.'
		);
		$this->assertFalse(
			$annotations['readonly'] ?? true,
			$name . ' must be annotated as a write.'
		);

		$description = strtolower( (string) ( $definition['description'] ?? '' ) );
		$this->assertStringContainsString(
			'email',
			$description,
			$name . ' must state that it emails the customer.'
		);

		// The recipient comes from the document, never from the agent.
		$properties = array_keys( $definition['input_schema']['properties'] ?? array() );
		foreach ( array( 'to', 'cc', 'bcc', 'email', 'recipient', 'reply_to' ) as $forbidden ) {
			$this->assertNotContains(
				$forbidden,
				$properties,
				$name . ' must not let the caller choose a recipient.'
			);
		}
	}
}
