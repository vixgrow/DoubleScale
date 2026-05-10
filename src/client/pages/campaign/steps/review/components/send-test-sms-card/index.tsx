/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertIcon, SendTestEmailIcon } from '@doublescale/components/icons';
import { cn } from '@/lib/utils';

interface SendTestSMSCardProps {
	campaignId?: number;
	header?: boolean;
	description?: boolean;
	cardClassName?: string;
	buttonClassName?: string;
	buttonVariant?: 'secondary' | 'gradient';
}

type FeedbackState = {
	type: 'success' | 'error';
	message: string;
} | null;

const SendTestSMSCard: React.FC<SendTestSMSCardProps> = ({ campaignId, header = true, description = true, cardClassName = '', buttonClassName = '', buttonVariant = 'secondary' }) => {
	const [testPhone, setTestPhone] = useState('');
	const [isSendingTest, setIsSendingTest] = useState(false);
	const [feedback, setFeedback] = useState<FeedbackState>(null);
	const isMountedRef = useRef(true);
	const abortControllerRef = useRef<AbortController | null>(null);
	const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (feedbackTimerRef.current) {
				clearTimeout(feedbackTimerRef.current);
			}
		};
	}, []);

	const showFeedback = (type: 'success' | 'error', message: string) => {
		if (feedbackTimerRef.current) {
			clearTimeout(feedbackTimerRef.current);
		}
		setFeedback({ type, message });
		feedbackTimerRef.current = setTimeout(() => {
			if (isMountedRef.current) {
				setFeedback(null);
			}
		}, 8000);
	};

	const sendTestSMS = async () => {
		setFeedback(null);

		if (!testPhone.trim()) {
			showFeedback('error', __('Please enter a phone number', 'doublescale'));
			return;
		}

		if (!campaignId) {
			showFeedback('error', __('Campaign ID is missing', 'doublescale'));
			return;
		}

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current = new AbortController();
		setIsSendingTest(true);

		try {
			const phone = testPhone.trim();
			if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
				showFeedback(
					'error',
					__('Please enter a valid phone number in E.164 format (e.g., +1234567890)', 'doublescale')
				);
				return;
			}

			const campaign: any = await apiFetch({
				path: `/doublescale/v1/campaigns/${campaignId}`,
				method: 'GET',
				signal: abortControllerRef.current.signal,
			});

			const message =
				campaign?.settings?.templates?.[0]?.body ||
				__('Test SMS message', 'doublescale');

			const response: any = await apiFetch({
				path: `/doublescale/v1/campaigns/send-test-message`,
				method: 'POST',
				data: {
					channel: 'sms',
					phone: phone,
					message: message,
				},
				signal: abortControllerRef.current.signal,
			});

			if (!isMountedRef.current) return;

			showFeedback(
				'success',
				response.message || __('Test SMS sent successfully', 'doublescale')
			);
			setTestPhone('');
		} catch (error: any) {
			if (error.name === 'AbortError') return;
			if (!isMountedRef.current) return;

			showFeedback(
				'error',
				error.message || __('Failed to send test SMS', 'doublescale')
			);
		} finally {
			if (isMountedRef.current) {
				setIsSendingTest(false);
			}
		}
	};

	return (
		<div className={cn('bg-muted/50 rounded-lg border border-gray-200 p-6 sticky top-4', cardClassName)}>
			{/* Header */}
			{header && (
			<div className="pb-4 border-b mb-6">
				<div className="flex items-center gap-2 justify-center text-[#660FF1]">
					<SendTestEmailIcon />
					<h3 className="text-lg text-[#660FF1]">
						{__('Send test SMS', 'doublescale')}
					</h3>
				</div>
			</div>
			)}

			{/* Content */}
			<div className="space-y-4">
				{description && (
				<h4 className="text-base text-foreground">
					{__('Who do you want to test your SMS with?', 'doublescale')}
				</h4>
				)}
				<div>
					<label className="block text-base text-foreground mb-2">
						{__('Send a test SMS to', 'doublescale')}
					</label>
					<Textarea
						value={testPhone}
						onChange={(e) => setTestPhone(e.target.value)}
						placeholder="+1234567890"
						className="w-full resize-none bg-white"
						rows={2}
					/>
					<p className="text-base font-medium text-secondary mt-2">
						{__(
							'Enter phone number in E.164 format (e.g., +1234567890)',
							'doublescale'
						)}
					</p>
				</div>

				{/* Inline feedback banner */}
				{feedback && (
					<div
						className={cn(
							'rounded-lg p-4 text-sm font-medium',
							feedback.type === 'success'
								? 'bg-green-50 border border-green-200 text-green-800'
								: 'bg-red-50 border border-red-200 text-red-800'
						)}
					>
						{feedback.message}
					</div>
				)}

				{/* Warning */}
				<div className="bg-white border border-border/60 rounded-lg p-4">
					<div className="flex gap-3">
						<div className="text-destructive">
							<AlertIcon width={24} height={24} />
						</div>
						<p className="text-base text-destructive">
							{__(
								'Your test SMS will be sent from your configured Twilio phone number. Ensure you have SMS credits available in your Twilio account.',
								'doublescale'
							)}
						</p>
					</div>
				</div>

				{/* Send Button */}
				<div className="flex justify-end">
					<Button
						onClick={sendTestSMS}
						disabled={isSendingTest || !testPhone.trim()}
						variant={buttonVariant}
						className={buttonClassName}
					>
						{isSendingTest
							? __('Sending...', 'doublescale')
							: __('Send Test', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SendTestSMSCard;
