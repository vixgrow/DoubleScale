/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState } from 'react';
/**
 * internal dependencies
 */
import {
	CustomDialogHeader,
	GradientGroupIcon,
	Field,
} from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GroupDialogProps } from '@quillcrm/client';

export const GroupDialog: React.FC<GroupDialogProps> = ({
	visible,
	onClose,
	onSave,
}) => {
	const [name, setName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!name) return;

		setIsSubmitting(true);
		const success = await onSave(name);
		if (success) {
			setName('');
			onClose();
		}
		setIsSubmitting(false);
	};

	return (
		<Dialog open={visible} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Add Group', 'quillcrm')}
							subtitle={__(
								'Add basic information below to add new Group.',
								'quillcrm'
							)}
							icon={<GradientGroupIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="qcrm-fields">
					<Field
						label={__('Name', 'quillcrm')}
						value={name}
						onChange={setName}
						type="text"
					/>
				</div>

				<DialogFooter className="mt-6 w-full">
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSubmitting
							? __('Submitting...', 'quillcrm')
							: __('Submit', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
