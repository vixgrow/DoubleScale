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
import type { AutomationStep } from '@quillcrm/client';
import StepFieldsModal from '../step-fields-modal';
import GoalSelector from '../goal-selector';
import ActionSelector from '../action-selector';
import ConditionsModal from '../conditions-modal';

interface StepModalProps {
	step: AutomationStep;
	setStep: (step: AutomationStep | null) => void;
}

const StepModal: React.FC<StepModalProps> = ({ step, setStep }) => {
	const { updateStep } = useAutomationContext();
	const [actionModalVisible, setActionModalVisible] = useState(!step.action);
	const [value, setValue] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');

	const saveStep = async (payload: any = {}) => {
		const data = {
			...step,
			action: value,
			...payload,
		};

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'POST',
				data,
			})) as AutomationStep;

			updateStep(response.id, response);
			setStep(null);
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
						onSave={() => saveStep()}
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
						onSave={() => saveStep()}
					/>
				);

			default:
				return null;
		}
	} else {
		return <StepFieldsModal step={step} setStep={setStep} />;
	}
};

export default StepModal;
