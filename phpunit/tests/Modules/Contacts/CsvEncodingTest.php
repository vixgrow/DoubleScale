<?php
/**
 * CSV import must keep Arabic (and other non-Latin) letters as UTF-8.
 *
 * Bug: Excel on Arabic Windows saves CSV as Windows-1256. The importer read
 * those bytes as-is and MySQL's utf8 connection replaced each invalid UTF-8
 * sequence with "?", so names and custom fields landed as "?????".
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\ImportExport\CsvEncoding;
use PHPUnit\Framework\TestCase;

final class CsvEncodingTest extends TestCase {

	private const ARABIC_NAME = 'محمد';

	/**
	 * @param string $utf8     UTF-8 text.
	 * @param string $encoding Target encoding.
	 */
	private function encode( string $utf8, string $encoding ): string {
		$out = iconv( 'UTF-8', $encoding, $utf8 );
		$this->assertNotFalse( $out, "iconv could not encode to {$encoding}" );
		return $out;
	}

	public function test_windows_1256_arabic_is_converted_to_utf8(): void {
		$bytes = $this->encode( self::ARABIC_NAME, 'Windows-1256' );
		$this->assertNotSame( self::ARABIC_NAME, $bytes );

		$converted = CsvEncoding::to_utf8( $bytes );

		$this->assertSame( self::ARABIC_NAME, $converted );
		$this->assertStringNotContainsString( '?', $converted );
	}

	public function test_utf8_arabic_is_left_unchanged(): void {
		$this->assertSame(
			self::ARABIC_NAME,
			CsvEncoding::to_utf8( self::ARABIC_NAME )
		);
	}

	public function test_utf8_bom_is_stripped(): void {
		$with_bom = "\xEF\xBB\xBF" . 'first_name,' . self::ARABIC_NAME;
		$this->assertSame(
			'first_name,' . self::ARABIC_NAME,
			CsvEncoding::to_utf8( $with_bom )
		);
	}

	public function test_utf16le_arabic_is_converted_to_utf8(): void {
		$utf16 = "\xFF\xFE" . $this->encode( self::ARABIC_NAME, 'UTF-16LE' );
		$this->assertSame( self::ARABIC_NAME, CsvEncoding::to_utf8( $utf16 ) );
	}

	public function test_iso_8859_6_arabic_becomes_utf8_arabic_not_question_marks(): void {
		$bytes     = $this->encode( self::ARABIC_NAME, 'ISO-8859-6' );
		$converted = CsvEncoding::to_utf8( $bytes );

		$this->assertTrue( mb_check_encoding( $converted, 'UTF-8' ) );
		$this->assertMatchesRegularExpression( '/\p{Arabic}/u', $converted );
		$this->assertStringNotContainsString( '?', $converted );
	}

	public function test_ascii_csv_is_unchanged(): void {
		$csv = "first_name,last_name,email\nAda,Lovelace,ada@example.test\n";
		$this->assertSame( $csv, CsvEncoding::to_utf8( $csv ) );
	}

	public function test_windows_1252_accents_are_converted_to_utf8(): void {
		$bytes = $this->encode( 'Café', 'Windows-1252' );
		$this->assertSame( 'Café', CsvEncoding::to_utf8( $bytes ) );
	}

	public function test_empty_string_is_unchanged(): void {
		$this->assertSame( '', CsvEncoding::to_utf8( '' ) );
	}
}
