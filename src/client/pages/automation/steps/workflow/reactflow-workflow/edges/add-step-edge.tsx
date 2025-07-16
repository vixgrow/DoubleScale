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
import { Button, Popover, Flex, Spin } from 'antd';
import {
	PlusOutlined,
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { map } from 'lodash';
import {
	EdgeProps,
	getBezierPath,
	EdgeLabelRenderer,
	BaseEdge,
} from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@quillcrm/client';
import { useAutomationContext } from '../../../../state/context';

interface AddStepEdgeData {
	sourceStep?: AutomationStep;
	targetStep?: AutomationStep;
	condition?: string;
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

	// Filter steps to update based on parent_id and condition
	const stepsToUpdate = newSteps
		.filter((step) => {
			if (parentId > 0) {
				// Child steps - same parent and condition
				return (
					step.parent_id === parentId && step.condition === condition
				);
			} else {
				// Root level steps
				return !step.parent_id;
			}
		})
		.sort((a, b) => a.order - b.order);

	// Update orders for steps that come at or after the insertion point
	stepsToUpdate.forEach((step) => {
		if (step.order >= order) {
			const newOrder = step.order + 1;
			step.order = newOrder;
			updatedSteps[step.id] = { order: newOrder };
		}
	});

	return { newSteps, updatedSteps, currentStepOrder };
};

const AddStepEdge: React.FC<EdgeProps> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	data,
	markerEnd,
	target,
}) => {
	const { sourceStep, targetStep, condition } =
		(data as AddStepEdgeData) || {};
	const [loading, setLoading] = useState(false);
	const [popoverVisible, setPopoverVisible] = useState(false);
	const { automation, steps, setSteps, setUpdatedSteps } =
		useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
	}

	// Don't show plus button if target is an AddStepNode (these have their own + button)
	const shouldShowPlusButton = !target?.startsWith('add-step');

	if (!shouldShowPlusButton) {
		// Just render a regular edge without the plus button
		return (
			<BaseEdge
				id={id}
				path={
					getBezierPath({
						sourceX,
						sourceY,
						sourcePosition,
						targetX,
						targetY,
						targetPosition,
					})[0]
				}
				style={style}
				markerEnd={markerEnd}
			/>
		);
	}

	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			icon: <ThunderboltOutlined />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			icon: <BranchesOutlined />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			icon: <TrophyOutlined />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			icon: <DisconnectOutlined />,
		},
	};

	const getNewStepOrder = () => {
		if (!sourceStep) {
			// Adding after trigger, so first step
			return 1;
		}

		if (targetStep) {
			// Adding between two steps, use target step's order
			// This will push the target step and all subsequent steps down by 1
			return targetStep.order;
		}

		// Adding at the end, so next order after source step
		// Need to find the highest order in the same branch
		const parentId = sourceStep.parent_id || 0;
		const branchCondition = sourceStep.condition || null;

		const sameBranchSteps = steps.filter((step) => {
			if (parentId === 0) {
				// Root level steps
				return !step.parent_id;
			} else {
				// Child steps - same parent and condition
				return (
					step.parent_id === parentId &&
					step.condition === branchCondition
				);
			}
		});

		const maxOrder = Math.max(...sameBranchSteps.map((s) => s.order), 0);
		return maxOrder + 1;
	};

	const handleStepSelection = async (type: string) => {
		setLoading(true);

		// First, determine parent-child relationships
		let parentId = 0;
		let stepCondition: string | undefined = undefined;

		if (sourceStep && condition) {
			parentId = sourceStep.id;
			stepCondition = condition;
		} else if (sourceStep && sourceStep.parent_id) {
			// If sourceStep has a parent, the new step should also have the same parent and condition
			parentId = sourceStep.parent_id;
			stepCondition = sourceStep.condition || undefined;
		} else if (targetStep && targetStep.parent_id) {
			// If targetStep has a parent, the new step should also have the same parent and condition
			parentId = targetStep.parent_id;
			stepCondition = targetStep.condition || undefined;
		}

		// Calculate order: if we have targetStep, insert before it, otherwise add at end
		let order: number;
		if (targetStep) {
			order = targetStep.order;
		} else {
			// Find the highest order in the same branch
			const sameBranchSteps = steps.filter((step) => {
				if (parentId === 0) {
					return !step.parent_id;
				} else {
					return (
						step.parent_id === parentId &&
						step.condition === stepCondition
					);
				}
			});
			order = Math.max(...sameBranchSteps.map((s) => s.order), 0) + 1;
		}

		const stepData = {
			automation_id: automation.id,
			type,
			status: 'active',
			order,
		} as Partial<AutomationStep>;

		if (parentId > 0) {
			stepData.parent_id = parentId;
		}
		if (stepCondition) {
			stepData.condition = stepCondition;
		}

		if (type === 'condition') {
			stepData.action = 'condition';
		}

		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(steps, parentId, order, stepCondition);

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

			setPopoverVisible(false);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const handleAddStep = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPopoverVisible(!popoverVisible);
	};

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				style={style}
				markerEnd={markerEnd}
			/>
			<EdgeLabelRenderer>
				<div
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: 'all',
					}}
					className="qcrm-edge-add-button"
				>
					<Popover
						placement="top"
						trigger="click"
						open={popoverVisible}
						onOpenChange={setPopoverVisible}
						content={
							<>
								{loading && <Spin />}
								{!loading && (
									<Flex gap={10} wrap vertical>
										{map(typesOptions, (type, key) => (
											<Button
												key={key}
												icon={type.icon}
												onClick={() =>
													handleStepSelection(key)
												}
												style={{
													justifyContent:
														'flex-start',
												}}
											>
												{type.label}
											</Button>
										))}
									</Flex>
								)}
							</>
						}
					>
						<Button
							type="primary"
							shape="circle"
							size="small"
							icon={<PlusOutlined />}
							onClick={handleAddStep}
							title={__('Add step here', 'quillcrm')}
							style={{
								boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
								border: 'none',
							}}
						/>
					</Popover>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

export default AddStepEdge;
