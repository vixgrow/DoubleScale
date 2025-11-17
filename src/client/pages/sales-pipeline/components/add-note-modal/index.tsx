/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState,useRef } from '@wordpress/element';

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
import { CustomDialogHeader, NoticeBanner } from '@quillcrm/components';
import NoteAddIcon from '@quillcrm/components/icons/note-add';
import { useDispatch } from '@wordpress/data';
import { NoticeMessage } from '@/client/types';

interface AddNoteModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: ( notice?: { type: 'success' | 'error'; message: string }) => void;
	dealId: number;
	dealTitle?: string;
	editMode?: boolean;
	activity?: any;
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
	editMode = false,
	activity,
}) => {
	const [loading, setLoading] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const { addNote, updateActivity } = useActivityOperations();
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const form = useForm<NoteFormValues>({
		resolver: zodResolver(noteSchema),
		defaultValues: {
			// dealTitle: dealTitle || '',
			note: '',
		},
	});

	// Load existing activity data when in edit mode
	useEffect(() => {
		if (editMode && activity && visible) {
			form.reset({
				note: activity.data?.content || '',
			});
		} else if (!visible) {
			form.reset({ note: '' });
		}
	}, [editMode, activity, visible, form]);

	const handleSubmitForm = async (values: { note: string }) => {
		setLoading(true);
		try {
			if (editMode && activity) {
				await updateActivity(activity.id, 'note_added', values.note);
				setNotice({
					type: 'success',
					message: __('Note updated successfully!', 'quillcrm'),
				});
			} else {
				await addNote(dealId, values.note);
				setNotice({
					type: 'success',
					message: __('Note logged successfully!', 'quillcrm'),
				});
			}
			form.reset();
			onSuccess({
				type: 'success',
				message: editMode 
				  ? __('Note updated successfully!', 'quillcrm')
				  : __('Note logged successfully!', 'quillcrm'),
			  });
			onClose();
		} catch (error) {
			const err = error as Error;
			setNotice({
				type: 'error',
				message: err.message || __(editMode ? 'Failed to update note' : 'Failed to logged note', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		form.reset();
		onClose();
	};
	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

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
							title={editMode ? __('Edit Note', 'quillcrm') : __('Add Note', 'quillcrm')}
							subtitle=""
							icon={<NoteAddIcon />}
						/>
					</DialogTitle>
					{notice && (
				   <NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />)}
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
									? (editMode ? __('Updating...', 'quillcrm') : __('Adding...', 'quillcrm'))
									: (editMode ? __('Update Note', 'quillcrm') : __('Add Note', 'quillcrm'))}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
