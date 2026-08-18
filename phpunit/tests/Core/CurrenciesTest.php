<?php
/**
 * Canonical currency list + TS/PHP parity.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Constants\Currencies;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class CurrenciesTest extends TestCase {

	public function test_normalize_uppercases_and_trims(): void {
		$this->assertSame( 'USD', Currencies::normalize( ' usd ' ) );
		$this->assertNull( Currencies::normalize( '' ) );
		$this->assertNull( Currencies::normalize( null ) );
		$this->assertNull( Currencies::normalize( '   ' ) );
	}

	public function test_is_valid_accepts_listed_codes_case_insensitively(): void {
		$this->assertTrue( Currencies::is_valid( 'eur' ) );
		$this->assertTrue( Currencies::is_valid( 'USD' ) );
		$this->assertFalse( Currencies::is_valid( 'XYZ' ) );
		$this->assertFalse( Currencies::is_valid( '' ) );
		$this->assertFalse( Currencies::is_valid( null ) );
	}

	public function test_symbol_and_label(): void {
		$this->assertSame( '$', Currencies::symbol( 'USD' ) );
		$this->assertSame( 'EUR - Euro', Currencies::label( 'EUR' ) );
		$this->assertTrue( Currencies::zero_decimal( 'JPY' ) );
		$this->assertFalse( Currencies::zero_decimal( 'USD' ) );
	}

	public function test_php_codes_match_typescript_module(): void {
		$path = DOUBLESCALE_PLUGIN_DIR . 'src/shared/constants/currencies.ts';
		$this->assertFileExists( $path );

		$ts = file_get_contents( $path );
		$this->assertNotFalse( $ts );
		$this->assertSame( 1, preg_match( '/export const CURRENCY_CODES = \[([\s\S]*?)\] as const/', $ts, $m ) );

		preg_match_all( "/'([A-Z]{3})'/", $m[1], $codes );
		$this->assertSame( Currencies::CODES, $codes[1] );
	}
}
