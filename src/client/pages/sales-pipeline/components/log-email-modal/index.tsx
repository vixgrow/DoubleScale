/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { message } from 'antd';
import dayjs from 'dayjs';
import { Mail } from 'lucide-react';

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
import { Input } from '@quillcrm/components/ui/input';
import { Button } from '@quillcrm/components/ui/button';
import { Textarea } from '@quillcrm/components/ui/textarea';
import { DateTimePicker } from '@quillcrm/components/date-time-picker';
import { useForm } from 'react-hook-form';
import { CustomDialogHeader } from '@quillcrm/components';
import { useActivityOperations } from '../../hooks/use-activity-operations';
import './style.scss';
import { useDispatch } from '@wordpress/data';
import EmailLogIcon from '@quillcrm/components/icons/email-log';

interface LogEmailModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	dealId: number;
	dealTitle?: string;
}

interface EmailFormData {
	subject: string;
	body: string;
	sent_at: string;
}

export const LogEmailModal: React.FC<LogEmailModalProps> = ({
	visible,
	onClose,
	onSuccess,
	dealId,
	dealTitle,
}) => {
	const [loading, setLoading] = useState(false);
	const { logEmail } = useActivityOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const form = useForm<EmailFormData>({
		defaultValues: {
			subject: '',
			body: '',
			sent_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
		},
	});

	const handleSubmit = async (values: EmailFormData) => {
		setLoading(true);
		try {
			const emailData: EmailFormData = {
				subject: values.subject,
				body: values.body || '',
				sent_at: values.sent_at
					? dayjs(values.sent_at).format('YYYY-MM-DD HH:mm:ss')
					: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			};

			await logEmail(dealId, emailData);

			createNotice?.({
				type: 'success',
				message: __(`Email logged successfully!`, 'quillcrm'),
			});
			onSuccess();
			onClose();
			form.reset();
		} catch (error) {
			const err = error as Error;
			createNotice?.({
				type: 'error',
				message: err.message || __('Failed to log email', 'quillcrm'),
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
		<Dialog open={visible} onOpenChange={(open) => !open && handleCancel()}>
			<DialogContent className="w-full max-w-2xl max-h-[80vh] my-2 mx-5 sm:mx-auto overflow-y-auto p-8 rounded-[16px]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Log Email', 'quillcrm')}
							subtitle=""
							icon={<EmailLogIcon color='#1E3A8A'/>}
						/>
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex flex-col gap-6"
					>
						{/* Deal title */}
						{dealTitle && (
							<div className="flex flex-col gap-1">
								<label className="font-normal text-[#09090B] text-base">
									{__('Deal', 'quillcrm')}
								</label>
								<Input
									readOnly
									value={dealTitle}
									className="h-12 py-[5px] px-4 bg-[#F0F0F0] border !border-[#DEE1E6] rounded-[8px]"
								/>
							</div>
						)}
						{/* Sent Date & Time */}
						<FormField
							control={form.control}
							name="sent_at"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Sent Date & Time', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<DateTimePicker
											value={field.value}
											onChange={field.onChange}
											placeholder="Select date & time"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Email Subject */}
						<FormField
							control={form.control}
							name="subject"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Email Subject', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={__('Enter email subject...', 'quillcrm')}
											{...field}
											className="h-12 py-[5px] px-4 bg-white border !border-[#DEE1E6] rounded-[8px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Email Body */}
						<FormField
							control={form.control}
							name="body"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-normal text-[#09090B] text-base">
										{__('Email Body', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder={__(
												'Enter email content or notes...',
												'quillcrm'
											)}
											rows={5}
											{...field}
											className="w-full py-3 px-4 bg-white placeholder:text-[#777] border !border-[#DEE1E6] rounded-[8px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Buttons */}
						<DialogFooter className="!mt-3">
							<Button
								type="submit"
								className="w-full bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex h-12 justify-center items-center gap-2 rounded-[8px] font-manrope text-base font-medium tracking-tight hover:opacity-90 transition-all duration-200"
							>
								{loading
									? __('Logging...', 'quillcrm')
									: __('Log Email', 'quillcrm')}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
