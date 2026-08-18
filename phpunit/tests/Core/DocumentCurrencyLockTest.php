<?php
/**
 * Currency lock: sent documents, and documents holding settled value.
 *
 * Sending is not the only thing that fixes a currency. Money can move without a
 * send (manual payment, portal payment, gateway charge, credit applied), and
 * once it has, relabelling the document restates settled value — payments have
 * no currency column of their own and inherit the parent's.
 *
 * Invoices record settled value in `amount_paid`; credit notes use
 * `amount_applied`. Checking only `amount_paid` meant the guard could never fire
 * for a credit note, so an unsent note with credit already applied could be
 * flipped from USD to EUR through the REST API.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Services\DocumentCurrency;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 2 ) . '/RestApiEndpointTestStubs.php';

final class DocumentCurrencyLockTest extends TestCase {

	public function test_unsent_untouched_document_is_editable(): void {
		$doc = $this->doc( 'USD', null, 0.0 );

		$this->assertNull( DocumentCurrency::reject_if_locked( $doc, 'EUR', true ) );
	}

	public function test_sent_document_is_locked(): void {
		$doc = $this->doc( 'USD', '2024-01-01 00:00:00', 0.0 );

		$error = DocumentCurrency::reject_if_locked( $doc, 'EUR' );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'currency_locked', $error->get_error_code() );
	}

	public function test_paid_invoice_is_locked_even_when_unsent(): void {
		$invoice = $this->doc( 'USD', null, 100.0 );

		$error = DocumentCurrency::reject_if_locked( $invoice, 'EUR', true );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'currency_locked', $error->get_error_code() );
	}

	/**
	 * The regression this test exists for: credit notes settle into
	 * `amount_applied`, not `amount_paid`.
	 */
	public function test_applied_credit_note_is_locked_even_when_unsent(): void {
		$note                 = $this->doc( 'USD', null, 0.0 );
		$note->amount_applied = 40.0;

		$error = DocumentCurrency::reject_if_locked( $note, 'EUR', true );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'currency_locked', $error->get_error_code() );
	}

	public function test_unapplied_credit_note_is_editable(): void {
		$note                 = $this->doc( 'USD', null, 0.0 );
		$note->amount_applied = 0.0;

		$this->assertNull( DocumentCurrency::reject_if_locked( $note, 'EUR', true ) );
	}

	/**
	 * Re-submitting the value the document already has must not 400 — ordinary
	 * edit forms post every field back.
	 */
	public function test_same_value_write_is_allowed_on_a_locked_document(): void {
		$doc = $this->doc( 'USD', '2024-01-01 00:00:00', 100.0 );

		$this->assertNull( DocumentCurrency::reject_if_locked( $doc, 'USD', true ) );
		$this->assertNull( DocumentCurrency::reject_if_locked( $doc, 'usd', true ) );
	}

	/**
	 * Without the opt-in, settled value alone does not lock — send still does.
	 */
	public function test_settled_lock_is_opt_in(): void {
		$doc = $this->doc( 'USD', null, 100.0 );

		$this->assertNull( DocumentCurrency::reject_if_locked( $doc, 'EUR' ) );
	}

	/**
	 * @param string|null $currency    Stored currency.
	 * @param string|null $sent_at     Sent timestamp.
	 * @param float       $amount_paid Settled amount.
	 * @return object
	 */
	private function doc( $currency, $sent_at, float $amount_paid ) {
		return (object) array(
			'currency'    => $currency,
			'sent_at'     => $sent_at,
			'amount_paid' => $amount_paid,
		);
	}
}
