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
import { Handle, Position, NodeProps } from '@xyflow/react';

/**
 * Internal dependencies
 */
import {
	ActionIcon,
	ConditionsIcon,
	EndLinkIcon,
	GoalIcon,
	GradientArrowIcon,
	PlusIcon,
	TimerBlockIcon,
} from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep } from '@quillcrm/client';

interface AddStepNodeData {
	parentId?: number | null;
	condition?: string | null;
	prevStep?: AutomationStep | null;
}

const updateStepOrderRecursive = (
	steps: AutomationStep[],
	parentId: number,
	order: number,
	condition?: string
) => {
	const updatedSteps = {};
	const newSteps = [...steps];
	let currentStepOrder = order;

	// Find steps that need to be reordered
	const stepsToUpdate = newSteps.filter((step) => {
		if (parentId === 0) {
			return !step.parent_id && step.order >= order;
		} else {
			return (
				step.parent_id === parentId &&
				step.condition === condition &&
				step.order >= order
			);
		}
	});

	// Sort steps by order to ensure proper sequential updating
	stepsToUpdate.sort((a, b) => a.order - b.order);

	// Update their orders - shift all steps forward by 1
	stepsToUpdate.forEach((step) => {
		const newOrder = step.order + 1;
		updatedSteps[step.id] = { order: newOrder };
		step.order = newOrder;
	});

	return { newSteps, updatedSteps, currentStepOrder };
};

const AddStepNode: React.FC<NodeProps> = ({ data }) => {
	const { parentId, condition, prevStep } =
		data as unknown as AddStepNodeData;
	const [loading, setLoading] = useState(false);
	const [popoverVisible, setPopoverVisible] = useState(false);
	const { automation, steps, setSteps, setUpdatedSteps } =
		useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
	}

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

	const getNewStepOrder = () => {
		// Find steps in the same branch to determine proper order
		const sameBranchSteps = steps.filter((step) => {
			if (!parentId || parentId === 0) {
				return !step.parent_id;
			} else {
				return (
					step.parent_id === parentId && step.condition === condition
				);
			}
		});

		if (prevStep && typeof prevStep.order === 'number') {
			// Insert after the previous step
			const stepsAfterPrev = sameBranchSteps.filter(
				(step) => step.order > prevStep.order
			);
			if (stepsAfterPrev.length > 0) {
				// Insert before the first step after prevStep
				return Math.min(...stepsAfterPrev.map((s) => s.order));
			} else {
				// No steps after prevStep, add at the end
				return prevStep.order + 1;
			}
		}

		// No prevStep specified, add at the end of the current branch
		if (sameBranchSteps.length === 0) {
			return 1; // First step in this branch
		} else {
			return Math.max(...sameBranchSteps.map((s) => s.order)) + 1;
		}
	};

	const handleStepSelection = async (type: string) => {
		setLoading(true);

		const order = getNewStepOrder();

		// Ensure order is always a valid number
		if (typeof order !== 'number' || isNaN(order) || order < 1) {
			console.warn('Invalid order calculated, defaulting to 1:', order);
			setLoading(false);
			return;
		}
		const stepData = {
			automation_id: automation.id,
			type,
			status: 'active', // Use 'active' instead of 'draft' to persist after refresh
			order,
		} as AutomationStep;

		// Set appropriate action based on step type
		if (type === 'condition') {
			stepData.action = 'condition';
		} else if (type === 'end_automation') {
			stepData.action = 'end_automation';
		}
		// For 'action' and 'goal' types, leave action empty - will be set when user selects specific action/goal

		if (parentId && condition) {
			stepData.parent_id = parentId;
			stepData.condition = condition;
		}

		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(
				steps,
				parentId || 0,
				order,
				condition || undefined
			);

		const requestData = {
			...stepData,
			order: currentStepOrder,
			updated_steps: updatedSteps,
		};

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps`,
				method: 'POST',
				data: requestData,
			})) as AutomationStep;

			setUpdatedSteps({});
			setSteps([...newSteps, response]);

			createNotice({
				type: 'success',
				message: __('Step added', 'quillcrm'),
			});
		} catch (error: any) {
			console.error('Failed to create step:', error);
			console.error('Request data was:', requestData);

			createNotice({
				type: 'error',
				message: error.message || __('Failed to add step', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="qcrm-reactflow-node qcrm-reactflow-node--add-step w-auto h-auto min-w-0 p-0 bg-transparent border-0 shadow-none">
			<Handle
				type="target"
				position={Position.Top}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
			/>

			<Dialog open={popoverVisible} onOpenChange={setPopoverVisible}>
				<DialogTrigger asChild>
					<div
						className="qcrm-automation-workflow__add-step flex items-center justify-center pointer-events-auto"
						onClick={(e) => {
							e.stopPropagation();
							setPopoverVisible(!popoverVisible);
						}}
					>
						<Button
							variant="secondary"
							size="icon"
							className="h-8 w-8 rounded-full bg-white"
							title={__('Add step here', 'quillcrm')}
						>
							<PlusIcon />
						</Button>
					</div>
				</DialogTrigger>
				<DialogPortal>
					<DialogOverlay className="z-[150200]" />
					<DialogContent className="sm:max-w-[800px] p-6 z-[150200]">
						{loading ? (
							<div className="flex justify-center">
								<Spinner className="h-6 w-6" />
							</div>
						) : (
							<>
								<DialogHeader>
									<DialogTitle>
										{__('Add Step', 'quillcrm')}
									</DialogTitle>
									<DialogDescription className="mt-1">
										{__(
											'Select one of the Steps',
											'quillcrm'
										)}
									</DialogDescription>
								</DialogHeader>
								<div className="flex flex-col gap-5">
									{map(typesOptions, (type, key) => (
										<Card
											key={key}
											className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
											onClick={(e) => {
												e.stopPropagation();
												handleStepSelection(key);
												setPopoverVisible(false);
											}}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="flex-shrink-0 p-2 text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg">
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
							</>
						)}
					</DialogContent>
				</DialogPortal>
			</Dialog>

			<Handle
				type="source"
				position={Position.Bottom}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
			/>
		</div>
	);
};

export default AddStepNode;
