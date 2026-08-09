import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RedoIcon, UndoIcon } from '@doublescale/shared/icons';
import BreadcrumbComponent from '@/components/breadcrumb';
import { useSelect, useDispatch, select } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useAutoSave } from '@doublescale/hooks/useAutoSave';
import { useUnsavedChanges } from '@doublescale/hooks/useUnsavedChanges';
import { useTemplateActions } from '@doublescale/hooks/useTemplateActions';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import { SendTestEmailPopover } from './SendTestEmailPopover';
import { DevicePreviewDialog } from './DevicePreviewDialog';
import { shouldShowCampaignBreadcrumb } from '../utils/builderMode';
import { BuilderData } from '../index';
import ArrowIcon from '@doublescale/shared/icons/dropdown-header';

interface HeaderProps {
	onSave?: (data: BuilderData) => Promise<void>;
	onClose?: () => void;
	autoSaveEnabled?: boolean;
	autoSaveInterval?: number;
	onTemplatesSaved?: () => void;
	handleNavigate?: (href: string) => void;
	/**
	 * When set, shows "Send test email" in embedded (onSave) mode — e.g. the
	 * automation "Send Email" action — using the current builder content plus
	 * the subject/from values this returns. Called at send time so the values
	 * are always current.
	 */
	getTestEmailContext?: () => {
		subject?: string;
		from_name?: string;
		from_email?: string;
		reply_to?: string;
	};
}

