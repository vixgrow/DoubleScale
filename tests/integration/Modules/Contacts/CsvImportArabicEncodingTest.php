<?php
/**
 * CSV import must store Arabic letters, not question marks.
 *
 * Bug: Windows-1256 Excel CSVs were ingested as raw bytes. MySQL utf8 then
 * replaced each Arabic letter with "?", so first_name/custom fields became
 * "?????" after import.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Modules\Contacts\ImportExport\Importers\Csv;
use DoubleScale\Modules\Contacts\ImportExport\Security;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class CsvImportArabicEncodingTest extends IntegrationTestCase {

	private const ARABIC_FIRST = 'محمد';
	private const ARABIC_LAST  = 'علي';

	/**
	 * @param string $contents Raw CSV bytes in any encoding.
	 * @return string Stored upload basename.
	 */
	private function write_raw_csv( $contents ) {
		$this->assertTrue( Security::prepare_upload_dir() );

		$stamp     = wp_generate_password( 8, false, false );
		$file_name = 'phpunit-csv-ar-' . $stamp . '.csv';
		$path      = Security::get_upload_file_path( $file_name );
		$written   = file_put_contents( $path, $contents );
		$this->assertNotFalse( $written );

		return $file_name;
	}

	/**
	 * @param string $file_name Stored upload basename.
	 * @return array<string, mixed>
	 */
	private function run_import( $file_name ) {
		$importer = new Csv(
			array(
				'file_name'         => $file_name,
				'mapping'           => array(
					'first_name' => 'first_name',
					'last_name'  => 'last_name',
					'email'      => 'email',
				),
				'offset'            => 0,
				'status'            => 'unverified',
				'update_existing'   => false,
				'phone_is_whatsapp' => false,
			)
		);

		$result = $importer->import();
		$this->assertIsArray( $result );
		return $result;
	}

	public function test_windows_1256_arabic_names_are_stored_as_utf8(): void {
		$email  = 'phpunit-ar-1256-' . wp_generate_password( 8, false, false ) . '@example.test';
		$first  = iconv( 'UTF-8', 'Windows-1256', self::ARABIC_FIRST );
		$last   = iconv( 'UTF-8', 'Windows-1256', self::ARABIC_LAST );
		$csv    = "first_name,last_name,email\n{$first},{$last},{$email}\n";
		$result = $this->run_import( $this->write_raw_csv( $csv ) );

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 1, $result['imported'] );

		$contact = ContactModel::where( 'email', $email )->first();
		$this->assertNotNull( $contact );
		$this->assertSame( self::ARABIC_FIRST, $contact->first_name );
		$this->assertSame( self::ARABIC_LAST, $contact->last_name );
		$this->assertStringNotContainsString( '?', (string) $contact->first_name );
	}

	public function test_utf8_arabic_names_are_stored_as_utf8(): void {
		$email  = 'phpunit-ar-utf8-' . wp_generate_password( 8, false, false ) . '@example.test';
		$csv    = 'first_name,last_name,email' . "\n" . self::ARABIC_FIRST . ',' . self::ARABIC_LAST . ",{$email}\n";
		$result = $this->run_import( $this->write_raw_csv( $csv ) );

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 1, $result['imported'] );

		$contact = ContactModel::where( 'email', $email )->first();
		$this->assertNotNull( $contact );
		$this->assertSame( self::ARABIC_FIRST, $contact->first_name );
		$this->assertSame( self::ARABIC_LAST, $contact->last_name );
	}
}
