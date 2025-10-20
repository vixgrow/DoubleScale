/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { useState } from '@wordpress/element';

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

interface SaveAsTemplateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (templateName: string) => Promise<void>;
	isSaving?: boolean;
}

export const SaveAsTemplateDialog: React.FC<SaveAsTemplateDialogProps> = ({
	isOpen,
	onClose,
	onSave,
	isSaving = false,
}) => {
	const [templateName, setTemplateName] = useState('');
	const [error, setError] = useState('');

	const handleSave = async () => {
		// Validate template name
		if (!templateName.trim()) {
			setError(__('Please enter a template name', 'quillcrm'));
			return;
		}

		try {
			await onSave(templateName.trim());
			// Reset state on success
			setTemplateName('');
			setError('');
			onClose();
		} catch (err: any) {
			setError(err.message || __('Failed to save template', 'quillcrm'));
		}
	};

	const handleClose = () => {
		if (!isSaving) {
			setTemplateName('');
			setError('');
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isSaving) {
			handleSave();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="top-[22%]">
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
						placeholder={__('Enter template name', 'quillcrm')}
						disabled={isSaving}
						className="h-10"
						style={{
							borderColor: error ? '#ef4444' : '#e5e5e5',
							borderRadius: '0.5rem',
						}}
						autoFocus
					/>
					{error && <p className="text-sm text-red-500">{error}</p>}
				</div>

				<DialogFooter>
					<Button
						variant="gradient"
						onClick={handleSave}
						disabled={isSaving || !templateName.trim()}
						className="w-full"
					>
						{isSaving
							? __('Saving...', 'quillcrm')
							: __('Save Template', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
