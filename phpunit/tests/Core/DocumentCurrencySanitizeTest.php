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
}
