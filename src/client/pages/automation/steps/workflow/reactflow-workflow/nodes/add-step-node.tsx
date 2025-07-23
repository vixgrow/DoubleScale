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
	PlusCircleOutlined,
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
		if (!parentId && !prevStep) {
			return 1;
		}

		if (prevStep) {
			return prevStep.order + 1;
		}

		return 1;
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
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="qcrm-reactflow-node qcrm-reactflow-node--add-step">
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
										style={{ justifyContent: 'flex-start' }}
									>
										{type.label}
									</Button>
								))}
							</Flex>
						)}
					</>
				}
			>
				<div className="qcrm-reactflow-node__add-button">
					<Button
						type="primary"
						icon={
							<PlusCircleOutlined style={{ fontSize: '24px' }} />
						}
						shape="circle"
						size="large"
						style={{ width: '60px', height: '60px' }}
					/>
				</div>
			</Popover>

			<Handle
				type="source"
				position={Position.Bottom}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
			/>
		</div>
	);
};

export default AddStepNode;
