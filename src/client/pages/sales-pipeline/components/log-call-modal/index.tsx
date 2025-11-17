/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect,useRef } from '@wordpress/element';

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
import './style.scss';
import { useForm } from 'react-hook-form';
import { CustomDialogHeader, NoticeBanner } from '@quillcrm/components';
import CallLogIcon from '@quillcrm/components/icons/call-log';
import { Input } from '@quillcrm/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';
import { Textarea } from '@quillcrm/components/ui/textarea';
import { Button } from '@quillcrm/components/ui/button';
import { useDispatch } from '@wordpress/data';
import { DateTimePicker } from '@quillcrm/components/date-time-picker';
import { NoticeMessage } from '@/client/types';


interface LogCallModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: ( notice?: { type: 'success' | 'error'; message: string }) => void;
	dealId: number;
	dealTitle?: string;
	dealContact?: {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
	} | null;
	dealContactName?:string;
	editMode?: boolean;
	activity?: any;
}

interface CallFormData {
	phone_number?: string;
	duration: number;
	outcome: string;
	notes: string;
	called_at: string 
	dealTitle: string;
	dealContact: string;
	dealContactName:string
}

export const LogCallModal: React.FC<LogCallModalProps> = ({
	visible,
	onClose,
	onSuccess,
	dealId,
	dealTitle,
	dealContact,
	dealContactName,
	editMode = false,
	activity,
}) => {
	const [loading, setLoading] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const { logCall, updateActivity } = useActivityOperations();
	const noticeBannerRef = useRef<HTMLDivElement>(null);


	const form = useForm<CallFormData>({
		defaultValues: {
			outcome: 'completed',
			called_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			duration: 60,
		},
	});

	// Load existing activity data when in edit mode
	useEffect(() => {
		if (editMode && activity && visible) {
			form.reset({
				phone_number: activity.data?.phone_number || '',
				duration: activity.data?.duration || 60,
				outcome: activity.data?.outcome || 'completed',
				notes: activity.data?.notes || '',
				called_at: activity.data?.called_at || dayjs().format('YYYY-MM-DD HH:mm:ss'),
				dealTitle: dealTitle || '',
				dealContactName: dealContactName || '',
				dealContact: '',
			});
		} else if (!visible) {
			form.reset({
				outcome: 'completed',
				called_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
				duration: 60,
				phone_number: '',
				notes: '',
				dealTitle: dealTitle || '',
				dealContactName: dealContactName || '',
				dealContact: '',
			});
		}
	}, [editMode, activity, visible, form, dealTitle, dealContactName]);

	const handleDialogSubmit = async (values: any) => {
		setLoading(true);
		try {
			if (values.called_at?.from) {
				values.called_at = values.called_at.from;
			}
			const callData: CallFormData = {
				...values,
				called_at: values.called_at
					? dayjs(values.called_at).format('YYYY-MM-DD HH:mm:ss')
					: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			};

			if (editMode && activity) {
				await updateActivity(activity.id, 'call_logged', callData);
				setNotice({
					type: 'success',
					message: __('Call updated successfully!', 'quillcrm'),
				});
			} else {
				await logCall(dealId, callData);
				setNotice({
					type: 'success',
					message: __('Call logged successfully!', 'quillcrm'),
				});
			}

			form.reset();
			onSuccess({
				type: 'success',
				message: editMode 
				  ? __('Call updated successfully!', 'quillcrm')
				  : __('Call logged successfully!', 'quillcrm'),
			  });
			onClose();
		} catch (error) {
			const err = error as Error;
			setNotice({
				type: 'error',
				message: err.message || __(editMode ? 'Failed to update call' : 'Failed to logged meeting', 'quillcrm'),
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
		<Dialog open={visible} onOpenChange={(open) => !open && handleCancel()}>
			<DialogContent className="w-full max-w-2xl max-h-[80vh] my-2 mx-5 sm:mx-auto overflow-y-auto p-8 rounded-[16px]  z-[100000]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={editMode ? __('Edit Log Call', 'quillcrm') : __('Add Log Call', 'quillcrm')}
							subtitle=""
							icon={<CallLogIcon />}
						/>
					</DialogTitle>
					{notice && (
				   <NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />)}
				</DialogHeader>
				{/* form */}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleDialogSubmit)}
						className=" flex flex-col gap-6"
					>
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
						{/* related contact */}
						<FormField
							control={form.control}
							name="dealContactName"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Related Contact', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Deal Name"
											{...field}
											readOnly
											value={dealContactName}
											className=" h-12 py-[5px] px-4 !shadow-none  bg-[#F0F0F0] focus:bg-[#F0F0F0] border !border-[#DEE1E6] rounded-[8px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						></FormField>
						{/* phone number */}
						<FormField
							control={form.control}
							name="phone_number"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Phone Number', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Deal Name"
											{...field}
											className=" h-12 py-[5px] px-4 !shadow-none  bg-[#fff]  border !border-[#DEE1E6] rounded-[8px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						></FormField>
						{/* Duration */}
						{/* <FormField
							control={form.control}
							name="duration"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Duration(minutes)', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Duration(minutes)"
											{...field}
											className=" h-12 !shadow-none py-[5px] px-4  bg-[#FFF]  border !border-[#DEE1E6] rounded-[8px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						></FormField> */}
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
						{/* Call Outcome */}
						<FormField
							control={form.control}
							name="outcome"
							render={({ field }) => (
								<FormItem className="form-item-half">
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Call Outcome', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											defaultValue={
												field.value || 'completed'
											}
										>
											<SelectTrigger className="h-12 !shadow-none w-full bg-white border !border-[#DEE1E6] rounded-[8px] px-4 text-[#09090B]">
												<SelectValue
													placeholder={__(
														'Select outcome',
														'quillcrm'
													)}
												/>
											</SelectTrigger>
											<SelectContent className="">
												<SelectItem value="completed">
													{__(
														'Completed',
														'quillcrm'
													)}
												</SelectItem>
												<SelectItem value="no_answer">
													{__(
														'No Answer',
														'quillcrm'
													)}
												</SelectItem>
												<SelectItem value="busy">
													{__('Busy', 'quillcrm')}
												</SelectItem>
												<SelectItem value="voicemail">
													{__(
														'Voicemail',
														'quillcrm'
													)}
												</SelectItem>
												<SelectItem value="callback_requested">
													{__(
														'Callback Requested',
														'quillcrm'
													)}
												</SelectItem>
												<SelectItem value="not_interested">
													{__(
														'Not Interested',
														'quillcrm'
													)}
												</SelectItem>
												<SelectItem value="follow_up">
													{__(
														'Follow Up',
														'quillcrm'
													)}
												</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Call Date & Time */}
						
						{/* Call Date & Time */}
<FormField
  control={form.control}
  name="called_at"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="font-normal text-[#09090B] text-base">
        {__('Call Date & Time', 'quillcrm')}
      </FormLabel>
      <FormControl>
        <DateTimePicker
          placeholder="Start date"
          onChange={field.onChange}
          
          value={field.value ? new Date(field.value) : undefined}
         
        //   ref={field.ref}
        />

        {/* </div> */}
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

						{/* Notes */}
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Notes', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder={__(
												'Enter call notes, discussion points, next steps.....',
												'quillcrm'
											)}
											{...field}
											rows={5}
											className="w-full py-3 px-4 !shadow-none bg-white placeholder:text-[#777] border !border-[#DEE1E6] rounded-[8px] "
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className='!mt-3'>
				<Button
								type="submit"
								// disabled={loading}
								className="w-full bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex h-12 justify-center items-center gap-2 rounded-[8px] text-base font-medium tracking-tight hover:opacity-90 transition-all duration-200"
							>
								{loading
									? (editMode ? __('Updating...', 'quillcrm') : __('Adding...', 'quillcrm'))
									: (editMode ? __('Update Log Call', 'quillcrm') : __('Add Log Call', 'quillcrm'))}
							</Button>
				</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
