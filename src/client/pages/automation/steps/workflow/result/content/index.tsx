/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { Power } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import '../style.scss';
import { useAutomationContext } from '../../../../state/context';
import { getAction, getGoal, getTrigger } from '@quillcrm/utils';
import type {
	AutomationContact,
	AutomationStep,
	OrganizedStep,
} from '@quillcrm/client';
import { convertDate } from '@quillcrm/utils';
import {
	ActionIcon,
	ConditionsIcon,
	GoalIcon,
	TimerBlockIcon,
	ClockIcon,
} from '@quillcrm/components';
import ConditionStep from './ConditionStep';
import RegularStep from './RegularStep';

interface ResultContentProps {
	contact: AutomationContact;
}

const ResultContent: React.FC<ResultContentProps> = ({ contact }) => {
	const { automation } = useAutomationContext();

	if (!automation) {
		return null;
	}

	const trigger = getTrigger(automation.trigger);
	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			icon: <ActionIcon />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			icon: <ConditionsIcon />,
		},
		delay: {
			label: __('Delay', 'quillcrm'),
			icon: <TimerBlockIcon />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			icon: <GoalIcon />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			icon: <Power className="h-6 w-6" />,
		},
	};

	const processSteps = (
		parentId: number,
		steps: AutomationStep[]
	): AutomationStep[] => {
		const newSteps = steps
			.filter((step) => step.parent_id == parentId)
			.filter((step) => step['process_status'] !== 'skipped') // Filter out skipped steps
			.map((step) => ({
				...step,
				children: processSteps(step.id, steps),
			}));

		newSteps.sort((a, b) => a.order - b.order);
		return newSteps;
	};

	const organizeChildrenByCondition = (children: OrganizedStep[]) => {
		const yesChildren = children.filter(
			(child) => child.condition === 'yes'
		);
		const noChildren = children.filter((child) => child.condition === 'no');

		return { yesChildren, noChildren };
	};

	// Create a map of processed steps for quick lookup
	const processedStepsMap = new Map();
	contact.processes.forEach((process) => {
		processedStepsMap.set(process.step_id, {
			status: process.status,
			date: process.updated_at,
		});
	});

	// Check if contact has started the automation (has at least one process OR has a non-pending status)
	const hasStartedAutomation =
		contact.processes.length > 0 ||
		(contact.status &&
			contact.status !== 'pending' &&
			contact.status !== 'active');

	// Use all automation steps, not just processed ones
	const allSteps = automation.steps || [];
	const steps = allSteps.map((step) => {
		const processed = processedStepsMap.get(step.id);
		if (processed) {
			step['process_status'] = processed.status;
			step['process_date'] = processed.date;
		} else {
			// Handle cases where processes array is empty but automation has a status
			if (contact.status === 'completed') {
				// If automation is completed and this step is before or equal to current step, mark as completed
				if (
					contact.current_step &&
					step.order <= contact.current_step.order
				) {
					step['process_status'] = 'completed';
					step['process_date'] = contact.updated_at;
				} else {
					step['process_status'] = 'skipped';
					step['process_date'] = null;
				}
			} else if (hasStartedAutomation) {
				// Mark as skipped but will be filtered out from display
				step['process_status'] = 'skipped';
				step['process_date'] = null;
			} else {
				// Mark as pending if not processed yet
				step['process_status'] = 'pending';
				step['process_date'] = null;
			}
		}
		return step;
	});

	const statuses = {
		completed: __('Completed', 'quillcrm'),
		failed: __('Failed', 'quillcrm'),
		pending: __('Pending', 'quillcrm'),
		skipped: __('Skipped', 'quillcrm'),
	};

	const organizedSteps = processSteps(0, steps) as OrganizedStep[];

	// Format delay text from step settings
	const getDelayText = (step: OrganizedStep) => {
		if (step.type !== 'delay' || !step.settings) {
			return null;
		}
		const delay = step.settings.delay;
		const unit = step.settings.unit;
		if (!delay || !unit) {
			return null;
		}
		// Format unit with proper pluralization and capitalization
		let unitLabel = unit.toLowerCase();
		if (parseInt(delay) !== 1) {
			// Pluralize
			unitLabel = unitLabel + 's';
		}
		// Capitalize first letter
		unitLabel = unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1);
		return `${delay} ${unitLabel}`;
	};

	const getStep = (step: AutomationStep) => {
		switch (step.type) {
			case 'goal':
				return getGoal(step.action);
			case 'action':
				return getAction(step.action);

			default:
				return {
					label: '',
					description: '',
					fields: {},
				};
		}
	};

	// Helper: Format step label based on type
	const formatStepLabel = (step: OrganizedStep): string => {
		const baseLabel = typesOptions[step.type].label;
		const stepData = getStep(step);

		// Label formatters for each type
		const labelFormatters: Record<string, () => string | null> = {
			delay: () => {
				const delayText = getDelayText(step);
				return delayText ? `${baseLabel} (${delayText})` : null;
			},
			goal: () =>
				stepData.label ? `${baseLabel} (${stepData.label})` : null,
			action: () =>
				stepData.label ? `${baseLabel} (${stepData.label})` : null,
		};

		// Try specific formatter first
		const formatter = labelFormatters[step.type];
		if (formatter) {
			const formattedLabel = formatter();
			if (formattedLabel) return formattedLabel;
		}

		// Fallback for other types with action and label
		const shouldUseFallback =
			step.type !== 'condition' &&
			step.type !== 'end_automation' &&
			step.type !== 'delay' &&
			step.action &&
			stepData.label;

		return shouldUseFallback ? stepData.label : baseLabel;
	};

	// Helper: Determine which condition path was taken
	const determineConditionPath = (
		step: OrganizedStep,
		yesChildren: OrganizedStep[],
		noChildren: OrganizedStep[]
	): 'yes' | 'no' => {
		const hasChildrenWithStatus = (children: OrganizedStep[]) =>
			children.some((child) => child['process_status']);

		const hasProcessedChildren = (children: OrganizedStep[]) =>
			children.some(
				(child) =>
					child['process_status'] &&
					child['process_status'] !== 'pending'
			);

		// If condition hasn't been processed, default to branch with children or 'yes'
		const isConditionProcessed =
			step['process_status'] && step['process_status'] !== 'pending';
		if (!isConditionProcessed) {
			return yesChildren.length > 0 ? 'yes' : 'no';
		}

		// Check which branch has processed children
		if (hasProcessedChildren(yesChildren)) return 'yes';
		if (hasProcessedChildren(noChildren)) return 'no';

		// Check which branch has any status (even pending)
		if (hasChildrenWithStatus(yesChildren)) return 'yes';
		if (hasChildrenWithStatus(noChildren)) return 'no';

		// Default to branch with steps or 'yes'
		return yesChildren.length > 0 ? 'yes' : 'no';
	};

	// Helper: Determine branch label for steps in condition branches
	const getBranchLabel = (
		isInBranch: boolean,
		isFirstInBranch: boolean,
		isLastInBranch: boolean
	): 'started' | 'ended' | 'both' | undefined => {
		if (!isInBranch) return undefined;

		if (isFirstInBranch && isLastInBranch) return 'both';
		if (isFirstInBranch) return 'started';
		if (isLastInBranch) return 'ended';

		return undefined;
	};

	// Flatten steps into a sequential timeline array
	const flattenStepsForTimeline = () => {
		const timelineItems: Array<{
			id: number | string;
			type: string;
			label: string;
			icon: React.ReactNode;
			status?: string;
			date?: string;
			step?: OrganizedStep;
			conditionResult?: 'yes' | 'no';
			branchLabel?: 'started' | 'ended' | 'both';
		}> = [];

		// Add trigger as first item
		timelineItems.push({
			id: 'trigger',
			type: 'trigger',
			label: trigger.label,
			icon: <ActionIcon />,
			date: contact.processes[0]?.created_at,
		});

		// Process organized steps
		const processStepForTimeline = (
			step: OrganizedStep,
			isInBranch = false,
			isFirstInBranch = false,
			isLastInBranch = false
		) => {
			const { yesChildren, noChildren } = organizeChildrenByCondition(
				step.children || []
			);

			const status = step['process_status'] || 'pending';
			const date = step['process_date'];

			// Handle condition steps
			if (step.type === 'condition') {
				const pathTaken = determineConditionPath(
					step,
					yesChildren,
					noChildren
				);
				const childrenToProcess =
					pathTaken === 'yes' ? yesChildren : noChildren;

				// Add the condition card itself
				timelineItems.push({
					id: `condition-${step.id}`,
					type: 'condition',
					label: __('Condition', 'quillcrm'),
					icon: <ConditionsIcon />,
					status,
					date,
					step,
					conditionResult: pathTaken,
				});

				// Process children
				childrenToProcess.forEach((child, idx) => {
					const isFirst = idx === 0;
					const isLast = idx === childrenToProcess.length - 1;
					processStepForTimeline(child, true, isFirst, isLast);
				});
				return;
			}

			// Handle regular steps (action, delay, goal, etc.)
			timelineItems.push({
				id: step.id,
				type: step.type,
				label: formatStepLabel(step),
				icon: typesOptions[step.type].icon,
				status,
				date,
				step,
				branchLabel: getBranchLabel(
					isInBranch,
					isFirstInBranch,
					isLastInBranch
				),
			});

			// Process children if any
			if (step.children && step.children.length > 0) {
				step.children.forEach((child) => processStepForTimeline(child));
			}
		};

		organizedSteps.forEach((step) => processStepForTimeline(step));

		return timelineItems;
	};

	const timelineItems = flattenStepsForTimeline();

	// Helper: Get translated branch label text
	const getBranchLabelText = (
		branchLabel?: 'started' | 'ended' | 'both'
	): string | undefined => {
		if (!branchLabel) return undefined;

		const branchLabelMap = {
			started: __('Condition Started', 'quillcrm'),
			ended: __('Condition Ended', 'quillcrm'),
			both: `${__('Condition Started', 'quillcrm')} & ${__('Ended', 'quillcrm')}`,
		};

		return branchLabelMap[branchLabel];
	};

	// Helper: Check if timestamp should be shown
	const shouldShowTimestamp = (item: (typeof timelineItems)[0]): boolean => {
		return Boolean(
			item.date &&
				item.status !== 'pending' &&
				item.type !== 'end_automation'
		);
	};

	return (
		<Card className="shadow-none">
			<CardContent className="pt-6">
				<div className="qcrm-automation-workflow-timeline">
					{timelineItems.map((item, index) => {
						const isLeft = index % 2 === 1;
						const isCondition = item.type === 'condition';

						return (
							<div
								key={item.id}
								className={`qcrm-timeline-item ${
									isLeft
										? 'qcrm-timeline-item--left'
										: 'qcrm-timeline-item--right'
								}`}
							>
								<div className="qcrm-timeline-marker">
									<div className="qcrm-timeline-number">
										{index + 1}
									</div>
								</div>
								<div className="qcrm-timeline-content">
									{shouldShowTimestamp(item) && (
										<div className="qcrm-timeline-timestamp">
											<ClockIcon />
											<span>
												{__('Started on', 'quillcrm')}:
											</span>
											<span className="font-semibold">
												{convertDate(item.date!, true)}
											</span>
										</div>
									)}
									<Card className="qcrm-timeline-card shadow-none transition-shadow">
										<CardContent className="p-4">
											{isCondition ? (
												<ConditionStep
													icon={item.icon}
													label={item.label}
													conditionResult={
														item.conditionResult!
													}
													status={item.status}
													statuses={statuses}
												/>
											) : (
												<RegularStep
													icon={item.icon}
													label={item.label}
													status={
														item.type ===
														'end_automation'
															? undefined
															: item.status
													}
													statuses={statuses}
													branchLabel={getBranchLabelText(
														item.branchLabel
													)}
												/>
											)}
										</CardContent>
									</Card>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
};

export default ResultContent;
