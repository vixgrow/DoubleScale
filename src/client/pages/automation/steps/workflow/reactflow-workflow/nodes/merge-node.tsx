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
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { map } from 'lodash';
import { CheckCircle, XCircle } from 'lucide-react';
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
} from '@quillcrm/components';
import { Button } from '@/components/ui/button';
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
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { AutomationStep } from '@quillcrm/client';
import { useAutomationContext } from '../../../../state/context';

interface MergeNodeData {
	condition: 'yes' | 'no' | 'merge';
	parentId: number;
	conditionStep?: any;
	yesChildCount?: number;
	noChildCount?: number;
	level?: number;
	onMergeClick?: () => void;
}

const MergeNode: React.FC<NodeProps> = ({ data }) => {
	const {
		condition,
		conditionStep,
		yesChildCount,
		noChildCount,
		level,
		onMergeClick,
	} = data as unknown as MergeNodeData;
	const isYes = condition === 'yes';
	const isMerge = condition === 'merge';
	const mergeLevel = level || 0;

	const [loading, setLoading] = useState(false);
	const [popoverVisible, setPopoverVisible] = useState(false);
	const { automation, steps, setSteps, setUpdatedSteps } =
		useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const handleClick = () => {
		if (onMergeClick) {
			onMergeClick();
		}
	};

	// Step types available for creation after merge
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
			icon: <ConditionsIcon />,
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

	const handleStepSelection = async (type: string) => {
		if (!automation) {
			console.error('No automation context available');
			return;
		}

		setLoading(true);

		// Steps after merge should be positioned immediately after the merge point
		// For root-level merges, add to root level
		// For nested merges, add to the appropriate parent level
		let targetParentId = 0;
		let targetCondition = undefined;
		let targetOrder = 1;

		if (conditionStep && (level || 0) > 0) {
			// For nested merge nodes, determine the correct parent context
			// The new step should be added to the same level as the condition that created this merge
			targetParentId = conditionStep.parent_id || 0;
			targetCondition = conditionStep.condition || undefined;

			// Find all steps at the target parent level that come after the condition step
			const siblingSteps = steps.filter(
				(step) =>
					step.parent_id === targetParentId &&
					step.condition === targetCondition &&
					step.order > conditionStep.order
			);

			// New step should be positioned after the condition and all its branches
			// but before any existing sibling steps that come after
			if (siblingSteps.length > 0) {
				targetOrder = Math.min(...siblingSteps.map((s) => s.order));
			} else {
				// No siblings after condition, find the next available order
				const allSiblingsAtLevel = steps.filter(
					(step) =>
						step.parent_id === targetParentId &&
						step.condition === targetCondition
				);
				targetOrder =
					allSiblingsAtLevel.length > 0
						? Math.max(...allSiblingsAtLevel.map((s) => s.order)) +
							1
						: conditionStep.order + 1;
			}
		} else {
			// Root level merge - find the position after the condition step and its branches
			if (conditionStep) {
				// Find all root-level steps that come after the condition step
				const rootStepsAfterCondition = steps.filter(
					(step) =>
						!step.parent_id && step.order > conditionStep.order
				);

				// New step should be positioned immediately after the condition's branches
				// but before any existing root steps that come after
				if (rootStepsAfterCondition.length > 0) {
					targetOrder = Math.min(
						...rootStepsAfterCondition.map((s) => s.order)
					);
				} else {
					// No root steps after condition, add at the end
					const rootSteps = steps.filter((step) => !step.parent_id);
					targetOrder =
						Math.max(...rootSteps.map((s) => s.order), 0) + 1;
				}
			} else {
				// Fallback: add to end of root level
				const rootSteps = steps.filter((step) => !step.parent_id);
				targetOrder = Math.max(...rootSteps.map((s) => s.order), 0) + 1;
			}
		}

		const stepData = {
			automation_id: automation.id,
			type,
			status: 'active',
			order: targetOrder,
		} as Partial<AutomationStep>;

		// Set parent and condition if this is a nested merge
		if (targetParentId > 0) {
			stepData.parent_id = targetParentId;
		}
		if (targetCondition) {
			stepData.condition = targetCondition;
		}

		// Set appropriate action based on step type
		if (type === 'condition') {
			stepData.action = 'condition';
		} else if (type === 'end_automation') {
			stepData.action = 'end_automation';
		}

		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(
				steps,
				targetParentId,
				targetOrder,
				targetCondition
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
				message: __('Step added after merge', 'quillcrm'),
			});

			setPopoverVisible(false);
		} catch (error: any) {
			console.error('Error creating step', error);
			createNotice({
				type: 'error',
				message: error.message || __('Failed to add step', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	// Generate a helpful tooltip for merge nodes
	const getMergeTooltip = () => {
		if (!isMerge) return '';

		const yesText =
			yesChildCount && yesChildCount > 0
				? `${yesChildCount} step${yesChildCount > 1 ? 's' : ''} in Yes branch`
				: 'Empty Yes branch';
		const noText =
			noChildCount && noChildCount > 0
				? `${noChildCount} step${noChildCount > 1 ? 's' : ''} in No branch`
				: 'Empty No branch';

		return `Merge point: ${yesText}, ${noText}`;
	};

	return (
		<div
			className={`qcrm-reactflow-node qcrm-reactflow-node--merge qcrm-reactflow-node--merge-${condition}`}
			onClick={!isMerge ? handleClick : undefined} // Only allow clicks for non-merge nodes
			title={isMerge ? getMergeTooltip() : ''}
			data-merge-level={mergeLevel}
		>
			{/* For merge nodes, we have multiple target handles */}
			{isMerge ? (
				<>
					{/* Central top handle for incoming connections */}
					<Handle
						type="target"
						position={Position.Top}
						id="top"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target qcrm-reactflow-handle--merge-input"
						style={{
							top: -6,
							left: '50%',
							transform: 'translateX(-50%)',
						}}
					/>
					{/* Yes and No handles for condition branch connections */}
					<Handle
						type="target"
						position={Position.Left}
						id="yes"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							left: -6,
							top: '50%',
							transform: 'translateY(-50%)',
						}}
					/>
					<Handle
						type="target"
						position={Position.Right}
						id="no"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							right: -6,
							top: '50%',
							transform: 'translateY(-50%)',
						}}
					/>
					{/* Hidden handles for left/right connections but positioned centrally */}
					<Handle
						type="target"
						position={Position.Left}
						id="left"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							left: '50%',
							top: '50%',
							transform: 'translate(-50%, -50%)',
							opacity: 0,
							pointerEvents: 'none',
						}}
					/>
					<Handle
						type="target"
						position={Position.Right}
						id="right"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{
							right: '50%',
							top: '50%',
							transform: 'translate(50%, -50%)',
							opacity: 0,
							pointerEvents: 'none',
						}}
					/>
				</>
			) : (
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>
			)}

			{/* Make merge node function as add-step node */}
			{isMerge ? (
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
																{
																	type.description
																}
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
			) : (
				<div className="qcrm-reactflow-merge__content">
					<div className="qcrm-reactflow-merge__icon">
						{isYes ? <CheckCircle /> : <XCircle />}
					</div>
					<div className="qcrm-reactflow-merge__label">
						{isYes ? __('Yes', 'quillcrm') : __('No', 'quillcrm')}
					</div>
				</div>
			)}

			<Handle
				type="source"
				position={Position.Bottom}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
				style={{ bottom: -6 }}
			/>
		</div>
	);
};

export default MergeNode;
