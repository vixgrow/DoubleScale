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
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploadControl } from '../blocks/basic/shared/ImageUploadControl';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { CustomDialogHeader, SaveAsTemplateIcon } from '@doublescale/components';
import type { SavedBlockCategory } from '../types/common';

const CATEGORY_OPTIONS: { value: SavedBlockCategory; label: string }[] = [
	{ value: 'header', label: __('Header', 'doublescale') },
	{ value: 'footer', label: __('Footer', 'doublescale') },
	{ value: 'hero', label: __('Hero', 'doublescale') },
	{ value: 'cta', label: __('CTA', 'doublescale') },
	{ value: 'gallery', label: __('Gallery', 'doublescale') },
	{ value: 'custom', label: __('Custom', 'doublescale') },
];

interface SaveAsBlockDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (
		blockName: string,
		category: SavedBlockCategory,
		thumbnailUrl?: string
	) => Promise<void>;
	isSaving?: boolean;
}

export const SaveAsBlockDialog: React.FC<SaveAsBlockDialogProps> = ({
	isOpen,
	onClose,
	onSave,
	isSaving = false,
}) => {
	const [blockName, setBlockName] = useState('');
	const [category, setCategory] = useState<SavedBlockCategory>('custom');
	const [error, setError] = useState('');
	const [thumbnailUrl, setThumbnailUrl] = useState('');
	const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

	const handleSave = async () => {
		if (!blockName.trim()) {
			setError(__('Please enter a block name', 'doublescale'));
			return;
		}

		try {
			await onSave(blockName.trim(), category, thumbnailUrl || undefined);
			setBlockName('');
			setCategory('custom');
			setError('');
			setThumbnailUrl('');
			onClose();
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: __('Failed to save block', 'doublescale');
			setError(message);
		}
	};

	const handleClose = () => {
		if (!isSaving && !isMediaModalOpen) {
			setBlockName('');
			setCategory('custom');
			setError('');
			setThumbnailUrl('');
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
			<DialogContent className="bg-white">
				<CustomDialogHeader
					title={__('Save as Block', 'doublescale')}
					subtitle={__(
						'Save this section to your block library for reuse in other emails.',
						'doublescale'
					)}
					icon={<SaveAsTemplateIcon />}
				/>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="block-name">
							{__('Block Name', 'doublescale')}
						</Label>
						<Input
							id="block-name"
							value={blockName}
							onChange={(e) => {
								setBlockName(e.target.value);
								setError('');
							}}
							onKeyDown={handleKeyDown}
							placeholder={__(
								'Enter block name',
								'doublescale'
							)}
							disabled={isSaving}
							className="h-12"
							style={{
								borderColor: error ? '#ef4444' : '#e5e5e5',
								borderRadius: '0.5rem',
							}}
							autoFocus
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="block-category">
							{__('Category', 'doublescale')}
						</Label>
						<Select
							value={category}
							onValueChange={(value) =>
								setCategory(value as SavedBlockCategory)
							}
							disabled={isSaving}
						>
							<SelectTrigger id="block-category" className="h-12">
								<SelectValue
									placeholder={__(
										'Select category',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{CATEGORY_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="rounded-xl bg-gradient-to-r from-primary to-[#1B1145] p-4">
						<ImageUploadControl
							label={__(
								'Block Thumbnail (Optional)',
								'doublescale'
							)}
							description={__(
								'Upload a thumbnail to identify this block in your library.',
								'doublescale'
							)}
							value={thumbnailUrl}
							onChange={({ src }) => setThumbnailUrl(src)}
							uploadId="block-thumbnail"
							disabled={isSaving}
							onModalStateChange={setIsMediaModalOpen}
							simpleMode={true}
						/>
					</div>

					{error && <p className="text-sm text-red-500">{error}</p>}
				</div>

				<DialogFooter>
					<Button
						variant="gradient"
						onClick={handleSave}
						disabled={isSaving || !blockName.trim()}
						className="w-full"
					>
						{isSaving
							? __('Saving...', 'doublescale')
							: __('Save Block', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
