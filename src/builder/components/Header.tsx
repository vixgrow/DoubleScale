import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useAutoSave } from '../hooks/useAutoSave';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import { saveEmailAsTemplate } from '../api/templates';

const Header: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	);

	const canUndo = useSelect((select) => select(STORE_KEY).canUndo(), []);
	const canRedo = useSelect((select) => select(STORE_KEY).canRedo(), []);

	// Get builder data for template saving
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);
	const buttonSettings = useSelect(
		(select) => select(STORE_KEY).getAllButtonSettings(),
		[]
	);

	// State for template dialog
	const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
	const [isSavingTemplate, setIsSavingTemplate] = useState(false);

	// Use auto-save hook
	const { isSaving, lastSaved, hasUnsavedChanges, error, save } = useAutoSave(
		{
			interval: 10000, // Auto-save every 10 seconds
			enabled: true,
		}
	);

	// Use unsaved changes warning
	useUnsavedChanges({
		hasUnsavedChanges,
	});

	const handleSaveAndContinue = async () => {
		if (!campaign) {
			return;
		}

		const saveSuccess = await save();
		if (saveSuccess) {
			navigate(getToLink(`campaigns/${campaign.id}/contacts`));
		}
	};

	const handleSaveAsTemplate = async (templateName: string) => {
		setIsSavingTemplate(true);

		try {
			// Prepare builder data
			const builderData = {
				sections: sections,
				globalSettings: globalSettings,
				buttonSettings: buttonSettings,
			};

			// Prepare template data
			const templateData = {
				name: templateName,
				type: 'email',
				subject: '',
				body: JSON.stringify(builderData),
				settings: JSON.stringify({
					type: 'builder',
				}),
				hidden: 0, // Make it visible in templates list
				category: 'custom',
				is_pro: 0,
			};

			// Save template
			await saveEmailAsTemplate(templateData);

			// Show success message (you can use a toast notification here)
			console.log('Template saved successfully!');

			// Close dialog
			setIsTemplateDialogOpen(false);
		} catch (error: any) {
			console.error('Error saving template:', error);
			throw error; // Re-throw to let dialog handle the error
		} finally {
			setIsSavingTemplate(false);
		}
	};
	return (
		<div className="flex items-center justify-between p-4 bg-primary-foreground border-b border-input">
			<div className="flex items-center align-center gap-2">
				<X className="h-5 w-5 text-primary" />
				<BreadcrumbComponent
					items={[
						{ label: __('Create Campaign', 'quillcrm') },
						{ label: __('Standard Campaign', 'quillcrm') },
						{ label: __('Email Template', 'quillcrm') },
					]}
				/>
			</div>
			<div className="flex items-center gap-3">
				<SaveStatusIndicator
					isSaving={isSaving}
					lastSaved={lastSaved}
					hasUnsavedChanges={hasUnsavedChanges}
					error={error}
				/>
				<div className="h-6 w-px bg-border" />
				<Button
					variant="outline"
					className="px-3"
					onClick={() => dispatch(STORE_KEY).undo()}
					disabled={!canUndo}
					title={__('Undo last action', 'quillcrm')}
				>
					<UndoIcon />
				</Button>
				<Button
					variant="outline"
					className="px-3"
					onClick={() => dispatch(STORE_KEY).redo()}
					disabled={!canRedo}
					title={__('Redo last action', 'quillcrm')}
				>
					<RedoIcon />
				</Button>
				<div className="h-6 w-px bg-border" />
				<Button
					variant="outline"
					className="px-3 text-muted-foreground"
				>
					<PreviewIcon />
					{__('Preview & test', 'quillcrm')}
				</Button>
				<Button
					variant="outline"
					className="px-3"
					onClick={() => setIsTemplateDialogOpen(true)}
					disabled={isSavingTemplate}
					title={__('Save as template', 'quillcrm')}
				>
					{__('Save as Template', 'quillcrm')}
				</Button>
				<Button
					variant="default"
					className="px-3"
					onClick={handleSaveAndContinue}
					disabled={isSaving}
				>
					{isSaving
						? __('Saving...', 'quillcrm')
						: __('Save & Continue', 'quillcrm')}
				</Button>
			</div>

			{/* Save as Template Dialog */}
			<SaveAsTemplateDialog
				isOpen={isTemplateDialogOpen}
				onClose={() => setIsTemplateDialogOpen(false)}
				onSave={handleSaveAsTemplate}
				isSaving={isSavingTemplate}
			/>
		</div>
	);
};

export default Header;
