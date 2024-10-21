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
	order: number,
	condition?: string
) => {
	const updatedSteps = {};
	const newSteps = [...steps];

	if (parentId > 0) {
		const children = !condition ? newSteps.filter((step) => step.parent_id === parentId) : newSteps.filter((step) => step.parent_id === parentId && step.condition === condition);

		children.sort((a, b) => a.order - b.order);
		children.forEach((child, index) => {
			const newOrder = index + 1;
			if (newOrder !== child.order) {
				updatedSteps[child.id] = { order: newOrder };
			}
		});
		children.forEach((child) => {
			if (child.order >= order) {
				child.order = child.order + 1;
				updatedSteps[child.id] = { order: child.order };
			}

		});
	} else {
		newSteps.sort((a, b) => a.order - b.order);
		newSteps.forEach((step, index) => {
			const newOrder = index + 1;
			if (newOrder !== step.order) {
				updatedSteps[step.id] = { order: newOrder };
			}
		});
		newSteps.forEach((step) => {
			if (step.order >= order) {
				step.order = step.order + 1;
				updatedSteps[step.id] = { order: step.order };
			}
		});
	}

	return { newSteps, updatedSteps };
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
			status: type === 'end_automation' ? 'active' : 'draft',
			order,
		} as AutomationStep;

		if (type === 'condition') {
			stepData.action = 'condition';
		}

		if (parentId && condition) {
			stepData.parent_id = parentId;
			stepData.condition = condition;
		}

		const { newSteps, updatedSteps } = updateStepOrderRecursive(
			steps,
			parentId || 0,
			order,
			condition
		);

		const data = {
			...stepData,
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
			setStep(organizedStep);
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
									onClick={() => storeStep(key)
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
