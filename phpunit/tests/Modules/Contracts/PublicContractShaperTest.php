<?php
/**
 * Public contract response rules (no DB).
 *
 * @package DoubleScale\Tests\Modules\Contracts
 */

namespace DoubleScale\Tests\Modules\Contracts;

use DoubleScale\Modules\Contracts\Constants\ContractStatus;
use DoubleScale\Modules\Contracts\Models\ContractModel;
use DoubleScale\Modules\Contracts\Rest\ContractShaper;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class PublicContractShaperTest extends TestCase {

	public function test_can_sign_is_true_for_sent_and_active_statuses(): void {
		$sent   = $this->make_contract( array( 'status' => ContractStatus::SENT ) );
		$active = $this->make_contract( array( 'status' => ContractStatus::ACTIVE ) );

		$this->assertTrue( ContractShaper::can_sign( $sent ) );
		$this->assertTrue( ContractShaper::can_sign( $active ) );
	}

	public function test_can_sign_is_false_for_signed_and_expired_status(): void {
		$signed  = $this->make_contract( array( 'status' => ContractStatus::SIGNED ) );
		$expired = $this->make_contract( array( 'status' => ContractStatus::EXPIRED ) );

		$this->assertFalse( ContractShaper::can_sign( $signed ) );
		$this->assertFalse( ContractShaper::can_sign( $expired ) );
	}

	public function test_is_expired_when_end_date_is_in_the_past(): void {
		$contract = $this->make_contract(
			array(
				'status'   => ContractStatus::SENT,
				'end_date' => '2000-01-01',
			)
		);

		$this->assertTrue( ContractShaper::is_expired( $contract ) );
		$this->assertFalse( ContractShaper::can_sign( $contract ) );
	}

	public function test_is_expired_when_status_is_expired(): void {
		$contract = $this->make_contract(
			array(
				'status'   => ContractStatus::EXPIRED,
				'end_date' => '2099-12-31',
			)
		);

		$this->assertTrue( ContractShaper::is_expired( $contract ) );
	}

	public function test_shape_public_includes_contract_fields(): void {
		$contract = $this->make_contract(
			array(
				'contract_number' => 'CON-000099',
				'subject'         => 'Annual support',
				'contract_value'  => 1200.0,
				'currency'        => 'USD',
				'description'     => '<p>Terms apply.</p>',
			)
		);

		$shaped = ContractShaper::shape_public( $contract );

		$this->assertSame( 'CON-000099', $shaped['contract_number'] );
		$this->assertSame( 'Annual support', $shaped['subject'] );
		$this->assertSame( 1200.0, $shaped['contract_value'] );
		$this->assertSame( '<p>Terms apply.</p>', $shaped['description'] );
		$this->assertArrayHasKey( 'can_sign', $shaped );
		$this->assertArrayHasKey( 'require_signature', $shaped );
	}

	/**
	 * @param array<string, mixed> $attrs Attributes.
	 * @return ContractModel
	 */
	private function make_contract( array $attrs ): ContractModel {
		$defaults = array(
			'contract_number' => 'CON-000001',
			'subject'         => 'Test contract',
			'status'          => ContractStatus::DRAFT,
			'contract_value'  => 500.0,
			'currency'        => 'USD',
			'description'     => '',
		);

		$contract = new ContractModel();
		$contract->forceFill( array_merge( $defaults, $attrs ) );

		return $contract;
	}
}
