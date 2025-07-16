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
			return targetStep.order;
		}

		// Adding at the end, so next order
		return sourceStep.order + 1;
	};

	const handleStepSelection = async (type: string) => {
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

		// Handle parent-child relationships
		if (sourceStep && condition) {
			stepData.parent_id = sourceStep.id;
			stepData.condition = condition;
		}

		const parentId = stepData.parent_id || 0;
		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(
				steps,
				parentId,
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
