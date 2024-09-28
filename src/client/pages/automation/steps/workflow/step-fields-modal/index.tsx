/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Modal } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { OrganizedStep } from '@quillcrm/client';
import { Fields } from '@quillcrm/components';
import { getAction, getGoal } from '@quillcrm/utils';

interface StepFieldsModalProps {
	step: OrganizedStep;
	setStep: (step: OrganizedStep | null) => void;
	saveStep: (step: Partial<OrganizedStep>) => void;
}

const StepFieldsModal: React.FC<StepFieldsModalProps> = ({
	step,
	setStep,
	saveStep,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const [settings, setSettings] = useState(step.settings);

	const handleSave = async () => {
		setIsSaving(true);

		const newStep = {
			...step,
			settings,
		};
		await saveStep(newStep);

		setIsSaving(false);
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
			onOk={handleSave}
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
