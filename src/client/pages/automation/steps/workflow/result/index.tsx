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
import './style.scss';
import { useAutomationContext } from '../../../state/context';
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
	CustomDialogHeader,
	GradientViewIcon,
	ClockIcon,
} from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
} from '@quillcrm/components/ui/dialog';

interface ResultProps {
	contact: AutomationContact | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const Result: React.FC<ResultProps> = ({ contact, open, onOpenChange }) => {
	const { automation } = useAutomationContext();

	if (!contact || !automation) {
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

	const steps = contact.processes.map((process) => {
		const step = process.step;
		step['process_status'] = process.status;
		step['process_date'] = process.updated_at;

		return step;
	});

	const statuses = {
		completed: __('Completed', 'quillcrm'),
		failed: __('Failed', 'quillcrm'),
	};

	const organizedSteps = processSteps(0, steps) as OrganizedStep[];

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
		const processStepForTimeline = (step: OrganizedStep) => {
			const { yesChildren, noChildren } = organizeChildrenByCondition(
				step.children || []
			);

			let label = typesOptions[step.type].label;
			const stepData = getStep(step);
			if (
				step.type !== 'condition' &&
				step.type !== 'end_automation' &&
				step.action
			) {
				label = stepData.label;
			}

			const status = step['process_status'] || 'completed';
			const date = step['process_date'];

			// Add the step itself
			if (step.type === 'condition') {
				// For conditions, check which path was taken based on which children have process_status
				const yesChildrenProcessed = yesChildren.filter(
					(child) => child['process_status']
				);
				const noChildrenProcessed = noChildren.filter(
					(child) => child['process_status']
				);
				const pathTaken =
					yesChildrenProcessed.length > 0
						? 'yes'
						: noChildrenProcessed.length > 0
							? 'no'
							: yesChildren.length > 0
								? 'yes'
								: 'no';
				const childrenToProcess =
					pathTaken === 'yes' ? yesChildren : noChildren;

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

				// Add condition result indicator
				if (childrenToProcess.length > 0) {
					timelineItems.push({
						id: `condition-result-${step.id}`,
						type: 'condition_result',
						label:
							pathTaken === 'yes'
								? __('Yes', 'quillcrm')
								: __('No', 'quillcrm'),
						icon: <ConditionsIcon />,
						status: 'completed',
						date,
					});
				}

				// Process children
				childrenToProcess.forEach(processStepForTimeline);
			} else {
				// Regular step (action, delay, goal, etc.)
				const stepLabel =
					step.type === 'action' && stepData.label
						? `${typesOptions[step.type].label} (${stepData.label})`
						: label;

				timelineItems.push({
					id: step.id,
					type: step.type,
					label: stepLabel,
					icon: typesOptions[step.type].icon,
					status,
					date,
					step,
				});

				// Process children if any
				if (step.children && step.children.length > 0) {
					step.children.forEach(processStepForTimeline);
				}
			}
		};

		organizedSteps.forEach(processStepForTimeline);

		return timelineItems;
	};

	const timelineItems = flattenStepsForTimeline();

	const content = (
		<Card className="shadow-none">
			<CardContent className="pt-6">
				<div className="qcrm-automation-workflow-timeline">
					{timelineItems.map((item, index) => {
						const isLeft = index % 2 === 1;
						const isConditionResult =
							item.type === 'condition_result';

						return (
							<div
								key={item.id}
								className={`qcrm-timeline-item ${isLeft
									? 'qcrm-timeline-item--left'
									: 'qcrm-timeline-item--right'
									} ${isConditionResult ? 'qcrm-timeline-item--condition-result' : ''}`}
							>
								<div className="qcrm-timeline-marker">
									<div className="qcrm-timeline-number">
										{index + 1}
									</div>
								</div>
								<div className="qcrm-timeline-content">
									{item.date && (
										<div className="qcrm-timeline-timestamp">
											<ClockIcon />
											<span>
												{__('Started on', 'quillcrm')}:
											</span>
											<span className="font-semibold">
												{convertDate(item.date, true)}
											</span>
										</div>
									)}
									<Card className="qcrm-timeline-card hover:shadow-md transition-shadow">
										<CardContent className="p-4">
											{isConditionResult ? (
												<div className="flex gap-2.5 items-center">
													<div className="qcrm-timeline-card-icon">
														{item.icon}
													</div>
													<div className="qcrm-timeline-card-title">
														{__(
															'Condition',
															'quillcrm'
														)}
														:{' '}
														<span className="text-green-600">
															{item.label}
														</span>
													</div>
												</div>
											) : (
												<>
													<div className="flex gap-2.5 items-center mb-3">
														<div className="qcrm-timeline-card-icon">
															{item.icon}
														</div>
														<div className="qcrm-timeline-card-title flex-1">
															{item.label}
														</div>
													</div>
													{item.status && (
														<div className="flex justify-start">
															{(() => {
																const status = item.status;
																const bgColor = status == 'completed'
																	? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
																	: status == 'failed'
																		? 'bg-[#EF444429] text-destructive border-destructive'
																		: 'bg-gray-100 text-gray-700';
																return (
																	<span className={`capitalize border rounded py-1 px-3 text-sm w-fit ${bgColor}`}>
																		{statuses[status] || status}
																	</span>
																);
															})()}
														</div>
													)}
												</>
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

	// If dialog props are provided, wrap in dialog
	if (open !== undefined && onOpenChange) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogOverlay className="z-[150200]" />
				<DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto z-[150200]">
					<DialogHeader>
						<CustomDialogHeader
							title={__('View Journey', 'quillcrm')}
							subtitle={__(
								`View journey of contact ${contact?.contact.email}`,
								'quillcrm'
							)}
							icon={<GradientViewIcon />}
						/>
					</DialogHeader>
					<div>{content}</div>
				</DialogContent>
			</Dialog>
		);
	}

	// Return content without dialog wrapper
	return content;
};

export default Result;
