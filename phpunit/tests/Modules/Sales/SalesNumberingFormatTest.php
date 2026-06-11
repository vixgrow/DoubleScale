<?php
/**
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Services\SalesNumbering;
use Illuminate\Database\QueryException;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class SalesNumberingFormatTest extends TestCase {

	public function test_format_sequential_number_uses_six_digit_padding(): void {
		$this->assertSame( 'INV-000001', SalesNumbering::format_sequential_number( 'INV', 1 ) );
		$this->assertSame( 'PRO-000042', SalesNumbering::format_sequential_number( 'PRO', 42 ) );
	}

	public function test_format_sequential_number_sanitizes_prefix(): void {
		$this->assertSame( 'INVCUSTOM-000007', SalesNumbering::format_sequential_number( 'INV-CUSTOM!', 7 ) );
	}

	public function test_is_duplicate_number_error_matches_invoice_and_proposal_keys(): void {
		$invoice_exception = new QueryException( '', array(), new \Exception( "Duplicate entry 'INV-000001' for key 'invoice_number'" ) );
		$proposal_exception = new QueryException( '', array(), new \Exception( "Duplicate entry 'PRO-000001' for key 'proposal_number'" ) );
		$hash_exception     = new QueryException( '', array(), new \Exception( "Duplicate entry 'abc' for key 'hash'" ) );

		$this->assertTrue( SalesNumbering::is_duplicate_number_error( $invoice_exception ) );
		$this->assertTrue( SalesNumbering::is_duplicate_number_error( $proposal_exception ) );
		$this->assertFalse( SalesNumbering::is_duplicate_number_error( $hash_exception ) );
	}
}
