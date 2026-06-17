<?php
/**
 * Public proposal response rules (no DB).
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Constants\ProposalStatus;
use DoubleScale\Modules\Sales\Models\ProposalModel;
use DoubleScale\Modules\Sales\Rest\ProposalShaper;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class PublicProposalShaperTest extends TestCase {

	public function test_can_respond_is_true_for_sent_and_open_statuses(): void {
		$sent = $this->make_proposal( array( 'status' => ProposalStatus::SENT ) );
		$open = $this->make_proposal( array( 'status' => ProposalStatus::OPEN ) );

		$this->assertTrue( ProposalShaper::can_respond( $sent ) );
		$this->assertTrue( ProposalShaper::can_respond( $open ) );
	}

	public function test_can_respond_is_false_for_accepted_and_declined(): void {
		$accepted = $this->make_proposal( array( 'status' => ProposalStatus::ACCEPTED ) );
		$declined = $this->make_proposal( array( 'status' => ProposalStatus::DECLINED ) );

		$this->assertFalse( ProposalShaper::can_respond( $accepted ) );
		$this->assertFalse( ProposalShaper::can_respond( $declined ) );
	}

	public function test_can_respond_is_false_when_open_till_is_in_the_past(): void {
		$proposal = $this->make_proposal(
			array(
				'status'    => ProposalStatus::SENT,
				'open_till' => '2000-01-01',
			)
		);

		$this->assertTrue( ProposalShaper::is_expired( $proposal ) );
		$this->assertFalse( ProposalShaper::can_respond( $proposal ) );
	}

	/**
	 * @param array<string, mixed> $attrs Attributes.
	 * @return ProposalModel
	 */
	private function make_proposal( array $attrs ): ProposalModel {
		$defaults = array(
			'proposal_number' => 'PRO-000001',
			'subject'         => 'Test proposal',
			'status'          => ProposalStatus::DRAFT,
			'currency'        => 'USD',
			'discount_type'   => 'none',
			'discount_value'  => 0.0,
			'line_items'      => array(),
			'subtotal'        => 100.0,
			'adjustment'      => 0.0,
			'total'           => 100.0,
		);

		$proposal = new ProposalModel();
		$proposal->forceFill( array_merge( $defaults, $attrs ) );

		return $proposal;
	}
}
