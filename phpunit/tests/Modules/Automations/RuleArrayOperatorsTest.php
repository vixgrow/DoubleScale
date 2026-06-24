<?php
/**
 * Automation rule array operator semantics (tags/lists segment rules).
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use DoubleScale\Modules\Automations\Abstracts\Rule;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group automations
 */
final class RuleArrayOperatorsTest extends TestCase {

	/**
	 * @dataProvider array_operator_cases
	 */
	public function test_array_operators( string $operator, array $contact_values, array $rule_values, bool $expected ): void {
		$rule = new class() extends Rule {
			/** @var array<int> */
			private $values = array();

			/** @param array<int> $values */
			public function set_values( array $values ): void {
				$this->values = $values;
			}

			public function get_value( $automation_contact ) {
				return $this->values;
			}
		};

		$rule->set_values( $contact_values );

		$result = $rule->is_met(
			$this->createMock( AutomationContactModel::class ),
			array(
				'operator' => $operator,
				'value'    => $rule_values,
			)
		);

		$this->assertSame( $expected, $result );
	}

	/**
	 * @return array<string, array{0: string, 1: array<int>, 2: array<int>, 3: bool}>
	 */
	public function array_operator_cases(): array {
		return array(
			'is requires all selected values'           => array( 'is', array( 1 ), array( 1, 2 ), false ),
			'is passes when all selected values match'  => array( 'is', array( 1, 2 ), array( 1, 2 ), true ),
			'contains passes with any selected value'   => array( 'contains', array( 1 ), array( 1, 2 ), true ),
			'contains fails when none match'            => array( 'contains', array( 3 ), array( 1, 2 ), false ),
			'is_not fails when any selected value matches' => array( 'is_not', array( 1 ), array( 1, 2 ), false ),
			'is_not passes when none match'             => array( 'is_not', array( 3 ), array( 1, 2 ), true ),
			'does_not_contain passes when none match'   => array( 'does_not_contain', array( 3 ), array( 1, 2 ), true ),
		);
	}
}
