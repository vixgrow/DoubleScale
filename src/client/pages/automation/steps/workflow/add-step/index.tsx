/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import { AddStepDialog } from '../add-step-dialog';

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
	const [visible, setVisible] = useState(false);
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
			if (
				type === 'action' ||
				type === 'condition' ||
				type === 'goal' ||
				type === 'delay'
			) {
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

	return (
		<AddStepDialog
			visible={visible}
			onVisibleChange={setVisible}
			loading={loading}
			onStepSelection={storeStep}
		/>
	);
};

export default AddStep;
