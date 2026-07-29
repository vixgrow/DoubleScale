<?php
/**
 * Regression test for CSV importer column mapping.
 *
 * Bug: the importer inverted the submitted mapping with array_flip(). The UI
 * submits csv-column => contact-field, and unmapped columns carry an empty
 * string (the "None" option). Because array_flip() drops entries whose values
 * collide, every unmapped column collapsed into a single '' key and each
 * collision silently overwrote the entry before it. With the shipped CSV
 * template (first_name,last_name,email) plus any column left on "None", the
 * first_name mapping was discarded and only last_name and email imported —
 * with no error shown.
 *
 * Fix: build_mapping() skips unmapped columns and rejects two columns
 * targeting the same contact field instead of silently dropping one.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\ImportExport\Importers\Csv;
use PHPUnit\Framework\TestCase;

final class CsvImporterMappingTest extends TestCase {

	/**
	 * Invoke the protected build_mapping() on a constructor-less instance.
	 *
	 * @param array $mapping Raw csv-column => contact-field mapping.
	 * @return array
	 */
	private function build( array $mapping ): array {
		$importer = ( new \ReflectionClass( Csv::class ) )->newInstanceWithoutConstructor();
		$method   = new \ReflectionMethod( Csv::class, 'build_mapping' );
		$method->setAccessible( true );
		return $method->invoke( $importer, $mapping );
	}

	public function test_inverts_mapping_to_contact_field_keys(): void {
		$built = $this->build(
			array(
				'First Name' => 'first_name',
				'Last Name'  => 'last_name',
				'Email'      => 'email',
			)
		);

		$this->assertSame(
			array(
				'first_name' => 'First Name',
				'last_name'  => 'Last Name',
				'email'      => 'Email',
			),
			$built
		);
	}

	/**
	 * The reported bug: one unmapped column used to swallow first_name.
	 */
	public function test_unmapped_column_does_not_drop_other_mappings(): void {
		$built = $this->build(
			array(
				'first_name' => 'first_name',
				'last_name'  => 'last_name',
				'email'      => 'email',
				'phone'      => '',
			)
		);

		$this->assertArrayHasKey( 'first_name', $built );
		$this->assertSame( 'first_name', $built['first_name'] );
		$this->assertSame( 'last_name', $built['last_name'] );
		$this->assertSame( 'email', $built['email'] );
	}

	/**
	 * Several unmapped columns share the same empty value; none of them may
	 * displace a real mapping.
	 */
	public function test_multiple_unmapped_columns_are_all_skipped(): void {
		$built = $this->build(
			array(
				'first_name' => 'first_name',
				'company'    => '',
				'last_name'  => 'last_name',
				'notes'      => '',
				'email'      => 'email',
				'phone'      => '',
			)
		);

		$this->assertCount( 3, $built );
		$this->assertSame(
			array(
				'first_name' => 'first_name',
				'last_name'  => 'last_name',
				'email'      => 'email',
			),
			$built
		);
	}

	public function test_null_values_are_skipped(): void {
		$built = $this->build(
			array(
				'first_name' => 'first_name',
				'email'      => 'email',
				'phone'      => null,
			)
		);

		$this->assertSame(
			array(
				'first_name' => 'first_name',
				'email'      => 'email',
			),
			$built
		);
	}

	/**
	 * '0' is a legitimate custom-field id key and must not be treated as empty.
	 */
	public function test_zero_string_target_is_kept(): void {
		$built = $this->build(
			array(
				'Email'  => 'email',
				'Custom' => '0',
			)
		);

		$this->assertArrayHasKey( '0', $built );
		$this->assertSame( 'Custom', $built['0'] );
	}

	public function test_duplicate_target_field_is_reported(): void {
		$this->expectException( \Exception::class );
		$this->expectExceptionMessageMatches( '/mapped to/' );

		$this->build(
			array(
				'Email'         => 'email',
				'Work Email'    => 'email',
			)
		);
	}

	public function test_empty_mapping_yields_empty_result(): void {
		$this->assertSame( array(), $this->build( array() ) );
	}
}
