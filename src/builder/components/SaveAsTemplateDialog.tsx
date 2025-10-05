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

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isSaving) {
			handleSave();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						{__('Save as Template', 'quillcrm')}
					</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
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
							onKeyPress={handleKeyPress}
							placeholder={__('Enter template name', 'quillcrm')}
							disabled={isSaving}
							className="h-10"
							style={{
								borderColor: error ? '#ef4444' : '#e5e5e5',
								borderRadius: '0.5rem',
							}}
							autoFocus
						/>
						{error && (
							<p className="text-sm text-red-500">{error}</p>
						)}
					</div>

					<p className="text-sm text-gray-500">
						{__(
							'This will save your current email design as a reusable template.',
							'quillcrm'
						)}
					</p>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isSaving}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						variant="gradient"
						onClick={handleSave}
						disabled={isSaving || !templateName.trim()}
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
