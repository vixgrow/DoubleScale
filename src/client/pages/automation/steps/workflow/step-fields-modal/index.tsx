/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button } from '@/components/ui/button';

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
	const { setMergeTagsVisible } = useDispatch('quillcrm/core');

	const handleSave = async () => {
		setIsSaving(true);

		const newStep = {
			...step,
			settings,
		};
		await saveStep(newStep);

		setIsSaving(false);
	};

	// For delay steps, the action should be 'delay'
	const actionKey = step.type === 'delay' ? 'delay' : step.action;

	const action =
		step.type === 'action' || step.type === 'delay'
			? getAction(actionKey)
			: getGoal(step.action);

	return (
		<div className="qcrm-step-fields-content flex flex-col">
			<div className="mb-4">
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setMergeTagsVisible(true);
					}}
					className="w-full"
				>
					{__('Merge Tags', 'quillcrm')}
				</Button>
			</div>

			<div className="mb-4">
				<Fields
					fields={action.fields}
					values={settings}
					onChange={(value) => {
						setSettings(value);
					}}
				/>
			</div>

			<div className="">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					variant="gradient"
					className="w-full"
					size="xl"
				>
					{isSaving
						? __('Saving...', 'quillcrm')
						: __('Save Changes', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default StepFieldsModal;
