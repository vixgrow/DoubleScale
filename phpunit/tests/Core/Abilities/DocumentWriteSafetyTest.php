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
	 * Sending is a human decision; nothing here may trigger it.
	 *
	 * @dataProvider document_write_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_document_writes_do_not_reach_the_customer( string $name, array $definition ): void {
		$this->assertNotSame( '', $name );

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
}
