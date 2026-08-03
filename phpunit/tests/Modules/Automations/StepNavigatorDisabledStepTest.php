<?php
/**
 * StepNavigator skips steps the user has disabled.
 *
 * A disabled step stays in the workflow (it is still visible in the builder and
 * still exported) but must never be handed to the engine as the next step.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use DoubleScale\Modules\Automations\Engine\StepNavigator;
use DoubleScale\Modules\Automations\Models\AutomationStepModel;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * In-memory stand-in for the subset of the Eloquent query builder that
 * StepNavigator uses. Filters are applied eagerly against a plain array of
 * step objects.
 */
class FakeStepQuery {

	/** @var object[] */
	private $rows;

	/**
	 * @param object[] $rows Step rows.
	 */
	public function __construct( array $rows ) {
		$this->rows = $rows;
	}

	/**
	 * Apply a where filter.
	 *
	 * @param string $column   Column name.
	 * @param mixed  $operator Operator, or the value when only two args are given.
	 * @param mixed  $value    Value when an operator is supplied.
	 *
	 * @return self
	 */
	public function where( $column, $operator, $value = null ) {
		if ( null === $value ) {
			$value    = $operator;
			$operator = '=';
		}

		$filtered = array_filter(
			$this->rows,
			function ( $row ) use ( $column, $operator, $value ) {
				$actual = $row->{$column};

				switch ( $operator ) {
					case '>':
						return $actual > $value;
					case '!=':
						return $actual != $value;
					default:
						return $actual == $value;
				}
			}
		);

		return new self( array_values( $filtered ) );
	}

	/**
	 * Order rows by a column.
	 *
	 * @param string $column    Column name.
	 * @param string $direction asc or desc.
	 *
	 * @return self
	 */
	public function orderBy( $column, $direction = 'asc' ) {
		$rows = $this->rows;

		usort(
			$rows,
			function ( $a, $b ) use ( $column, $direction ) {
				$cmp = $a->{$column} <=> $b->{$column};
				return 'desc' === $direction ? -$cmp : $cmp;
			}
		);

		return new self( $rows );
	}

	/**
	 * First matching row.
	 *
	 * @return object|null
	 */
	public function first() {
		return $this->rows[0] ?? null;
	}
}

/**
 * Automation double exposing a steps() relation backed by an array.
 */
class FakeAutomation {

	/** @var object[] */
	private $rows;

	/**
	 * @param object[] $rows Step rows.
	 */
	public function __construct( array $rows ) {
		$this->rows = $rows;
	}

	/**
	 * @return FakeStepQuery
	 */
	public function steps() {
		return new FakeStepQuery( $this->rows );
	}
}

/**
 * @group smoke
 */
class StepNavigatorDisabledStepTest extends TestCase {

	/**
	 * Build a step row.
	 *
	 * @param int    $id        Step ID.
	 * @param int    $order     Order within its context.
	 * @param string $status    Step status.
	 * @param int    $parent_id Parent step ID.
	 * @param string $condition Branch condition.
	 *
	 * @return object
	 */
	private function step( $id, $order, $status = 'active', $parent_id = 0, $condition = '' ) {
		return (object) array(
			'id'        => $id,
			'order'     => $order,
			'status'    => $status,
			'parent_id' => $parent_id,
			'condition' => $condition,
		);
	}

	/**
	 * A disabled step between two active steps is stepped over.
	 */
	public function test_disabled_step_is_skipped_at_root_level(): void {
		$automation = new FakeAutomation(
			array(
				$this->step( 1, 1 ),
				$this->step( 2, 2, AutomationStepModel::STATUS_DISABLED ),
				$this->step( 3, 3 ),
			)
		);

		$next = StepNavigator::get_next_step( $automation, $this->step( 1, 1 ) );

		$this->assertNotNull( $next );
		$this->assertSame( 3, $next->id, 'Expected the disabled step 2 to be skipped.' );
	}

	/**
	 * A run of consecutive disabled steps is skipped in one hop.
	 */
	public function test_consecutive_disabled_steps_are_skipped(): void {
		$automation = new FakeAutomation(
			array(
				$this->step( 1, 1 ),
				$this->step( 2, 2, AutomationStepModel::STATUS_DISABLED ),
				$this->step( 3, 3, AutomationStepModel::STATUS_DISABLED ),
				$this->step( 4, 4 ),
			)
		);

		$next = StepNavigator::get_next_step( $automation, $this->step( 1, 1 ) );

		$this->assertNotNull( $next );
		$this->assertSame( 4, $next->id );
	}

	/**
	 * When every remaining step is disabled the automation ends rather than
	 * resuming on a switched-off step.
	 */
	public function test_all_remaining_steps_disabled_ends_automation(): void {
		$automation = new FakeAutomation(
			array(
				$this->step( 1, 1 ),
				$this->step( 2, 2, AutomationStepModel::STATUS_DISABLED ),
			)
		);

		$next = StepNavigator::get_next_step( $automation, $this->step( 1, 1 ) );

		$this->assertNull( $next );
	}

	/**
	 * Soft-deleted steps remain excluded, unchanged by the disabled status.
	 */
	public function test_deleted_steps_are_still_skipped(): void {
		$automation = new FakeAutomation(
			array(
				$this->step( 1, 1 ),
				$this->step( 2, 2, AutomationStepModel::STATUS_DELETED ),
				$this->step( 3, 3 ),
			)
		);

		$next = StepNavigator::get_next_step( $automation, $this->step( 1, 1 ) );

		$this->assertSame( 3, $next->id );
	}

	/**
	 * A disabled step inside a yes/no branch is skipped within that branch.
	 */
	public function test_disabled_step_is_skipped_inside_branch(): void {
		$automation = new FakeAutomation(
			array(
				$this->step( 10, 1, 'active', 5, 'yes' ),
				$this->step( 11, 2, AutomationStepModel::STATUS_DISABLED, 5, 'yes' ),
				$this->step( 12, 3, 'active', 5, 'yes' ),
			)
		);

		$next = StepNavigator::get_next_step(
			$automation,
			$this->step( 10, 1, 'active', 5, 'yes' )
		);

		$this->assertNotNull( $next );
		$this->assertSame( 12, $next->id );
	}

	/**
	 * When the rest of a branch is disabled, flow falls through to the step
	 * after the parent condition rather than stalling in the branch.
	 */
	public function test_disabled_tail_of_branch_falls_through_to_parent_context(): void {
		$automation = new FakeAutomation(
			array(
				// Root level: the condition at order 1, then a following step.
				$this->step( 5, 1 ),
				$this->step( 6, 2 ),
				// Branch steps under the condition.
				$this->step( 10, 1, 'active', 5, 'yes' ),
				$this->step( 11, 2, AutomationStepModel::STATUS_DISABLED, 5, 'yes' ),
			)
		);

		$next = StepNavigator::get_next_step(
			$automation,
			$this->step( 10, 1, 'active', 5, 'yes' )
		);

		$this->assertNotNull( $next );
		$this->assertSame( 6, $next->id, 'Expected fall-through to the step after the condition.' );
	}
}
