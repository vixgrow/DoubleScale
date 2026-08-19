<?php
/**
 * REST currency sanitizer: junk 400, lowercase normalises, empty inherits.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Services\DocumentCurrency;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 2 ) . '/RestApiEndpointTestStubs.php';

final class DocumentCurrencySanitizeTest extends TestCase {

	public function test_empty_and_null_inherit(): void {
		$this->assertNull( DocumentCurrency::sanitize_input( null ) );
		$this->assertNull( DocumentCurrency::sanitize_input( '' ) );
		$this->assertNull( DocumentCurrency::sanitize_input( '   ' ) );
	}

	public function test_lowercase_normalises_to_iso_code(): void {
		$this->assertSame( 'USD', DocumentCurrency::sanitize_input( 'usd' ) );
		$this->assertSame( 'EUR', DocumentCurrency::sanitize_input( ' eur ' ) );
	}

	public function test_junk_code_is_rejected(): void {
		$result = DocumentCurrency::sanitize_input( 'XYZ' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_currency', $result->get_error_code() );
	}

	public function test_proposal_link_locks_currency_change(): void {
		$model = (object) array(
			'currency'    => 'EUR',
			'sent_at'     => null,
			'proposal_id' => 42,
		);

		$result = DocumentCurrency::reject_if_locked( $model, 'USD' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'currency_locked', $result->get_error_code() );
	}

	public function test_same_currency_on_proposal_invoice_is_allowed(): void {
		$model = (object) array(
			'currency'    => 'EUR',
			'sent_at'     => null,
			'proposal_id' => 42,
		);

		$this->assertNull( DocumentCurrency::reject_if_locked( $model, 'EUR' ) );
	}
}
