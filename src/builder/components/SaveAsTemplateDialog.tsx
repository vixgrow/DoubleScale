/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploadControl } from '../blocks/basic/shared/ImageUploadControl';
import { getUserTemplates } from '../api/templates';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';

interface SaveAsTemplateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (
		templateName: string,
		thumbnailUrl?: string,
		templateId?: number
	) => Promise<void>;
	isSaving?: boolean;
}

export const SaveAsTemplateDialog: React.FC<SaveAsTemplateDialogProps> = ({
	isOpen,
	onClose,
	onSave,
	isSaving = false,
}) => {
	const [saveMode, setSaveMode] = useState<'new' | 'update'>('new');
	const [templateName, setTemplateName] = useState('');
	const [error, setError] = useState('');
	const [thumbnailUrl, setThumbnailUrl] = useState('');
	const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
	const [existingTemplates, setExistingTemplates] = useState<any[]>([]);
	const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
		null
	);
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

	// Load existing templates when dialog opens in update mode
	useEffect(() => {
		if (isOpen && saveMode === 'update') {
			setIsLoadingTemplates(true);
			getUserTemplates({ type: CAMPAIGN_CHANNEL.EMAIL })
				.then((templates) => {
					setExistingTemplates(templates);
				})
				.catch(() => {
					setError(__('Failed to load templates', 'quillcrm'));
				})
				.finally(() => {
					setIsLoadingTemplates(false);
				});
		}
	}, [isOpen, saveMode]);

	const handleSave = async () => {
		// Validate based on mode
		if (saveMode === 'update' && !selectedTemplateId) {
			setError(__('Please select a template to update', 'quillcrm'));
			return;
		}

		if (saveMode === 'new' && !templateName.trim()) {
			setError(__('Please enter a template name', 'quillcrm'));
			return;
		}

		try {
			await onSave(
				saveMode === 'new' ? templateName.trim() : '',
				saveMode === 'new' ? thumbnailUrl || undefined : undefined,
				saveMode === 'update'
					? selectedTemplateId || undefined
					: undefined
			);

			// Reset state on success
			setSaveMode('new');
			setTemplateName('');
			setError('');
			setThumbnailUrl('');
			setSelectedTemplateId(null);
			onClose();
		} catch (err: any) {
			setError(err.message || __('Failed to save template', 'quillcrm'));
		}
	};

	const handleClose = () => {
		// Don't close if media modal is open or if saving
		if (!isSaving && !isMediaModalOpen) {
			setSaveMode('new');
			setTemplateName('');
			setError('');
			setThumbnailUrl('');
			setSelectedTemplateId(null);
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isSaving) {
			handleSave();
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					handleClose();
				}
			}}
		>
			<DialogContent className="top-[35%]">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						{__('Save as Template', 'quillcrm')}
					</DialogTitle>
					<DialogDescription>
						{__(
							'Save this email design as a template so you could re-use it for your future emails.',
							'quillcrm'
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{/* Mode Selector with Radio Buttons */}
					<RadioGroup
						value={saveMode}
						onValueChange={(value: 'new' | 'update') => {
							setSaveMode(value);
							setSelectedTemplateId(null);
							setTemplateName('');
							setThumbnailUrl('');
							setError('');
						}}
						disabled={isSaving}
					>
						{/* Save as New Template Option */}
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="new" id="save-new" />
							<Label
								htmlFor="save-new"
								className="font-normal cursor-pointer"
							>
								{__('Save as a new template', 'quillcrm')}
							</Label>
						</div>

						{/* Update Existing Template Option */}
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="update" id="save-update" />
							<Label
								htmlFor="save-update"
								className="font-normal cursor-pointer"
							>
								{__('Update an existing template', 'quillcrm')}
							</Label>
						</div>
					</RadioGroup>

					{/* Conditional Content Based on Mode */}
					{saveMode === 'new' ? (
						<>
							{/* Template Name */}
							<div className="flex flex-col gap-2">
								<Label htmlFor="template-name">
									{__('Template Name', 'quillcrm')}
								</Label>
								<Input
									id="template-name"
									value={templateName}
									onChange={(e) => {
										setTemplateName(e.target.value);
										setError('');
									}}
									onKeyDown={handleKeyDown}
									placeholder={__(
										'Enter template name',
										'quillcrm'
									)}
									disabled={isSaving}
									className="h-10"
									style={{
										borderColor: error
											? '#ef4444'
											: '#e5e5e5',
										borderRadius: '0.5rem',
									}}
									autoFocus
								/>
							</div>

							{/* Thumbnail Upload */}
							<ImageUploadControl
								label={__(
									'Template Thumbnail (Optional)',
									'quillcrm'
								)}
								description={__(
									'Upload a thumbnail image to represent your template. This will help you identify it later.',
									'quillcrm'
								)}
								value={thumbnailUrl}
								onChange={({ src }) => setThumbnailUrl(src)}
								uploadId="template-thumbnail"
								disabled={isSaving}
								onModalStateChange={setIsMediaModalOpen}
								simpleMode={true}
							/>
						</>
					) : (
						<>
							{/* Template Selection */}
							<div className="flex flex-col gap-2">
								<Label htmlFor="template-select">
									{__('Select Template', 'quillcrm')}
								</Label>
								<Select
									value={selectedTemplateId?.toString() || ''}
									onValueChange={(value) => {
										setSelectedTemplateId(parseInt(value));
										setError('');
									}}
									disabled={isSaving || isLoadingTemplates}
								>
									<SelectTrigger
										id="template-select"
										className="h-10"
									>
										<SelectValue
											placeholder={
												isLoadingTemplates
													? __(
															'Loading templates...',
															'quillcrm'
														)
													: __(
															'Select a template to update',
															'quillcrm'
														)
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{existingTemplates.map((template) => (
											<SelectItem
												key={template.id}
												value={template.id.toString()}
											>
												{template.name}
											</SelectItem>
										))}
										{existingTemplates.length === 0 &&
											!isLoadingTemplates && (
												<div className="px-2 py-1.5 text-sm text-muted-foreground">
													{__(
														'No templates found',
														'quillcrm'
													)}
												</div>
											)}
									</SelectContent>
								</Select>
							</div>
						</>
					)}

					{error && <p className="text-sm text-red-500">{error}</p>}
				</div>

				<DialogFooter>
					<Button
						variant="gradient"
						onClick={handleSave}
						disabled={
							isSaving ||
							(saveMode === 'new' && !templateName.trim()) ||
							(saveMode === 'update' && !selectedTemplateId)
						}
						className="w-full"
					>
						{isSaving
							? __('Saving...', 'quillcrm')
							: saveMode === 'update'
								? __('Update Template', 'quillcrm')
								: __('Save Template', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
