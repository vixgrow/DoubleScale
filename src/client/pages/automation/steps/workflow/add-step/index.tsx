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

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';

const updateStepOrderRecursive = (
	steps: AutomationStep[],
	parentId: number,
	order: number
) => {
	const updatedSteps = {};
	const newSteps = updateOrder(parentId, order, steps, updatedSteps);

	return { newSteps, updatedSteps };
};

const updateOrder = (
	parentId: number,
	order: number,
	steps: AutomationStep[],
	updatedSteps: { [key: string]: Partial<AutomationStep> }
) => {
	if (parentId > 0) {
		const children = steps.filter((step) => step.parent_id === parentId);
		children.forEach((child) => {
			if (child.order >= order) {
				child.order = child.order + 1;
				updatedSteps[child.id] = { order: child.order };
			}
		});
	} else {
		steps.forEach((step) => {
			if (step.order >= order) {
				step.order = step.order + 1;
				updatedSteps[step.id] = { order: step.order };
			}
		});
	}

	return steps;
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
	const { automation, steps, setSteps, addStep, setUpdatedSteps } =
		useAutomationContext();
	const [loading, setLoading] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
	}

	const saveStep = (type: string) => {
		const randomStringID = Math.random();
		const order = getNewStepOrder();
		const data = {
			id: randomStringID,
			automation_id: automation.id,
			type,
			status: 'active',
			order,
			parent_id: 0,
			action: '',
			temp: true,
		} as AutomationStep;

		if (type === 'condition' && condition) {
			data.action = condition;
		}

		if (parentId && condition) {
			data.parent_id = parentId;
			data.condition = condition;
		}

		const { newSteps, updatedSteps } = updateStepOrderRecursive(
			steps,
			parentId || 0,
			order
		);
		console.log(updatedSteps);

		setUpdatedSteps(updatedSteps);
		setSteps([...newSteps, data]);
		setStep(null);
	};

	const storeStep = async (type: string) => {
		setLoading(true);

		const order = getNewStepOrder();
		const data = {
			automation_id: automation.id,
			type,
			status: 'active',
			order,
		} as AutomationStep;

		if (type === 'condition' && condition) {
			data.action = condition;
		}

		if (parentId && condition) {
			data.parent_id = parentId;
			data.condition = condition;
		}

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps`,
				method: 'POST',
				data,
			})) as AutomationStep;

			addStep(response);
			setStep(response as OrganizedStep);
			createNotice({
				type: 'success',
				message: __('Step added', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to add step', 'quillcrm'),
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
			// @ts-ignore
			return parseInt(prevStep.order) + 1;
		}

		return 1;
	};

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

	return (
		<Popover
			placement="top"
			trigger="click"
			content={
				<>
					{loading && <Spin />}
					{!loading && (
						<Flex gap={10} wrap>
							{map(typesOptions, (type, key) => (
								<Button
									key={key}
									icon={type.icon}
									onClick={() =>
										key == 'end_automation' ||
										key == 'goal' ||
										key == 'condition'
											? storeStep(key)
											: saveStep(key)
									}
								>
									{type.label}
								</Button>
							))}
						</Flex>
					)}
				</>
			}
		>
			<Flex
				justify="center"
				align="center"
				className="qcrm-automation-workflow__add-step"
			>
				<Button
					type="primary"
					icon={<PlusCircleOutlined />}
					style={{
						borderRadius: '50%',
					}}
					className="add-step-button"
				/>
			</Flex>
		</Popover>
	);
};

export default AddStep;
