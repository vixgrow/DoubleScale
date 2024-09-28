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
import type { OrganizedStep, Automation } from '@quillcrm/client';
import StepFieldsModal from '../step-fields-modal';
import GoalSelector from '../goal-selector';
import ActionSelector from '../action-selector';
import ConditionsModal from '../conditions-modal';

interface StepModalProps {
	step: OrganizedStep;
	setStep: (step: OrganizedStep | null) => void;
}

const StepModal: React.FC<StepModalProps> = ({ step, setStep }) => {
	const { setSteps, updatedSteps, updateStep, setUpdatedSteps } =
		useAutomationContext();
	const [actionModalVisible, setActionModalVisible] = useState(!step.action);
	const [value, setValue] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');
	console.log(updatedSteps, 'updatedSteps');
	const saveStep = async (payload: Partial<OrganizedStep>) => {
		const data = {
			step: {
				...step,
				...payload,
			},
			mode: 'add',
			updated_steps: updatedSteps,
		};

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${step.automation_id}`,
				method: 'POST',
				data,
			})) as Automation;

			setStep(null);
			setUpdatedSteps({});
			setSteps(response.steps);
			createNotice({
				type: 'success',
				message: __('Automation updated', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to update automation', 'quillcrm'),
			});
		}
	};

	const saveEmptyStep = async () => {
		const data = {
			...step,
			action: value,
		};

		updateStep(step.id, data);
		setStep(data);
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
						onSave={() => saveEmptyStep()}
					/>
				);
			case 'goal':
				return (
					<GoalSelector
						value={value}
						visible={actionModalVisible}
						onClose={() => {
							setActionModalVisible(false);
							setStep(null);
						}}
						onChange={(value) => setValue(value)}
						onSave={() => saveEmptyStep()}
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
