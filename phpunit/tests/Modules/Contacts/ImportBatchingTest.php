<?php
/**
 * CSV import must finish a HTTP batch without sleeping a second per page.
 *
 * Bug: import_with_offset() / import_with_cursor() called usleep(1000000)
 * before every page of ~20 rows, then kept looping until ~75% of PHP
 * max_execution_time. A 1,582-row file is ~80 seconds of sleep alone. When
 * the web server (or PHP) killed the request first, WordPress returned HTML
 * instead of JSON — "The response is not a valid JSON response." — and only
 * the contacts saved before the kill remained.
 *
 * Fix: one page per HTTP request, no 1s pause, so the client can chain
 * batches and always get a JSON body. Invalid emails fail that row only.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\Abstracts\Importer;
use PHPUnit\Framework\TestCase;

/**
 * Importer stand-in that records each row without touching the database.
 */
final class ImportBatchingHarness extends Importer {

	/** @var array<int, string> */
	public $imported_emails = array();

	/** @var string */
	public $last_failure_reason = '';

	public function __construct() {
		$this->start_time            = microtime( true );
		$this->max_execution_time    = 30;
		$this->update_existing       = false;
		$this->status                = 'subscribed';
		$this->phone_is_whatsapp     = false;
		$this->lists_mapping         = array();
		$this->tags_mapping          = array();
		$this->custom_fields_mapping = array();
		$this->lists                 = array();
		$this->tags                  = array();
		$this->offset                = 0;
		$this->cursor                = null;
	}

	/**
	 * @return array
	 */
	protected function run() {
		return array();
	}

	/**
	 * @param object|array $subscriber Subscriber row.
	 * @param array        $mapping    Field mapping.
	 * @return bool|string
	 */
	public function import_contact( $subscriber, $mapping ) {
		$email = is_array( $subscriber ) ? ( $subscriber['email'] ?? '' ) : '';
		if ( '' === $email || false === strpos( $email, '@' ) ) {
			$this->last_failure_reason = 'invalid_email';
			return false;
		}
		$this->imported_emails[] = $email;
		return true;
	}
}

final class ImportBatchingTest extends TestCase {

	/**
	 * @param int $total Total rows in the virtual file.
	 * @param int $page  Rows returned per callback (simulates CSV page size).
	 * @return callable
	 */
	private function paged_callback( int $total, int $page ): callable {
		return static function ( $offset ) use ( $total, $page ) {
			$offset = (int) $offset;
			$rows   = array();
			$end    = min( $total, $offset + $page );
			for ( $i = $offset; $i < $end; $i++ ) {
				$rows[] = array(
					'email'      => 'import-' . $i . '@example.test',
					'first_name' => 'N' . $i,
				);
			}
			return $rows;
		};
	}

	public function test_one_http_request_does_not_sleep_a_second_per_page(): void {
		$importer = new ImportBatchingHarness();
		$started  = microtime( true );

		$result = $importer->import_with_offset(
			150,
			0,
			$this->paged_callback( 150, 50 ),
			array( 'email' => 'email' )
		);

		$elapsed = microtime( true ) - $started;

		$this->assertLessThan(
			1.0,
			$elapsed,
			'A single import request must not sleep 1s per page of rows'
		);
		$this->assertSame( 'in_progress', $result['status'] );
		$this->assertSame( 50, $result['offset'] );
		$this->assertSame( 50, $result['imported'] );
	}

	public function test_chained_requests_import_ten_thousand_rows(): void {
		$total    = 10000;
		$page     = 50;
		$importer = new ImportBatchingHarness();
		$offset   = 0;
		$imported = 0;
		$requests = 0;
		$started  = microtime( true );

		do {
			$result    = $importer->import_with_offset(
				$total,
				$offset,
				$this->paged_callback( $total, $page ),
				array( 'email' => 'email' )
			);
			$offset   = (int) $result['offset'];
			$imported += (int) $result['imported'];
			++$requests;
		} while ( 'completed' !== $result['status'] && $requests < 500 );

		$elapsed = microtime( true ) - $started;

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( $total, $offset );
		$this->assertSame( $total, $imported );
		$this->assertSame( 200, $requests );
		$this->assertLessThan( 5.0, $elapsed, '10k rows across 200 batches must stay well under a few seconds in-memory' );
	}

	public function test_invalid_email_fails_that_row_and_continues(): void {
		$importer = new ImportBatchingHarness();
		$callback = static function () {
			return array(
				array( 'email' => 'good@example.test' ),
				array( 'email' => 'not-an-email' ),
				array( 'email' => '' ),
				array( 'email' => 'also-good@example.test' ),
			);
		};

		$result = $importer->import_with_offset(
			4,
			0,
			$callback,
			array( 'email' => 'email' )
		);

		$this->assertSame( 'completed', $result['status'] );
		$this->assertSame( 2, $result['imported'] );
		$this->assertSame( 2, $result['failed'] );
		$this->assertSame( 4, $result['offset'] );
		$this->assertNotEmpty( $result['failures'] );
	}
}
