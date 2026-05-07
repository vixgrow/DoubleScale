import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useNavigate, getToLink } from '@doublescale/navigation';
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
	onTemplatesSaved?: () => void;
	handleNavigate?: (href: string) => void;
}

const Header: React.FC<HeaderProps> = ({
	onSave,
	onClose,
	autoSaveEnabled = true,
	autoSaveInterval = 10000,
	onTemplatesSaved,
	handleNavigate,
}) => {
	const dispatch = useDispatch();
	const navigate = handleNavigate ? handleNavigate : useNavigate();
	const { createNotice } = useDispatch('doublescale/core');
	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	);

	const canUndo = useSelect((select) => select(STORE_KEY).canUndo(), []);
	const canRedo = useSelect((select) => select(STORE_KEY).canRedo(), []);
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);

	const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

	// Check if builder is empty
	const isBuilderEmpty =
		!sections?.length ||
		sections.every(
			(section) =>
				!section.columns?.length ||
				section.columns.every((column) => !column.blocks?.length)
		);

	// Centralized notice and guard
	const showEmptyBuilderNotice = () =>
		createNotice({
			type: 'error',
			message: __(
				'The builder cannot be empty. Please add at least one block before saving.',
				'doublescale'
			),
		});

	const ensureNotEmptyOrNotify = (): boolean => {
		if (isBuilderEmpty) {
			showEmptyBuilderNotice();
			return false;
		}
		return true;
	};

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
		if (!ensureNotEmptyOrNotify()) return;

		const { success } = await save();
		if (success && campaign) {
			handleNavigate
				? handleNavigate(`campaigns/${campaign.id}/contacts`)
				: navigate(getToLink(`campaigns/${campaign.id}/contacts`));
		}
	};

	const handleSaveAsTemplate = async (
		templateName: string,
		thumbnailUrl?: string,
		templateId?: number
	) => {
		await saveAsTemplate(templateName, thumbnailUrl, templateId);
		setIsTemplateDialogOpen(false);

		// Trigger templates refresh in sidebar
		if (onTemplatesSaved) {
			onTemplatesSaved();
		}
	};
	return (
		<div className="flex items-center justify-between px-4 py-2 bg-primary-foreground border-b border-input flex-shrink-0">
			<div className="flex items-center align-center gap-2">
				{campaign && (
					<BreadcrumbComponent
						items={[
							{ label: __('Create Campaign', 'doublescale') },
							{
								label: __('Standard Campaign', 'doublescale'),
								href: `campaigns/${campaign.id}/template`,
							},
							{ label: __('Email Template', 'doublescale') },
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
					title={__('Undo last action', 'doublescale')}
				>
					<UndoIcon />
				</Button>
				<Button
					variant="outline"
					className="px-3"
					onClick={() => dispatch(STORE_KEY).redo()}
					disabled={!canRedo}
					title={__('Redo last action', 'doublescale')}
				>
					<RedoIcon />
				</Button>
				<div className="h-6 w-px bg-border" />
				{campaign && (
					<>
						<Button
							variant="secondary"
							className="px-3"
							onClick={() => setIsTemplateDialogOpen(true)}
							disabled={isSavingTemplate || isBuilderEmpty}
							title={__('Save as template', 'doublescale')}
						>
							{__('Save as Template', 'doublescale')}
						</Button>

						<Button
							variant="default"
							className="px-3 min-w-[200px]"
							onClick={handleSaveAndContinue}
							disabled={isSaving || isBuilderEmpty}
						>
							{isSaving
								? __('Saving...', 'doublescale')
								: __('Save & choose recipients', 'doublescale')}
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
								{__('Cancel', 'doublescale')}
							</Button>
						)}
						<Button
							variant="default"
							className="px-3"
							onClick={() => {
								if (!ensureNotEmptyOrNotify()) return;
								save();
							}}
							disabled={isSaving || isBuilderEmpty}
						>
							{isSaving
								? __('Saving...', 'doublescale')
								: __('Save', 'doublescale')}
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
