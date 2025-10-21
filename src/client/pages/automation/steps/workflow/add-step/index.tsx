/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import {
	ActionIcon,
	ConditionsIcon,
	EndLinkIcon,
	GoalIcon,
	GradientArrowIcon,
	PlusIcon,
	TimerBlockIcon,
} from '@quillcrm/components';

const updateStepOrderRecursive = (
	steps: AutomationStep[],
	parentId: number,
	order: number,
	condition?: string
) => {
	const updatedSteps = {};
	const newSteps = [...steps];
	let currentStepOrder = order;

	if (parentId > 0) {
		newSteps
			.filter(
				(step) =>
					step.parent_id === parentId && step.condition === condition
			)
			.sort((a, b) => a.order - b.order)
			.forEach((child, index) => {
				let newOrder = index + 1;

				if (currentStepOrder === child.order) {
					currentStepOrder = child.order;
				}

				if (child.order >= order) {
					newOrder = newOrder + 1;
				}

				if (newOrder !== child.order) {
					child.order = newOrder;
					updatedSteps[child.id] = { order: newOrder };
				}
			});
	} else {
		newSteps
			.sort((a, b) => a.order - b.order)
			.forEach((step, index) => {
				let newOrder = index + 1;

				if (currentStepOrder === step.order) {
					currentStepOrder = step.order;
				}

				if (step.order >= order) {
					newOrder = newOrder + 1;
				}

				if (newOrder !== step.order) {
					step.order = newOrder;
					updatedSteps[step.id] = { order: newOrder };
				}
			});
	}

	return { newSteps, updatedSteps, currentStepOrder };
};

interface AddStepProps {
	setStep: (step: OrganizedStep | null) => void;
	parentId?: number;
	condition?: string;
	prevStep?: OrganizedStep | null;
}

const AddStep: React.FC<AddStepProps> = ({
	setStep,
	parentId,
	condition,
	prevStep,
}) => {
	const { automation, steps, setSteps, setUpdatedSteps } =
		useAutomationContext();
	const [loading, setLoading] = useState(false);
	const [Visible, setVisible] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
	}

	const storeStep = async (type: string) => {
		setLoading(true);

		const order = getNewStepOrder();
		const stepData = {
			automation_id: automation.id,
			type,
			status: 'active', // Use 'active' instead of 'draft' to persist after refresh
			order,
		} as AutomationStep;

		if (type === 'condition') {
			stepData.action = 'condition';
		}

		if (parentId && condition) {
			stepData.parent_id = parentId;
			stepData.condition = condition;
		}

		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(steps, parentId || 0, order, condition);

		const data = {
			...stepData,
			order: currentStepOrder,
			updated_steps: updatedSteps,
		};

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps`,
				method: 'POST',
				data,
			})) as AutomationStep;

			const organizedStep = {
				...response,
				children: [],
			} as OrganizedStep;
			setUpdatedSteps({});
			setSteps([...newSteps, response]);

			createNotice({
				type: 'success',
				message: __('Step added', 'quillcrm'),
			});

			// Close dialog first
			setVisible(false);

			// Then open modal/selector for action, condition, goal, and delay steps
			// Use setTimeout to ensure dialog closes before modal opens
			if (type === 'action' || type === 'condition' || type === 'goal' || type === 'delay') {
				setTimeout(() => {
					setStep(organizedStep);
				}, 100);
			}
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const getNewStepOrder = () => {
		if (!parentId && !prevStep) {
			return 1;
		}

		if (prevStep) {
			return prevStep.order + 1;
		}

		return 1;
	};

	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			description: __(
				'Select one of the Actions to continue your workflow.',
				'quillcrm'
			),
			icon: <ActionIcon />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			description: __(
				'Select one of the Conditions to continue your workflow.',
				'quillcrm'
			),
			icon: <ConditionsIcon />,
		},
		delay: {
			label: __('Delay', 'quillcrm'),
			description: __(
				'A pause or waiting period introduced into a sequence of automated actions.',
				'quillcrm'
			),
			icon: <TimerBlockIcon />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			description: __(
				'Select one of the Goals to continue your workflow.',
				'quillcrm'
			),
			icon: <GoalIcon />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			description: __('End your Automation workflow.', 'quillcrm'),
			icon: <EndLinkIcon />,
		},
	};

	return (
		<Dialog open={Visible} onOpenChange={setVisible}>
			<DialogTrigger asChild>
				<div
					className="qcrm-automation-workflow__add-step flex items-center justify-center pointer-events-auto"
					onClick={(e) => {
						e.stopPropagation();
						setVisible(!Visible);
					}}
				>
					<Button
						variant="secondary"
						size="icon"
						className="h-8 w-8 rounded-full bg-white hover:bg-primary"
					>
						<PlusIcon />
					</Button>
				</div>
			</DialogTrigger>
			<DialogOverlay className="z-[150200]" />
			<DialogContent className="sm:max-w-[425px] p-6 z-[150200]">
				<DialogHeader>
					<DialogTitle>
						{__('Add Step', 'quillcrm')}
					</DialogTitle>
					<DialogDescription className="mt-1">
						{__('Select one of the Steps', 'quillcrm')}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-5">
					{map(typesOptions, (type, key) => (
						<Card
							key={key}
							className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
							onClick={(e) => {
								e.stopPropagation();
								storeStep(key);
							}}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="flex-shrink-0 text-white p-2 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg">
										{type.icon}
									</div>
									<div className="">
										<h3 className="font-semibold text-xl text-[#3F4254]">
											{type.label}
										</h3>
										<p className="text-sm text-[#333333] mt-1">
											{type.description}
										</p>
									</div>
								</div>
								<GradientArrowIcon />
							</div>
						</Card>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddStep;
