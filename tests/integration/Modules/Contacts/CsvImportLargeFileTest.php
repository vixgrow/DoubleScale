<?php
/**
 * Real CSV import through the Csv importer, including a 5,000-row file.
 *
 * Complements the in-memory 10k batching unit test: this hits ContactModel,
 * the upload directory, and League\Csv the way a browser import does.
 *
 * @package DoubleScale\Tests\Integration\Modules\Contacts
 */

namespace DoubleScale\Tests\Integration\Modules\Contacts;

use DoubleScale\Modules\Contacts\ImportExport\Importers\Csv;
use DoubleScale\Modules\Contacts\ImportExport\Security;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class CsvImportLargeFileTest extends IntegrationTestCase {

	/**
	 * @param int    $count  Number of data rows.
	 * @param string $prefix Email local-part prefix.
	 * @return array{0: string, 1: string} file_name, email like-pattern.
	 */
	private function write_csv( $count, $prefix ) {
		$this->assertTrue( Security::prepare_upload_dir() );

		$stamp     = wp_generate_password( 8, false, false );
		$file_name = 'phpunit-csv-' . $stamp . '.csv';
		$path      = Security::get_upload_file_path( $file_name );
		$handle    = fopen( $path, 'w' );
		$this->assertNotFalse( $handle );

		fputcsv( $handle, array( 'first_name', 'last_name', 'email' ) );
		for ( $i = 0; $i < $count; $i++ ) {
			fputcsv(
				$handle,
				array(
					'First' . $i,
					'Last' . $i,
					$prefix . $i . '-' . $stamp . '@example.test',
				)
			);
		}
		fclose( $handle );

		return array( $file_name, $prefix . '%-' . $stamp . '@example.test' );
	}

	/**
	 * @param string $file_name Stored upload basename.
	 * @param int    $offset    Current offset.
	 * @return array<string, mixed>
	 */
	private function run_batch( $file_name, $offset ) {
		$importer = new Csv(
			array(
				'file_name'       => $file_name,
				'mapping'         => array(
					'first_name' => 'first_name',
					'last_name'  => 'last_name',
					'email'      => 'email',
				),
				'offset'          => $offset,
				'status'          => 'unverified',
				'update_existing' => false,
			)
		);

		$result = $importer->import();
		$this->assertIsArray( $result );
		return $result;
	}

	public function test_invalid_email_does_not_abort_the_file(): void {
		$this->assertTrue( Security::prepare_upload_dir() );
		$stamp     = wp_generate_password( 8, false, false );
		$file_name = 'phpunit-csv-bad-' . $stamp . '.csv';
		$path      = Security::get_upload_file_path( $file_name );
		$good      = 'good-' . $stamp . '@example.test';
		$good2     = 'good2-' . $stamp . '@example.test';

		file_put_contents(
			$path,
			"first_name,last_name,email\n" .
			"Ada,Lovelace,{$good}\n" .
			"Bad,Row,not-an-email\n" .
			"Also,Good,{$good2}\n"
		);

		$result = $this->run_batch( $file_name, 0 );

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 2, $result['imported'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertSame( 3, $result['offset'] );
	}

	public function test_five_thousand_contacts_import_across_batches(): void {
		$total                    = 5000;
		list( $file_name, $like ) = $this->write_csv( $total, 'csv5k-' );

		$offset   = 0;
		$imported = 0;
		$requests = 0;

		do {
			$result    = $this->run_batch( $file_name, $offset );
			$offset    = (int) $result['offset'];
			$imported += (int) $result['imported'];
			++$requests;
		} while ( 'completed' !== $result['status'] && $requests < 400 );

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( $total, $imported );
		$this->assertGreaterThan( 1, $requests, '5,000 rows must span more than one HTTP-sized batch' );

		global $wpdb;
		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}doublescale_contacts WHERE email LIKE %s",
				$like
			)
		);
		$this->assertSame( $total, $count );
	}
}
