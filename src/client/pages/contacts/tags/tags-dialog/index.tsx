/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Tag as ContactTag } from '@doublescale/client';
import {
	CustomDialogHeader,
	Field,
	GradientTagIcon,
} from '@doublescale/components';
import { Button } from '@doublescale/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';

interface TagsDialogProps {
	visible: boolean;
	onVisibleChange: (visible: boolean) => void;
	selectedTag: ContactTag | null;
	tag: { name: string; description: string };
	onTagChange: (tag: { name: string; description: string }) => void;
	onSelectedTagChange: (tag: ContactTag | null) => void;
	onSubmit: () => void;
	isSaving: boolean;
}

export const TagsDialog: React.FC<TagsDialogProps> = ({
	visible,
	onVisibleChange,
	selectedTag,
	tag,
	onTagChange,
	onSelectedTagChange,
	onSubmit,
	isSaving,
}) => {
	const handleClose = (open: boolean) => {
		onVisibleChange(open);
		if (!open) {
			onSelectedTagChange(null);
			onTagChange({ name: '', description: '' });
		}
	};

	return (
		<Dialog open={visible} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={
								selectedTag
									? __('Edit Tag', 'doublescale')
									: __('Create Tag', 'doublescale')
							}
							subtitle={__(
								'Add basic information below to add new Tag',
								'doublescale'
							)}
							icon={<GradientTagIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="doublescale-fields space-y-4 mt-4">
					<Field
						label={__('Tag Name', 'doublescale')}
						value={selectedTag ? selectedTag.name : tag.name}
						onChange={(value) => {
							selectedTag
								? onSelectedTagChange({
										...selectedTag,
										name: value,
									})
								: onTagChange({ ...tag, name: value });
						}}
						type="text"
						placeholder={__('Enter Tag Name', 'doublescale')}
					/>
					<Field
						label={__('Tag Description', 'doublescale')}
						value={
							selectedTag
								? (selectedTag.description ?? '')
								: tag.description
						}
						onChange={(value) => {
							selectedTag
								? onSelectedTagChange({
										...selectedTag,
										description: value,
									})
								: onTagChange({ ...tag, description: value });
						}}
						type="textarea"
						placeholder={__('Enter Tag description', 'doublescale')}
					/>
				</div>

				<DialogFooter className="mt-6 w-full">
					<Button
						onClick={onSubmit}
						disabled={isSaving}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSaving
							? __('Submitting...', 'doublescale')
							: __('Submit', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
