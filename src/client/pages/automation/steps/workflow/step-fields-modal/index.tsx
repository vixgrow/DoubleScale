/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */


/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import './style.scss';
import type { OrganizedStep } from '@quillcrm/client';
import { Fields } from '@quillcrm/components';
import { getAction, getGoal } from '@quillcrm/utils';
import { useAutomationContext } from '../../../state/context';
import { deleteStep } from '../reactflow-workflow/utils/step-utils';

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
	const [isDeleting, setIsDeleting] = useState(false);
	const [settings, setSettings] = useState(step.settings);
	const [currentStepId, setCurrentStepId] = useState(step.id);
	const { setMergeTagsVisible, createNotice } = useDispatch('quillcrm/core');
	const { steps, setSteps } = useAutomationContext();

	// Only sync settings when the step ID changes (switching to a different step)
	// This prevents resetting user's changes when the same step is updated after save
	useEffect(() => {
		if (step.id !== currentStepId) {
			setSettings(step.settings);
			setCurrentStepId(step.id);
		}
	}, [step.id, step.settings, currentStepId]);

	const handleSave = async () => {
		setIsSaving(true);

		const newStep = {
			...step,
			settings: {
				...step.settings, // Preserve existing settings (template_ids, etc.)
				...settings, // Merge with updated form values
			},
		};
		await saveStep(newStep);

		setIsSaving(false);
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		await deleteStep(step.id.toString(), steps, setSteps, createNotice);
		setIsDeleting(false);
		setStep(null); // Close the modal after deletion
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
				<Fields
					fields={action.fields}
					values={settings}
					onChange={(value) => {
						setSettings(value);
					}}
					enableMergeTags={true}
				/>
			</div>

			<div className="space-y-4">
				<Button
					onClick={handleSave}
					disabled={isSaving || isDeleting}
					variant="gradient"
					className="w-full"
					size="lg"
				>
					{isSaving
						? __('Saving...', 'quillcrm')
						: __('Save Changes', 'quillcrm')}
				</Button>

				<Button
					onClick={handleDelete}
					disabled={isSaving || isDeleting}
					variant="outline"
					className="w-full text-destructive border-destructive hover:text-destructive"
					size="lg"
				>
					{isDeleting
						? __('Deleting...', 'quillcrm')
						: __('Delete', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default StepFieldsModal;
