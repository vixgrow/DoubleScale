<?php
/**
 * Contract status constants.
 *
 * @package DoubleScale\Tests\Modules\Contracts
 */

namespace DoubleScale\Tests\Modules\Contracts;

use DoubleScale\Modules\Contracts\Constants\ContractStatus;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class ContractStatusTest extends TestCase {

	public function test_all_returns_expected_statuses(): void {
		$this->assertSame(
			array( 'draft', 'sent', 'signed', 'active', 'expired' ),
			ContractStatus::all()
		);
	}

	public function test_is_valid_accepts_known_statuses(): void {
		foreach ( ContractStatus::all() as $status ) {
			$this->assertTrue( ContractStatus::is_valid( $status ) );
		}
	}

	public function test_is_valid_rejects_unknown_status(): void {
		$this->assertFalse( ContractStatus::is_valid( 'cancelled' ) );
	}

	public function test_get_label_returns_human_readable_name(): void {
		$this->assertSame( 'Signed', ContractStatus::get_label( ContractStatus::SIGNED ) );
	}
}
