/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { ArrowUp, ArrowDown, Loader2, GripVertical } from 'lucide-react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

/**
 * Internal dependencies - UI Components
 */
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import { reorderStep, canMoveStep } from '../utils/step-reorder-utils';
import { useWorkflowReorder } from './workflow-reorder-context';
import type { AutomationStep } from '@doublescale/client';

interface StepReorderControlsProps {
	step: AutomationStep;
	className?: string;
	isDragging?: boolean;
	isVisible?: boolean;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	dragHandleProps?: {
		attributes: DraggableAttributes;
		listeners: SyntheticListenerMap | undefined;
	};
}

const StepReorderControls: React.FC<StepReorderControlsProps> = ({
	step,
	className = '',
	isDragging = false,
	isVisible = false,
	onMouseEnter,
	onMouseLeave,
	dragHandleProps,
}) => {
	const { steps, setSteps } = useAutomationContext();
	const { clearPositions } = useWorkflowReorder();
	const { createNotice } = useDispatch('doublescale/core');
	const [isMoving, setIsMoving] = useState<'up' | 'down' | null>(null);

	const getStepMoveability = () => {
		if (step.parent_id && step.condition) {
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

			let canMoveUp = currentIndex > 0;
			let canMoveDown = currentIndex < sameBranchSteps.length - 1;
			let reason = 'within_branch';

			if (sameBranchSteps.length <= 1) {
				if (step.type === 'condition') {
					canMoveUp = currentIndex > 0;
					canMoveDown = currentIndex < sameBranchSteps.length - 1;
					reason = 'single_condition_in_branch';
				} else {
					reason = 'single_step_in_branch';
				}
			}

			return { canMoveUp, canMoveDown, reason };
		}

		if (!step.parent_id || step.parent_id === 0) {
			const rootSteps = steps
				.filter((s) => !s.parent_id || s.parent_id === 0)
				.sort((a, b) => a.order - b.order);
			const currentIndex = rootSteps.findIndex((s) => s.id === step.id);

			return {
				canMoveUp: currentIndex > 0,
				canMoveDown: currentIndex < rootSteps.length - 1,
				reason: 'root_level',
			};
		}

		return {
			canMoveUp: canMoveStep(steps, step, 'up'),
			canMoveDown: canMoveStep(steps, step, 'down'),
			reason: 'default',
		};
	};

	const { canMoveUp, canMoveDown, reason } = getStepMoveability();

	const handleMove = async (direction: 'up' | 'down') => {
		if (isMoving) return;

		const currentStep = steps.find((s) => s.id === step.id) ?? step;

		setIsMoving(direction);

		try {
			await reorderStep(
				currentStep,
				direction,
				steps,
				setSteps,
				createNotice,
				clearPositions
			);
		} finally {
			setIsMoving(null);
		}
	};

	const getTooltipText = (direction: 'up' | 'down', canMove: boolean) => {
		if (canMove) {
			if (reason === 'between_conditions_root') {
				return direction === 'up'
					? __('Move up (between conditions)', 'doublescale')
					: __('Move down (between conditions)', 'doublescale');
			}
			return direction === 'up'
				? __('Move step up', 'doublescale')
				: __('Move step down', 'doublescale');
		}

		switch (reason) {
			case 'single_step_in_branch':
				return __('Only step in this branch', 'doublescale');
			case 'single_condition_in_branch':
				return direction === 'up'
					? __('Move condition up', 'doublescale')
					: __('Move condition down', 'doublescale');
			case 'between_conditions_in_branch':
				return __(
					'Cannot move when between conditions in branch',
					'doublescale'
				);
			case 'after_condition_in_branch':
				return direction === 'up'
					? __('Cannot move above condition in branch', 'doublescale')
					: __('Cannot move below this branch', 'doublescale');
			case 'before_condition_in_branch':
				return direction === 'up'
					? __('Cannot move above this branch', 'doublescale')
					: __('Cannot move below condition in branch', 'doublescale');
			case 'before_condition_root':
				return direction === 'up'
					? __('Move step up', 'doublescale')
					: __('Cannot move down past condition', 'doublescale');
			case 'after_condition_root':
				return direction === 'up'
					? __('Cannot move up past condition', 'doublescale')
					: __('Move step down', 'doublescale');
			case 'between_conditions_root':
				return __('Cannot move past conditions', 'doublescale');
			case 'root_level':
			default:
				return direction === 'up'
					? __('Already at top', 'doublescale')
					: __('Already at bottom', 'doublescale');
		}
	};

	return (
		<TooltipProvider>
			<div
				className={`doublescale-step-reorder-controls ${isVisible ? 'doublescale-step-reorder-controls--visible' : ''} ${isDragging ? 'doublescale-step-reorder-controls--active' : ''} ${className}`}
				onClick={(e) => e.stopPropagation()}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				{dragHandleProps && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="doublescale-step-reorder-controls__button doublescale-step-reorder-controls__button--drag nodrag nopan"
								{...dragHandleProps.attributes}
								{...dragHandleProps.listeners}
							>
								<GripVertical className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>{__('Drag to reorder', 'doublescale')}</p>
						</TooltipContent>
					</Tooltip>
				)}

				<div className="doublescale-step-reorder-controls__arrows">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={!canMoveUp}
								onClick={() => handleMove('up')}
								className="doublescale-step-reorder-controls__button doublescale-step-reorder-controls__button--up"
							>
								{isMoving === 'up' ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<ArrowUp className="h-3.5 w-3.5" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>{getTooltipText('up', canMoveUp)}</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={!canMoveDown}
								onClick={() => handleMove('down')}
								className="doublescale-step-reorder-controls__button doublescale-step-reorder-controls__button--down"
							>
								{isMoving === 'down' ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<ArrowDown className="h-3.5 w-3.5" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>{getTooltipText('down', canMoveDown)}</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</TooltipProvider>
	);
};

export default StepReorderControls;
