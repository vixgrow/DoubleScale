/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Power } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import '../style.scss';
import { useAutomationContext } from '../../../../state/context';
import { getAction, getGoal, getTrigger } from '@doublescale/utils';
import type {
	AutomationContact,
	AutomationStep,
	OrganizedStep,
} from '@doublescale/client';
import { convertDate } from '@doublescale/utils';
import {
	ActionIcon,
	ConditionsIcon,
	GoalIcon,
	TimerBlockIcon,
	ClockIcon,
} from '@doublescale/components';
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
			label: __('Action', 'doublescale'),
			icon: <ActionIcon />,
		},
		condition: {
			label: __('Condition', 'doublescale'),
			icon: <ConditionsIcon />,
		},
		delay: {
			label: __('Delay', 'doublescale'),
			icon: <TimerBlockIcon />,
		},
		goal: {
			label: __('Goal', 'doublescale'),
			icon: <GoalIcon />,
		},
		end_automation: {
			label: __('End Automation', 'doublescale'),
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
	const processedStepsMap = new Map<
		number,
		{ status: string; date: string }
	>();
	const executedStepIds = new Set<number>();
	contact.processes.forEach((process) => {
		executedStepIds.add(process.step_id);
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
			const isConditionResult =
				step.type === 'condition' &&
				(processed.status === 'yes' || processed.status === 'no');
			step['process_status'] = isConditionResult
				? 'completed'
				: processed.status;
			step['process_date'] = processed.date;
			if (isConditionResult) {
				step['condition_result'] = processed.status;
			}
		} else {
			// Handle cases where processes array is empty but automation has a status
			if (contact.status === 'completed') {
				// Only infer completion for root-level steps on the main path.
				// Condition branch children must have their own process record.
				if (
					contact.current_step &&
					step.parent_id === 0 &&
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
		completed: __('Completed', 'doublescale'),
		failed: __('Failed', 'doublescale'),
		pending: __('Pending', 'doublescale'),
		skipped: __('Skipped', 'doublescale'),
	};

	const organizedSteps = processSteps(0, steps) as OrganizedStep[];

	const segmentNameLookup = useMemo(() => {
		const lookup: Record<number, string> = {};
		contact.contact?.tags?.forEach((tag) => {
			lookup[tag.id] = tag.name;
		});
		contact.contact?.lists?.forEach((list) => {
			lookup[list.id] = list.name;
		});
		return lookup;
	}, [contact.contact?.tags, contact.contact?.lists]);

	const [resolvedSegmentNames, setResolvedSegmentNames] = useState<
		Record<number, string>
	>({});

	useEffect(() => {
		const tagIds = new Set<number>();
		const listIds = new Set<number>();

		(automation?.steps || []).forEach((step) => {
			if (
				(step.action === 'add_tags' || step.action === 'remove_tags') &&
				Array.isArray(step.settings?.tags)
			) {
				step.settings.tags.forEach((id: number) => tagIds.add(Number(id)));
			}
			if (
				(step.action === 'add_lists' || step.action === 'remove_lists') &&
				Array.isArray(step.settings?.lists)
			) {
				step.settings.lists.forEach((id: number) => listIds.add(Number(id)));
			}
		});

		const missingTagIds = [...tagIds].filter((id) => !segmentNameLookup[id]);
		const missingListIds = [...listIds].filter((id) => !segmentNameLookup[id]);

		if (missingTagIds.length === 0 && missingListIds.length === 0) {
			setResolvedSegmentNames(segmentNameLookup);
			return;
		}

		let cancelled = false;

		const fetchNames = async () => {
			const nextLookup: Record<number, string> = { ...segmentNameLookup };

			try {
				if (missingTagIds.length > 0) {
					const response = (await apiFetch({
						path: addQueryArgs('/doublescale/v1/tags', {
							ids: missingTagIds,
						}),
					})) as { data?: Array<{ id: number; name: string }> };
					response.data?.forEach((tag) => {
						nextLookup[tag.id] = tag.name;
					});
				}

				if (missingListIds.length > 0) {
					const response = (await apiFetch({
						path: addQueryArgs('/doublescale/v1/lists', {
							ids: missingListIds,
						}),
					})) as { data?: Array<{ id: number; name: string }> };
					response.data?.forEach((list) => {
						nextLookup[list.id] = list.name;
					});
				}
			} catch {
				// Fall back to IDs when names cannot be loaded.
			}

			if (!cancelled) {
				setResolvedSegmentNames(nextLookup);
			}
		};

		fetchNames();

		return () => {
			cancelled = true;
		};
	}, [automation?.steps, segmentNameLookup]);

	const formatSegmentNames = (ids: number[]): string => {
		return ids
			.map(
				(id) =>
					resolvedSegmentNames[id] ||
					segmentNameLookup[id] ||
					`#${id}`
			)
			.join(', ');
	};

	const getSegmentActionDetail = (step: OrganizedStep): string | undefined => {
		if (!step.action || !step.settings) {
			return undefined;
		}

		if (
			(step.action === 'add_tags' || step.action === 'remove_tags') &&
			Array.isArray(step.settings.tags) &&
			step.settings.tags.length > 0
		) {
			const names = formatSegmentNames(
				step.settings.tags.map((id: number) => Number(id))
			);
			return step.action === 'add_tags'
				? `${__('Tags', 'doublescale')}: ${names}`
				: `${__('Tags removed', 'doublescale')}: ${names}`;
		}

		if (
			(step.action === 'add_lists' || step.action === 'remove_lists') &&
			Array.isArray(step.settings.lists) &&
			step.settings.lists.length > 0
		) {
			const names = formatSegmentNames(
				step.settings.lists.map((id: number) => Number(id))
			);
			return step.action === 'add_lists'
				? `${__('Lists', 'doublescale')}: ${names}`
				: `${__('Lists removed', 'doublescale')}: ${names}`;
		}

		return undefined;
	};

	// Format datetime helper
	const formatDelayDatetime = (value?: string | null) => {
		if (!value) return null;
		const normalized = value.includes('T') ? value : value.replace(' ', 'T');
		const date = new Date(normalized);
		if (Number.isNaN(date.getTime())) {
			return value;
		}
		return date.toLocaleString();
	};

	// Format delay text from step settings
	const getDelayText = (step: OrganizedStep) => {
		if (step.type !== 'delay') {
			return null;
		}

		const actionKey = step.action || 'delay';
		if (actionKey === 'delay-until-datetime') {
			return formatDelayDatetime(step.settings?.datetime);
		}

		const delay = step.settings?.delay;
		const unit = step.settings?.unit;
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
		const baseLabel =
			step.type === 'delay' && step.action
				? getAction(step.action)?.label || typesOptions[step.type].label
				: typesOptions[step.type].label;
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
	const resolveConditionPath = (
		step: OrganizedStep,
		yesChildren: OrganizedStep[],
		noChildren: OrganizedStep[]
	): 'yes' | 'no' => {
		const storedResult = step['condition_result'];
		if (storedResult === 'yes' || storedResult === 'no') {
			return storedResult;
		}

		const yesExecuted = yesChildren.some((child) =>
			executedStepIds.has(child.id)
		);
		const noExecuted = noChildren.some((child) =>
			executedStepIds.has(child.id)
		);

		if (yesExecuted && !noExecuted) {
			return 'yes';
		}
		if (noExecuted && !yesExecuted) {
			return 'no';
		}

		const isConditionProcessed =
			step['process_status'] && step['process_status'] !== 'pending';
		if (!isConditionProcessed) {
			return yesChildren.length > 0 ? 'yes' : 'no';
		}

		return yesChildren.length > 0 ? 'yes' : 'no';
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
			detailText?: string;
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

			const status = step['process_status'] || 'pending';
			const date = step['process_date'];

			// Handle condition steps
			if (step.type === 'condition') {
				const pathTaken = resolveConditionPath(
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
					label: __('Condition', 'doublescale'),
					icon: <ConditionsIcon />,
					status,
					date,
					step,
					conditionResult: pathTaken,
				});

				// Process children
				childrenToProcess.forEach((child) => {
					processStepForTimeline(child);
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
				detailText: getSegmentActionDetail(step),
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
				<div className="doublescale-automation-workflow-timeline">
					{timelineItems.map((item, index) => {
						const isLeft = index % 2 === 1;
						const isCondition = item.type === 'condition';

						return (
							<div
								key={item.id}
								className={`doublescale-timeline-item ${
									isLeft
										? 'doublescale-timeline-item--left'
										: 'doublescale-timeline-item--right'
								}`}
							>
								<div className="doublescale-timeline-marker">
									<div className="doublescale-timeline-number">
										{index + 1}
									</div>
								</div>
								<div className="doublescale-timeline-content">
									{shouldShowTimestamp(item) && (
										<div className="doublescale-timeline-timestamp">
											<ClockIcon />
											<span>
												{__('Started on', 'doublescale')}:
											</span>
											<span className="font-semibold">
												{convertDate(item.date!, true)}
											</span>
										</div>
									)}
									<Card className="doublescale-timeline-card shadow-none transition-shadow">
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
													detailText={item.detailText}
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
