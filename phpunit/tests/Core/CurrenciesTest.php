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

	/**
	 * Every selectable code needs a symbol and a label, and neither map may
	 * carry an entry that is not selectable.
	 *
	 * Comparing only CODES let EGP sit in the symbol maps of BOTH plugins while
	 * being absent from CODES and LABELS — a currency that rendered correctly in
	 * reports but could never be picked. The drift was identical on both sides,
	 * so a PHP↔TS comparison alone could not see it.
	 */
	public function test_symbol_and_label_maps_cover_exactly_the_supported_codes(): void {
		$reflection = new \ReflectionClass( Currencies::class );
		$symbols    = array_keys( $reflection->getConstant( 'SYMBOLS' ) );
		$labels     = array_keys( $reflection->getConstant( 'LABELS' ) );

		sort( $symbols );
		sort( $labels );
		$codes = Currencies::CODES;
		sort( $codes );

		$this->assertSame( $codes, $symbols, 'SYMBOLS must cover exactly the supported codes.' );
		$this->assertSame( $codes, $labels, 'LABELS must cover exactly the supported codes.' );
	}

	/**
	 * The TypeScript symbol and label maps must carry the same key set too.
	 */
	public function test_typescript_symbol_and_label_maps_match_php(): void {
		$path = DOUBLESCALE_PLUGIN_DIR . 'src/shared/constants/currencies.ts';
		$this->assertFileExists( $path );

		$ts = (string) file_get_contents( $path );
		$codes = Currencies::CODES;
		sort( $codes );

		foreach ( array( 'CURRENCY_SYMBOLS', 'CURRENCY_LABELS' ) as $map ) {
			$this->assertSame(
				1,
				preg_match( '/export const ' . $map . '[^=]*= \{([\s\S]*?)\n\};/', $ts, $m ),
				$map . ' block not found in currencies.ts'
			);

			preg_match_all( '/^\t([A-Z]{3}):/m', $m[1], $keys );
			$found = $keys[1];
			sort( $found );

			$this->assertSame( $codes, $found, $map . ' must cover exactly the supported codes.' );
		}
	}
}
