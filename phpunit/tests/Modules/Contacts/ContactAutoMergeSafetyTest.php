<?php
/**
 * Auto-merge safety rule.
 *
 * Use case 2 (a visitor updating their own details, buying, or registering) and
 * use case 3 (CSV import) merge duplicates with nobody reviewing the result. An
 * unattended merge is not reversible, so it runs only when there is nothing to
 * decide: no blocking identifier conflict **and** no differing profile field.
 *
 * Anything else is left for an admin to confirm through the existing dialog.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\Services\ContactMergeService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

/**
 * @group contacts
 * @group merge
 */
final class ContactAutoMergeSafetyTest extends TestCase {

	/**
	 * Ask the service whether a preview is safe to merge unattended.
	 *
	 * @param array $preview Preview payload.
	 * @return bool
	 */
	private function is_safe( array $preview ): bool {
		$method = new ReflectionMethod( ContactMergeService::class, 'preview_is_auto_mergeable' );
		$method->setAccessible( true );

		return (bool) $method->invoke( new ContactMergeService(), $preview );
	}

	/**
	 * Nothing to decide: the duplicate only adds an identifier the primary lacks.
	 */
	public function test_clean_duplicate_is_auto_mergeable(): void {
		$this->assertTrue(
			$this->is_safe(
				array(
					'blocking'            => array(),
					'conflicts'           => array(),
					'identifiers_to_copy' => array(
						array(
							'field' => 'phone',
							'value' => '+201000000000',
						),
					),
				)
			)
		);
	}

	/**
	 * A blocking identifier conflict is never merged unattended.
	 */
	public function test_blocking_conflict_is_never_auto_mergeable(): void {
		$this->assertFalse(
			$this->is_safe(
				array(
					'blocking'  => array(
						array(
							'field'   => 'email',
							'primary' => 'a@example.test',
							'source'  => 'b@example.test',
						),
					),
					'conflicts' => array(),
				)
			)
		);
	}

	/**
	 * A differing profile field means a human has to choose which value wins.
	 */
	public function test_field_conflict_is_not_auto_mergeable(): void {
		$this->assertFalse(
			$this->is_safe(
				array(
					'blocking'  => array(),
					'conflicts' => array(
						array(
							'field'   => 'first_name',
							'primary' => 'Ahmed',
							'source'  => 'Mohamed',
						),
					),
				)
			),
			'A name that differs between the two records is a decision, not a merge.'
		);
	}

	/**
	 * A malformed preview is treated as unsafe rather than assumed clean.
	 */
	public function test_missing_keys_are_treated_as_unsafe(): void {
		$this->assertFalse( $this->is_safe( array() ) );
		$this->assertFalse( $this->is_safe( array( 'blocking' => array() ) ) );
		$this->assertFalse( $this->is_safe( array( 'conflicts' => array() ) ) );
	}

	/**
	 * Non-array values must not pass as "empty".
	 */
	public function test_non_array_values_are_treated_as_unsafe(): void {
		$this->assertFalse(
			$this->is_safe(
				array(
					'blocking'  => 'none',
					'conflicts' => array(),
				)
			)
		);
	}
}
