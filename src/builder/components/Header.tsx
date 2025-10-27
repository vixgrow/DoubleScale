import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useAutoSave } from '../hooks/useAutoSave';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useTemplateActions } from '../hooks/useTemplateActions';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import { BuilderData } from '../index';

interface HeaderProps {
	onSave?: (data: BuilderData) => Promise<void>;
	onClose?: () => void;
	autoSaveEnabled?: boolean;
	autoSaveInterval?: number;
}

const Header: React.FC<HeaderProps> = ({
	onSave,
	onClose,
	autoSaveEnabled = true,
	autoSaveInterval = 10000,
}) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	);

	const canUndo = useSelect((select) => select(STORE_KEY).canUndo(), []);
	const canRedo = useSelect((select) => select(STORE_KEY).canRedo(), []);

	const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

	const { saveAsTemplate, isSaving: isSavingTemplate } = useTemplateActions();

	// Use auto-save hook with custom save callback if provided
	const { isSaving, lastSaved, hasUnsavedChanges, error, save } = useAutoSave(
		{
			interval: autoSaveInterval,
			enabled: autoSaveEnabled,
			customSaveCallback: onSave,
		}
	);

	// Use unsaved changes warning
	useUnsavedChanges({
		hasUnsavedChanges,
	});

	const handleSaveAndContinue = async () => {
		const { success } = await save();
		if (success && campaign) {
			// Template is already linked via campaign.settings.template_ids
			navigate(getToLink(`campaigns/${campaign.id}/contacts`));
		}
	};

	const handleSaveAsTemplate = async (templateName: string) => {
		await saveAsTemplate(templateName);
		setIsTemplateDialogOpen(false);
	};
	return (
		<div className="flex items-center justify-between px-4 py-2 bg-primary-foreground border-b border-input flex-shrink-0">
			<div className="flex items-center align-center gap-2">
				{campaign && (
					<BreadcrumbComponent
						items={[
							{ label: __('Create Campaign', 'quillcrm') },
							{ label: __('Standard Campaign', 'quillcrm') },
							{ label: __('Email Template', 'quillcrm') },
						]}
					/>
				)}
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
				{campaign && (
					<>
						<Button
							variant="outline"
							className="px-3 text-muted-foreground"
						>
							<PreviewIcon />
							{__('Preview & test', 'quillcrm')}
						</Button>
						<Button
							variant="secondary"
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
								: __('Save & choose recipients', 'quillcrm')}
						</Button>
					</>
				)}

				{onSave && (
					<>
						{onClose && (
							<Button
								variant="outline"
								className="px-3"
								onClick={onClose}
								disabled={isSaving}
							>
								{__('Cancel', 'quillcrm')}
							</Button>
						)}
						<Button
							variant="default"
							className="px-3"
							onClick={() => save()}
							disabled={isSaving}
						>
							{isSaving
								? __('Saving...', 'quillcrm')
								: __('Save', 'quillcrm')}
						</Button>
					</>
				)}
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
