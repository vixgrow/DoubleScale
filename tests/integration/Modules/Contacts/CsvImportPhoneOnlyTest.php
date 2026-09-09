<?php
/**
 * CSV import must accept phone-only contacts (no email column / empty email).
 *
 * Bug: Csv::run() aborted the file with "Email field is required." whenever
 * email was not mapped, and Importer::import_contact() skipped every row
 * without a valid email. Phone-only contacts are a supported identifier.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Modules\Contacts\ImportExport\Importers\Csv;
use DoubleScale\Modules\Contacts\ImportExport\Security;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class CsvImportPhoneOnlyTest extends IntegrationTestCase {

	/**
	 * @param array<int, string> $headers
	 * @param array<int, array<int, string>> $rows
	 * @return string Stored upload basename.
	 */
	private function write_csv_file( array $headers, array $rows ) {
		$this->assertTrue( Security::prepare_upload_dir() );

		$stamp     = wp_generate_password( 8, false, false );
		$file_name = 'phpunit-csv-phone-' . $stamp . '.csv';
		$path      = Security::get_upload_file_path( $file_name );
		$handle    = fopen( $path, 'w' );
		$this->assertNotFalse( $handle );

		fputcsv( $handle, $headers );
		foreach ( $rows as $row ) {
			fputcsv( $handle, $row );
		}
		fclose( $handle );

		return $file_name;
	}

	/**
	 * @param string               $file_name Stored upload basename.
	 * @param array<string, string> $mapping   csv-column => contact-field.
	 * @return array<string, mixed>
	 */
	private function run_import( $file_name, array $mapping ) {
		$importer = new Csv(
			array(
				'file_name'         => $file_name,
				'mapping'           => $mapping,
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

	public function test_csv_without_email_column_imports_phone_contacts(): void {
		$phone     = '+1555' . (string) wp_rand( 1000000, 9999999 );
		$file_name = $this->write_csv_file(
			array( 'first_name', 'last_name', 'phone' ),
			array( array( 'Ada', 'Lovelace', $phone ) )
		);

		$result = $this->run_import(
			$file_name,
			array(
				'first_name' => 'first_name',
				'last_name'  => 'last_name',
				'phone'      => 'phone',
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 1, $result['imported'] );
		$this->assertSame( 0, $result['failed'] );

		$contact = ContactModel::where( 'phone', $phone )->first();
		$this->assertNotNull( $contact );
		$this->assertSame( 'Ada', $contact->first_name );
		$this->assertTrue( empty( $contact->email ) );
	}

	public function test_empty_email_cells_still_import_when_phone_is_present(): void {
		$phone     = '+1555' . (string) wp_rand( 1000000, 9999999 );
		$file_name = $this->write_csv_file(
			array( 'first_name', 'email', 'phone' ),
			array( array( 'Grace', '', $phone ) )
		);

		$result = $this->run_import(
			$file_name,
			array(
				'first_name' => 'first_name',
				'email'      => 'email',
				'phone'      => 'phone',
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 1, $result['imported'] );
		$this->assertSame( 0, $result['failed'] );

		$contact = ContactModel::where( 'phone', $phone )->first();
		$this->assertNotNull( $contact );
		$this->assertTrue( empty( $contact->email ) );
	}

	public function test_invalid_email_still_fails_that_row_when_phone_is_missing(): void {
		$file_name = $this->write_csv_file(
			array( 'first_name', 'email' ),
			array( array( 'Bad', 'not-an-email' ) )
		);

		$result = $this->run_import(
			$file_name,
			array(
				'first_name' => 'first_name',
				'email'      => 'email',
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 0, $result['imported'] );
		$this->assertSame( 1, $result['failed'] );
	}

	public function test_neither_email_nor_phone_mapping_is_rejected(): void {
		$file_name = $this->write_csv_file(
			array( 'first_name', 'company' ),
			array( array( 'No', 'Identifier' ) )
		);

		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Email or phone field is required.' );

		$this->run_import(
			$file_name,
			array(
				'first_name' => 'first_name',
				'company'    => 'company_name',
			)
		);
	}

	public function test_empty_identifier_row_fails_without_aborting_the_file(): void {
		$phone     = '+1555' . (string) wp_rand( 1000000, 9999999 );
		$file_name = $this->write_csv_file(
			array( 'first_name', 'phone' ),
			array(
				array( 'Empty', '' ),
				array( 'Kept', $phone ),
			)
		);

		$result = $this->run_import(
			$file_name,
			array(
				'first_name' => 'first_name',
				'phone'      => 'phone',
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 1, $result['imported'] );
		$this->assertSame( 1, $result['failed'] );

		$contact = ContactModel::where( 'phone', $phone )->first();
		$this->assertNotNull( $contact );
		$this->assertSame( 'Kept', $contact->first_name );
	}

	public function test_duplicate_phone_is_skipped_when_not_updating_existing(): void {
		$phone     = '+1555' . (string) wp_rand( 1000000, 9999999 );
		ContactModel::create(
			array(
				'first_name' => 'Existing',
				'phone'      => $phone,
			)
		);

		$file_name = $this->write_csv_file(
			array( 'first_name', 'phone' ),
			array( array( 'Incoming', $phone ) )
		);

		$result = $this->run_import(
			$file_name,
			array(
				'first_name' => 'first_name',
				'phone'      => 'phone',
			)
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 0, $result['imported'] );
		$this->assertSame( 1, $result['skipped'] );
	}
}
