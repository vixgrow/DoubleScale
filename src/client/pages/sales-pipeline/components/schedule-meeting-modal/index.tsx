/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {useState, useEffect ,useRef } from 'react';

/**
 * External dependencies
 */
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { useActivityOperations } from '../../hooks/use-activity-operations';
import { useForm } from 'react-hook-form';
import { CustomDialogHeader, NoticeBanner } from '@quillcrm/components';
import { Input } from '@quillcrm/components/ui/input';
import { Textarea } from '@quillcrm/components/ui/textarea';
import { Button } from '@quillcrm/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@quillcrm/components/ui/select';
import { DateTimePicker } from '@quillcrm/components/date-time-picker';
import './style.scss';
import MeetingDealIcon from '@quillcrm/components/icons/meeting-deal';
import { NoticeMessage } from '@/client/types';

interface ScheduleMeetingModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: ( notice?: { type: 'success' | 'error'; message: string }) => void;
	dealId: number;
	dealTitle?: string;
	editMode?: boolean;
	activity?: any;
}

interface MeetingFormData {
	title: string;
	scheduled_at: Date;
	duration: number;
	location: string;
	description: string;
	dealTitle:string
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
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
	const { scheduleMeeting, updateActivity } = useActivityOperations();
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const form = useForm<MeetingFormData>({
		defaultValues: {
			title: '',
			// scheduled_at: dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
			scheduled_at: dayjs().add(1, 'hour').toDate(),
			duration: 60,
			location: '',
			description: '',
		},
	});

	// Load existing activity data when in edit mode
	useEffect(() => {
		if (editMode && activity && visible) {
			form.reset({
				title: activity.data?.title || '',
				scheduled_at: activity.data?.scheduled_at ? dayjs(activity.data.scheduled_at).toDate() : dayjs().add(1, 'hour').toDate(),
				duration: activity.data?.duration || 60,
				location: activity.data?.location || '',
				description: activity.data?.description || '',
			});
		} else if (!visible) {
			form.reset({
				title: '',
				scheduled_at: dayjs().add(1, 'hour').toDate(),
				duration: 60,
				location: '',
				description: '',
			});
		}
	}, [editMode, activity, visible, form]);

	const handleSubmit = async (values: MeetingFormData) => {
		setLoading(true);
		try {
			const meetingData: MeetingFormData = {
				...values,
				scheduled_at: values.scheduled_at, 
			};

			if (editMode && activity) {
				await updateActivity(activity.id, 'meeting_scheduled', meetingData);
				setNotice({
					type: 'success',
					message: __('Meeting updated successfully!', 'quillcrm'),
				});
			} else {
				await scheduleMeeting(dealId, meetingData);
				setNotice({
					type: 'success',
					message: __('Meeting scheduled successfully!', 'quillcrm'),
				});
			}

			form.reset();
			onSuccess({
				type: 'success',
				message: editMode 
				  ? __('Meeting updated successfully!', 'quillcrm')
				  : __('Meeting scheduled successfully!', 'quillcrm'),
			  });
			onClose();
		} catch (error) {
			const err = error as Error;
			setNotice({
				type: 'error',
				message: err.message || __(editMode ? 'Failed to update meeting' : 'Failed to schedule meeting', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
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
	const handleCancel = () => {
		form.reset();
		onClose();
	};
	

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && handleCancel()}>
			<DialogContent className="w-full max-w-2xl max-h-[80vh] my-2 mx-5 sm:mx-auto overflow-y-auto p-8 rounded-[16px]  z-[100000]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={editMode ? __('Edit Meeting', 'quillcrm') : __('Schedule Meeting', 'quillcrm')}
							subtitle=''
							icon={<MeetingDealIcon color='#1E3A8A' />}
						/>
					</DialogTitle>
					{notice && (
				   <NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />)}
				</DialogHeader>
				
			

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
						{/* title */}
						<FormField
							control={form.control}
							name="dealTitle"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Deal Name', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Deal Name"
											{...field}
											readOnly
											value={dealTitle}
											className=" h-12 py-[5px] !shadow-none px-4  bg-[#F0F0F0] focus:bg-[#F0F0F0] border !border-[#DEE1E6] rounded-[8px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						></FormField>
						{/* Meeting Title */}
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Meeting Title', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={__('Enter meeting title...', 'quillcrm')}
											{...field}
											className="h-12 py-[5px] px-4 bg-white border !border-[#DEE1E6] rounded-[8px] !shadow-none"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Duration */}
						<FormField
							control={form.control}
							name="duration"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Duration (minutes)', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Select
											onValueChange={(val) => field.onChange(Number(val))}
											defaultValue={String(field.value)}
										>
											<SelectTrigger className="h-12 w-full bg-white border !border-[#DEE1E6] rounded-[8px] px-4 text-[#09090B]">
												<SelectValue placeholder={__('Select duration', 'quillcrm')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="15">15 {__('minutes', 'quillcrm')}</SelectItem>
												<SelectItem value="30">30 {__('minutes', 'quillcrm')}</SelectItem>
												<SelectItem value="45">45 {__('minutes', 'quillcrm')}</SelectItem>
												<SelectItem value="60">1 {__('hour', 'quillcrm')}</SelectItem>
												<SelectItem value="90">1.5 {__('hours', 'quillcrm')}</SelectItem>
												<SelectItem value="120">2 {__('hours', 'quillcrm')}</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Date & Time */}
						<FormField
							control={form.control}
							name="scheduled_at"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Date & Time', 'quillcrm')}
									</FormLabel>
									<FormControl>
									<DateTimePicker
            {...field}
            placeholder="Start date"
			onChange={(val) => field.onChange(val)}
          />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Location */}
						<FormField
							control={form.control}
							name="location"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Location', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={__('Meeting room, video link, address...', 'quillcrm')}
											{...field}
											className="h-12 py-[5px] px-4 bg-white border !border-[#DEE1E6] rounded-[8px] !shadow-none"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Description */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Meeting Description', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder={__('Meeting agenda, topics to discuss...', 'quillcrm')}
											{...field}
											rows={4}
											className="w-full py-3 px-4 !shadow-none bg-white placeholder:text-[#777] border !border-[#DEE1E6] rounded-[8px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="!mt-3">
							<Button
								type="submit"
								disabled={loading}
								className="w-full bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex h-12 justify-center items-center gap-2 rounded-[8px] text-base font-medium tracking-tight hover:opacity-90 transition-all duration-200"
							>
								{loading
									? (editMode ? __('Updating...', 'quillcrm') : __('Scheduling...', 'quillcrm'))
									: (editMode ? __('Update Meeting', 'quillcrm') : __('Schedule Meeting', 'quillcrm'))}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
