/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';

/**
 * Internal dependencies
 */
import { useActivityOperations } from '../../hooks/use-activity-operations';
import './style.scss';
import { CustomDialogHeader } from '@quillcrm/components';
import NoteAddIcon from '@quillcrm/components/icons/note-add';
import { useDispatch } from '@wordpress/data';

interface AddNoteModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	dealId: number;
	dealTitle?: string;
}
const noteSchema = z.object({
	// dealTitle: z.string().optional(),
	note: z
		.string()
		.min(3, {
			message: __('Note must be at least 3 characters long', 'quillcrm'),
		})
		.max(5000, {
			message: __('Note cannot exceed 5000 characters', 'quillcrm'),
		}),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
	visible,
	onClose,
	onSuccess,
	dealId,
	dealTitle,
}) => {
	const [loading, setLoading] = useState(false);
	const { addNote } = useActivityOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const form = useForm<NoteFormValues>({
		resolver: zodResolver(noteSchema),
		defaultValues: {
			// dealTitle: dealTitle || '',
			note: '',
		},
	});

	const handleSubmitForm = async (values: { note: string }) => {
		setLoading(true);
		try {
			await addNote(dealId, values.note);
			createNotice?.({
				type: 'success',
				message: __(`Deal "Note added successfully!`, 'quillcrm'),
			});
			form.reset();
			onSuccess();
			onClose();
		} catch (error) {
			const err = error as Error;
			createNotice?.({
				type: 'error',
				message: err.message || __('Failed to add note', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		form.reset();
		onClose();
	};

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) handleCancel();
			}}
		>
			<DialogContent className="w-full max-w-2xl   z-[100000] max-h-[80vh] my-2 mx-5 sm:mx-auto overflow-y-auto  p-8 rounded-[16px]">
				<DialogHeader>
					<DialogTitle className="!mb-0">
						<CustomDialogHeader
							title={__('Add Note', 'quillcrm')}
							subtitle=""
							icon={<NoteAddIcon />}
						/>
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmitForm)}
						className="space-y-4"
					>
						{/* Deal Title (read-only) */}

						<div className="flex flex-col gap-1">
							<Label className="font-normal text-[#09090B] text-base">
								{__('Deal Name', 'quillcrm')}
							</Label>
							<Input
								readOnly
								value={dealTitle || ''}
								className="h-12 py-[5px] px-4 bg-[#F0F0F0] border border-[#DEE1E6] rounded-[8px]"
								placeholder="Deal Name"
							/>
						</div>

						{/* Note Field */}
						<FormField
							control={form.control}
							name="note"
							render={({ field }) => (
								<FormItem>
									<FormLabel className='font-normal text-[#09090B] text-base after:content-["*"] after:ml-1 after:text-red-500'>
										{__('Note', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											rows={6}
											placeholder={__(
												'Enter your note here...',
												'quillcrm'
											)}
											className=" py-3 px-4 mb-3 border border-[#DEE1E6] rounded-[8px] bg-[#FFF]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* button */}
						<div className="mt-2">
							<Button
								type="submit"
								disabled={loading}
								className="w-full bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex h-12 justify-center items-center gap-2 rounded-md font-manrope text-base font-medium tracking-tight hover:opacity-90 transition-all duration-200"
							>
								{loading
									? __('Adding...', 'quillcrm')
									: __('Add Note', 'quillcrm')}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
