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

    // Check if contact has started the automation (has at least one process)
    const hasStartedAutomation = contact.processes.length > 0;

    // Use all automation steps, not just processed ones
    const allSteps = automation.steps || [];
    const steps = allSteps.map((step) => {
        const processed = processedStepsMap.get(step.id);
        if (processed) {
            step['process_status'] = processed.status;
            step['process_date'] = processed.date;
        } else {
            // If the contact has already started the automation but this step has no process record,
            // it means this step was added after the contact started, so mark it as skipped
            if (hasStartedAutomation) {
                step['process_status'] = 'skipped';
            } else {
                // Mark as pending if not processed yet
                step['process_status'] = 'pending';
            }
            step['process_date'] = null;
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

            // Format label based on step type
            if (step.type === 'delay') {
                const delayText = getDelayText(step);
                if (delayText) {
                    label = `${typesOptions[step.type].label} (${delayText})`;
                }
            } else if (step.type === 'goal' && stepData.label) {
                label = `${typesOptions[step.type].label} (${stepData.label})`;
            } else if (step.type === 'action' && stepData.label) {
                label = `${typesOptions[step.type].label} (${stepData.label})`;
            } else if (
                step.type !== 'condition' &&
                step.type !== 'end_automation' &&
                step.type !== 'delay' &&
                step.action &&
                stepData.label
            ) {
                label = stepData.label;
            }

            const status = step['process_status'] || 'pending';
            const date = step['process_date'];

            // Add the step itself
            if (step.type === 'condition') {
                // For conditions, check which path was taken based on which children have process_status
                const yesChildrenProcessed = yesChildren.filter(
                    (child) => child['process_status'] && child['process_status'] !== 'pending'
                );
                const noChildrenProcessed = noChildren.filter(
                    (child) => child['process_status'] && child['process_status'] !== 'pending'
                );

                // Determine path taken: check if condition itself has been processed
                let pathTaken: 'yes' | 'no' | null = null;
                if (step['process_status'] && step['process_status'] !== 'pending') {
                    // Condition has been processed, determine path based on which children were processed
                    if (yesChildrenProcessed.length > 0) {
                        pathTaken = 'yes';
                    } else if (noChildrenProcessed.length > 0) {
                        pathTaken = 'no';
                    } else {
                        // Condition is processed but no children processed yet
                        // Check if there are any children with process_status (even pending)
                        const yesChildrenWithStatus = yesChildren.filter(
                            (child) => child['process_status']
                        );
                        const noChildrenWithStatus = noChildren.filter(
                            (child) => child['process_status']
                        );

                        if (yesChildrenWithStatus.length > 0) {
                            pathTaken = 'yes';
                        } else if (noChildrenWithStatus.length > 0) {
                            pathTaken = 'no';
                        } else {
                            // No status info, show the branch with steps or default to yes
                            pathTaken = yesChildren.length > 0 ? 'yes' : 'no';
                        }
                    }
                } else {
                    // Condition not processed yet, show both branches or default
                    pathTaken = yesChildren.length > 0 ? 'yes' : 'no';
                }

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
                    conditionResult: pathTaken!,
                });

                // Process children and add them as separate timeline items
                childrenToProcess.forEach(processStepForTimeline);
            } else {
                // Regular step (action, delay, goal, etc.)
                // Labels are already formatted above
                const stepLabel = label;

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
                                className={`qcrm-timeline-item ${isLeft
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
                                    {item.date && item.status !== 'pending' && item.type !== 'end_automation' && (
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
                                                    status={item.type === 'end_automation' ? undefined : item.status}
                                                    statuses={statuses}
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

