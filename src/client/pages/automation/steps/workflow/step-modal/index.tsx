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
import type {
	OrganizedStep,
	AutomationStep,
} from '@quillcrm/client';
import StepFieldsModal from '../step-fields-modal';
import GoalSelector from '../goal-selector';
import ActionSelector from '../action-selector';
import ConditionsModal from '../conditions-modal';
import { getAction, getGoal } from '@quillcrm/utils';
import { isEmpty } from 'lodash';

interface StepModalProps {
	step: OrganizedStep;
	setStep: (step: OrganizedStep | null) => void;
}

const StepModal: React.FC<StepModalProps> = ({ step, setStep }) => {
	const { updateStep } =
		useAutomationContext();
	const [actionModalVisible, setActionModalVisible] = useState(true);
	const [value, setValue] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');

	if (step.action && step.type !== 'condition') {
		const action =
			step.type === 'action' ? getAction(step.action) : getGoal(step.action);
		if (isEmpty(action.fields)) {
			setStep(null);
			return null;
		}
	}

	const saveStep = async (payload: Partial<OrganizedStep> = {}) => {
		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'POST',
				data: {
					...step,
					...payload,
					status: 'active',
				},
			})) as AutomationStep;

			const organizedStep = {
				...response,
				children: step.children,
			} as OrganizedStep;

			updateStep(response.id, response);
			setStep(organizedStep);
			createNotice({
				type: 'success',
				message: __('Automation updated', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const saveActionStep = async (actionValue?: string) => {
		const valueToSave = actionValue || value;
		if (!valueToSave) {
			createNotice({
				type: 'error',
				message: __('Please select an action', 'quillcrm'),
			});
			return;
		}
		const data = {
			...step,
			action: valueToSave,
		};

		await saveStep(data);
	};

	if (step.type === 'condition') {
		return (
			<ConditionsModal
				step={step}
				onSave={saveStep}
				visible={actionModalVisible}
				onClose={() => {
					setActionModalVisible(false);
					setStep(null);
				}}
			/>
		);
	}

	if (!step.action) {
		switch (step.type) {
			case 'action':
				return (
					<ActionSelector
						value={value}
						visible={actionModalVisible}
						onClose={() => {
							setActionModalVisible(false);
							setStep(null);
						}}
						onChange={(value) => setValue(value)}
						onSave={(actionKey) => saveActionStep(actionKey)}
					/>
				);
			case 'goal':
				return (
					<GoalSelector
						value={value}
						onChange={(value) => setValue(value)}
						onSave={(goalKey) => saveActionStep(goalKey)}
					/>
				);

			default:
				return null;
		}
	} else {
		return (
			<StepFieldsModal
				step={step}
				setStep={setStep}
				saveStep={saveStep}
			/>
		);
	}
};

export default StepModal;