const Header: React.FC<HeaderProps> = ({
	onSave,
	onClose,
	autoSaveEnabled = true,
	autoSaveInterval = 10000,
	onTemplatesSaved,
	handleNavigate,
	getTestEmailContext,
}) => {
	const dispatch = useDispatch();
	const navigateFromRouter = useNavigate();
	const { createNotice } = useDispatch('doublescale/core');
	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	);

	const canUndo = useSelect((select) => select(STORE_KEY).canUndo(), []);
	const canRedo = useSelect((select) => select(STORE_KEY).canRedo(), []);
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);
	const buttonSettings = useSelect(
		(select) => select(STORE_KEY).getAllButtonSettings(),
		[]
	);
	const attachments = useSelect(
		(select) => select(STORE_KEY).getAttachments(),
		[]
	);

	// `onSave` is supplied only by the embedded hosts (automation "Send Email",
	// email sequences); see builderMode for why campaign chrome must key off
	// that rather than off the presence of a campaign.
	const showCampaignBreadcrumb = shouldShowCampaignBreadcrumb({
		hasOnSave: Boolean(onSave),
		hasCampaign: Boolean(campaign),
	});

	const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [previewHtml, setPreviewHtml] = useState('');
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState<string | null>(null);

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
			const path = `campaigns/${campaign.id}/contacts`;
			handleNavigate
				? handleNavigate(path)
				: navigateFromRouter(getToLink(path));
		}
	};

	/**
	 * Render the current email for preview.
	 *
	 * Always renders the live builder state rather than a saved template. Going
	 * through a saved template would show whatever was last persisted, so the
	 * preview looked "stuck" on old content after every edit — and in embedded
	 * mode (automation "Send Email", email sequences) there is often no saved
	 * template to read at all.
	 *
	 * Reads sections/settings from the store at call time so reopening the
	 * dialog always picks up the latest edits.
	 */
	const loadPreview = async () => {
		setPreviewLoading(true);
		setPreviewError(null);

		try {
			const {
				getSections,
				getGlobalSettings,
				getAllButtonSettings,
			} = select(STORE_KEY) as {
				getSections: () => unknown;
				getGlobalSettings: () => unknown;
				getAllButtonSettings: () => unknown;
			};

			const { html } = await apiFetch<{ html: string }>({
				path: '/doublescale/v1/automation-steps/preview-email',
				method: 'POST',
				data: {
					body: JSON.stringify({
						type: 'builder',
						value: {
							sections: getSections(),
							globalSettings: getGlobalSettings(),
							buttonSettings: getAllButtonSettings(),
						},
					}),
				},
			});
			setPreviewHtml(html);
		} catch (err) {
			setPreviewError(
				err instanceof Error
					? err.message
					: __('Failed to load preview.', 'doublescale')
			);
		} finally {
			setPreviewLoading(false);
		}
	};

	const handleOpenPreview = async () => {
		if (!ensureNotEmptyOrNotify()) return;

		setPreviewHtml('');
		setIsPreviewOpen(true);
		await loadPreview();
	};

	const handleChangeTemplate = () => {
		if (!campaign) return;
		const path = `campaigns/${campaign.id}/email-templates`;
		if (handleNavigate) {
			handleNavigate(path);
		} else {
			navigateFromRouter(getToLink(path) + '&changeTemplate=1');
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
		<div className="flex items-center flex-col lg:flex-row justify-center gap-3 lg:gap-0 lg:justify-between px-4 py-2 bg-primary-foreground border-b border-input flex-shrink-0">
			<div className="flex items-center align-center gap-2">
				{/*
				 * Campaign-only. In embedded mode (automation "Send Email",
				 * email sequences) the builder is a modal over an unrelated
				 * screen, but a campaign may still be cached in the store —
				 * showing its breadcrumb there points at the wrong flow.
				 */}
				{showCampaignBreadcrumb && campaign && (
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
			<div className="flex flex-col lg:flex-row items-center gap-3">
				<div className="flex items-center gap-3">
				<SaveStatusIndicator
					isSaving={isSaving}
					lastSaved={lastSaved}
					hasUnsavedChanges={hasUnsavedChanges}
					error={error}
				/>
				<div className="h-6 w-px bg-border" />
				<Button
					variant="ghost"
					className="px-3"
					onClick={() => dispatch(STORE_KEY).undo()}
					disabled={!canUndo}
					title={__('Undo last action', 'doublescale')}
				>
					<UndoIcon />
				</Button>
				<Button
					variant="ghost"
					className="px-3"
					onClick={() => dispatch(STORE_KEY).redo()}
					disabled={!canRedo}
					title={__('Redo last action', 'doublescale')}
				>
					<RedoIcon />
				</Button>
				<div className="h-6 w-px bg-border" />
				</div>
				{campaign && !onSave && (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="secondary"
									className="px-3"
									disabled={
										isSavingTemplate || isBuilderEmpty
									}
									title={__('Template options', 'doublescale')}
								>
									{__('Save as template', 'doublescale')}
									<ArrowIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() =>
										setIsTemplateDialogOpen(true)
									}
									disabled={
										isSavingTemplate || isBuilderEmpty
									}
								>
									{__('Save as template', 'doublescale')}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={handleChangeTemplate}
								>
									{__('Change template', 'doublescale')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<Button
							variant="secondary"
							className="px-3"
							onClick={handleOpenPreview}
							disabled={isSaving || isBuilderEmpty}
							title={__(
								'Preview on desktop, tablet and mobile',
								'doublescale'
							)}
						>
							{__('Preview', 'doublescale')}
						</Button>

						<SendTestEmailPopover
							campaignId={campaign.id}
							disabled={isSaving || isBuilderEmpty}
							onBeforeSend={async () => {
								if (!ensureNotEmptyOrNotify()) {
									return { success: false };
								}
								return save();
							}}
						/>

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
						{/*
						 * Unlike the test send, preview needs no subject/from
						 * context — it renders the builder content alone — so it
						 * is offered wherever the embedded builder is used.
						 */}
						<Button
							variant="secondary"
							className="px-3"
							onClick={handleOpenPreview}
							disabled={isSaving || isBuilderEmpty}
							title={__(
								'Preview on desktop, tablet and mobile',
								'doublescale'
							)}
						>
							{__('Preview', 'doublescale')}
						</Button>

						{getTestEmailContext && (
							<SendTestEmailPopover
								disabled={isSaving || isBuilderEmpty}
								getTestContent={() => ({
									...getTestEmailContext(),
									body: JSON.stringify({
										type: 'builder',
										value: {
											sections,
											globalSettings,
											buttonSettings,
											attachments,
										},
									}),
									attachments,
								})}
								onBeforeSend={async () => ({
									success: ensureNotEmptyOrNotify(),
								})}
							/>
						)}
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

			{/* Desktop / tablet / mobile preview */}
			<DevicePreviewDialog
				open={isPreviewOpen}
				onOpenChange={setIsPreviewOpen}
				html={previewHtml}
				loading={previewLoading}
				error={previewError}
				onRetry={loadPreview}
			/>
		</div>
	);
};

export default Header;
