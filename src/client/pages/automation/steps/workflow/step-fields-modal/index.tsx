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
import { Modal } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { AutomationStep } from '@quillcrm/client';
import { Fields } from '@quillcrm/components';
import { getAction, getGoal } from '@quillcrm/utils';

interface StepFieldsModalProps {
	step: AutomationStep;
	setStep: (step: AutomationStep | null) => void;
}

const StepFieldsModal: React.FC<StepFieldsModalProps> = ({ step, setStep }) => {
	const { updateStep } = useAutomationContext();
	const [isSaving, setIsSaving] = useState(false);
	const [settings, setSettings] = useState(step.settings);
	const { createNotice } = useDispatch('quillcrm/core');

	const saveStep = async () => {
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'POST',
				data: {
					...step,
					settings,
				},
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
		} finally {
			setIsSaving(false);
		}
	};

	const action =
		step.type === 'action' ? getAction(step.action) : getGoal(step.action);

	return (
		<Modal
			title={
				step.type === 'action'
					? __('Action', 'quillcrm')
					: __('Goal', 'quillcrm')
			}
			open={true}
			onOk={saveStep}
			onCancel={() => setStep(null)}
			confirmLoading={isSaving}
			style={{ minWidth: '800px', minHeight: '500px' }}
			closable={false}
		>
			<Fields
				fields={action.fields}
				values={settings}
				onChange={(value) => {
					setSettings(value);
				}}
			/>
		</Modal>
	);
};

export default StepFieldsModal;
