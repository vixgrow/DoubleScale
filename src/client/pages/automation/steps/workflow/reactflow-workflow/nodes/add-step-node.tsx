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
import { Button, Flex, Popover, Spin } from 'antd';
import {
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	ThunderboltOutlined,
	PlusOutlined,
} from '@ant-design/icons';
import { map } from 'lodash';
import { Handle, Position, NodeProps } from '@xyflow/react';

/**
 * Internal dependencies
 */
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
	const { automation, steps, setSteps, setUpdatedSteps } =
		useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
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
		<div
			className="qcrm-reactflow-node qcrm-reactflow-node--add-step"
			style={{
				width: 'auto',
				height: 'auto',
				minWidth: 'auto',
				padding: '0',
				background: 'transparent',
				border: 'none',
				boxShadow: 'none',
			}}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
			/>

			<Popover
				placement="right"
				trigger="click"
				content={
					<>
						{loading && <Spin />}
						{!loading && (
							<Flex gap={10} wrap vertical>
								{map(typesOptions, (type, key) => (
									<Button
										key={key}
										icon={type.icon}
										onClick={() => handleStepSelection(key)}
										style={{
											justifyContent: 'flex-start',
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
				<div
					style={{
						pointerEvents: 'all',
					}}
					className="qcrm-edge-add-button"
				>
					<Button
						type="primary"
						shape="circle"
						size="small"
						icon={<PlusOutlined />}
						title={__('Add step here', 'quillcrm')}
						style={{
							boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
							border: 'none',
						}}
					/>
				</div>
			</Popover>

			<Handle
				type="source"
				position={Position.Bottom}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
			/>
		</div>
	);
};

export default AddStepNode;
