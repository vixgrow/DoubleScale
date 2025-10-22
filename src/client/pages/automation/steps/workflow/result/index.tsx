/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Rocket, Power } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@quillcrm/components';

interface ResultProps {
	contact: AutomationContact | null;
}

const Result: React.FC<ResultProps> = ({ contact }) => {
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
		active: __('Active', 'quillcrm'),
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

	const renderStep = (step: OrganizedStep) => {
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

		return (
			<div key={step.id} className="qcrm-automation-workflow__item">
				<Card className="qcrm-automation-workflow__card hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle>
							<div className="flex justify-between items-center">
								<div className="flex gap-2.5 items-center">
									<span className="text-sm font-normal">
										{__('Status', 'quillcrm')}:
									</span>
									<Badge variant="secondary">
										{statuses[step['process_status']]}
									</Badge>
								</div>
								<div className="flex gap-2.5 items-center">
									<span className="text-sm font-normal">
										{__('Execution Time', 'quillcrm')}:
									</span>
									<span className="text-sm text-muted-foreground font-normal">
										{convertDate(
											step['process_date'],
											true
										)}
									</span>
								</div>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex gap-2.5 items-center">
							<div className="qcrm-automation-workflow__card-icon">
								{typesOptions[step.type].icon}
							</div>
							<div className="qcrm-automation-workflow__card-title">
								{label}
							</div>
						</div>
					</CardContent>
				</Card>
				{step.type === 'condition' && step.children.length > 0 && (
					<div className="flex gap-5 mt-2.5">
						<Card className="qcrm-automation-workflow__condition-yes flex-1">
							<CardHeader>
								<CardTitle>
									{yesChildren.length > 0
										? __('Yes', 'quillcrm')
										: __('No', 'quillcrm')}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{yesChildren.length > 0 && (
									<div className="flex flex-col gap-2.5">
										{yesChildren.map(renderStep)}
									</div>
								)}
								{noChildren.length > 0 && (
									<div className="flex flex-col gap-2.5">
										{noChildren.map(renderStep)}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		);
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="w-auto flex flex-col gap-5 justify-center items-center">
					<div className="qcrm-automation-workflow flex flex-col gap-5 w-full">
						<div className="qcrm-automation-workflow__item">
							<Card className="qcrm-automation-workflow__card hover:shadow-md transition-shadow">
								<CardContent className="pt-6">
									<div className="flex gap-2.5 items-center">
										<div className="qcrm-automation-workflow__card-icon">
											<Rocket className="h-4 w-4" />
										</div>
										<div className="qcrm-automation-workflow__card-title">
											{trigger.label}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
						{organizedSteps.map(renderStep)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default Result;
