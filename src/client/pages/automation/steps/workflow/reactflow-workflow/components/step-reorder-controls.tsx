/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import { reorderStep, canMoveStep } from '../utils/step-reorder-utils';
import type { AutomationStep } from '@quillcrm/client';

interface StepReorderControlsProps {
	step: AutomationStep;
	className?: string;
	clearSavedPositions?: () => void;
}

const StepReorderControls: React.FC<StepReorderControlsProps> = ({
	step,
	className = '',
	clearSavedPositions,
}) => {
	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');
	const [isMoving, setIsMoving] = useState<'up' | 'down' | null>(null);

	// Enhanced logic to check if step can move considering condition branches and complex scenarios
	const getStepMoveability = () => {
		// Helper function to find adjacent condition nodes
		const findAdjacentConditions = (
			currentStep: AutomationStep,
			contextSteps: AutomationStep[],
			currentIndex: number
		) => {
			const prevStep =
				currentIndex > 0 ? contextSteps[currentIndex - 1] : null;
			const nextStep =
				currentIndex < contextSteps.length - 1
					? contextSteps[currentIndex + 1]
					: null;

			return {
				prevIsCondition: prevStep?.type === 'condition',
				nextIsCondition: nextStep?.type === 'condition',
				betweenConditions:
					prevStep?.type === 'condition' &&
					nextStep?.type === 'condition',
				prevStep,
				nextStep,
			};
		};

		// If step is under a condition (has parent_id and condition),
		// it can only move within that specific branch
		if (step.parent_id && step.condition) {
			// Find other steps in the same condition branch
			const sameBranchSteps = steps
				.filter(
					(s) =>
						s.parent_id === step.parent_id &&
						s.condition === step.condition
				)
				.sort((a, b) => a.order - b.order);

			const currentIndex = sameBranchSteps.findIndex(
				(s) => s.id === step.id
			);

			const adjacency = findAdjacentConditions(
				step,
				sameBranchSteps,
				currentIndex
			);

			// Special restrictions for steps between conditions in branches
			let canMoveUp = currentIndex > 0;
			let canMoveDown = currentIndex < sameBranchSteps.length - 1;
			let reason = 'within_branch';

			if (sameBranchSteps.length <= 1) {
				// Only one step in branch - only allow movement if it's a condition step
				if (step.type === 'condition') {
					canMoveUp = currentIndex > 0;
					canMoveDown = currentIndex < sameBranchSteps.length - 1;
					reason = 'single_condition_in_branch';
				} else {
					reason = 'single_step_in_branch';
				}
			} else if (adjacency.betweenConditions) {
				// Step is between two conditions in a branch - very restricted
				canMoveUp = false;
				canMoveDown = false;
				reason = 'between_conditions_in_branch';
			} else if (adjacency.prevIsCondition && step.type !== 'condition') {
				// Non-condition step directly after a condition in branch - restricted upward movement
				canMoveUp = false;
				reason = 'after_condition_in_branch';
			} else if (adjacency.nextIsCondition && step.type !== 'condition') {
				// Non-condition step directly before a condition in branch - restricted downward movement
				canMoveDown = false;
				reason = 'before_condition_in_branch';
			}
			// Note: Condition steps themselves can move freely within branches

			return { canMoveUp, canMoveDown, reason };
		}

		// If step is a root level step (no parent), check for condition restrictions
		if (!step.parent_id) {
			const rootSteps = steps
				.filter((s) => !s.parent_id)
				.sort((a, b) => a.order - b.order);
			const currentIndex = rootSteps.findIndex((s) => s.id === step.id);
			const adjacency = findAdjacentConditions(
				step,
				rootSteps,
				currentIndex
			);

			let canMoveUp = currentIndex > 0;
			let canMoveDown = currentIndex < rootSteps.length - 1;
			let reason = 'root_level';

			// Apply restrictions when adjacent to condition nodes at root level
			// But allow condition nodes themselves to move more freely
			if (step.type !== 'condition') {
				if (adjacency.nextIsCondition) {
					// Step directly before a condition - cannot move down past it
					canMoveDown = false;
					reason = 'before_condition_root';
				} else if (adjacency.prevIsCondition) {
					// Step directly after a condition - cannot move up past it
					canMoveUp = false;
					reason = 'after_condition_root';
				} else if (adjacency.betweenConditions) {
					// Step between two conditions - cannot move in either direction
					canMoveUp = false;
					canMoveDown = false;
					reason = 'between_conditions_root';
				}
			}

			return { canMoveUp, canMoveDown, reason };
		}

		// For other cases, use default logic
		return {
			canMoveUp: canMoveStep(steps, step, 'up'),
			canMoveDown: canMoveStep(steps, step, 'down'),
			reason: 'default',
		};
	};

	const { canMoveUp, canMoveDown, reason } = getStepMoveability();

	const handleMove = async (direction: 'up' | 'down') => {
		if (isMoving) return;

		setIsMoving(direction);

		try {
			await reorderStep(
				step,
				direction,
				steps,
				setSteps,
				createNotice,
				clearSavedPositions
			);
		} finally {
			setIsMoving(null);
		}
	};

	// Helper function to get tooltip text based on context
	const getTooltipText = (direction: 'up' | 'down', canMove: boolean) => {
		if (canMove) {
			// Add context-aware enabled tooltips
			if (reason === 'between_conditions_root') {
				return direction === 'up'
					? __('Move up (between conditions)', 'quillcrm')
					: __('Move down (between conditions)', 'quillcrm');
			}
			return direction === 'up'
				? __('Move step up', 'quillcrm')
				: __('Move step down', 'quillcrm');
		}

		// Disabled tooltip explanations based on reason
		switch (reason) {
			case 'single_step_in_branch':
				return __('Only step in this branch', 'quillcrm');

			case 'single_condition_in_branch':
				return direction === 'up'
					? __('Move condition up', 'quillcrm')
					: __('Move condition down', 'quillcrm');

			case 'between_conditions_in_branch':
				return __(
					'Cannot move when between conditions in branch',
					'quillcrm'
				);

			case 'after_condition_in_branch':
				return direction === 'up'
					? __('Cannot move above condition in branch', 'quillcrm')
					: __('Cannot move below this branch', 'quillcrm');

			case 'before_condition_in_branch':
				return direction === 'up'
					? __('Cannot move above this branch', 'quillcrm')
					: __('Cannot move below condition in branch', 'quillcrm');

			case 'before_condition_root':
				return direction === 'up'
					? __('Move step up', 'quillcrm')
					: __('Cannot move down past condition', 'quillcrm');

			case 'after_condition_root':
				return direction === 'up'
					? __('Cannot move up past condition', 'quillcrm')
					: __('Move step down', 'quillcrm');

			case 'between_conditions_root':
				return __('Cannot move past conditions', 'quillcrm');

			case 'root_level':
			default:
				// Simple boundary restrictions for root level and other cases
				return direction === 'up'
					? __('Already at top', 'quillcrm')
					: __('Already at bottom', 'quillcrm');
		}
	};

	// Don't render if step can't be moved in either direction
	// Exception: Always show controls for condition steps, even if disabled
	if (!canMoveUp && !canMoveDown && step.type !== 'condition') {
		return null;
	}

	return (
		<div className={`qcrm-step-reorder-controls ${className}`}>
			<Tooltip title={getTooltipText('up', canMoveUp)} placement="top">
				<Button
					type="text"
					size="small"
					icon={<ArrowUpOutlined />}
					disabled={!canMoveUp}
					loading={isMoving === 'up'}
					onClick={(e) => {
						e.stopPropagation();
						handleMove('up');
					}}
					className="qcrm-step-reorder-controls__button qcrm-step-reorder-controls__button--up"
				/>
			</Tooltip>
			<Tooltip
				title={getTooltipText('down', canMoveDown)}
				placement="top"
			>
				<Button
					type="text"
					size="small"
					icon={<ArrowDownOutlined />}
					disabled={!canMoveDown}
					loading={isMoving === 'down'}
					onClick={(e) => {
						e.stopPropagation();
						handleMove('down');
					}}
					className="qcrm-step-reorder-controls__button qcrm-step-reorder-controls__button--down"
				/>
			</Tooltip>
		</div>
	);
};

export default StepReorderControls;
