/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertIcon, SendTestEmailIcon } from '@quillcrm/components/icons';
import { cn } from '@/lib/utils';

interface SendTestSMSCardProps {
	campaignId?: number;
	header?: boolean;
	description?: boolean;
	cardClassName?: string;
	buttonClassName?: string;
	buttonVariant?: 'secondary' | 'gradient';
}

const SendTestSMSCard: React.FC<SendTestSMSCardProps> = ({ campaignId, header = true, description = true, cardClassName = '', buttonClassName = '', buttonVariant = 'secondary' }) => {
	const { createNotice } = useDispatch('quillcrm/core');
	const [testPhone, setTestPhone] = useState('');
	const [isSendingTest, setIsSendingTest] = useState(false);
	const isMountedRef = useRef(true);
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			// Cancel any pending requests when component unmounts
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	const sendTestSMS = async () => {
		if (!testPhone.trim()) {
			createNotice({
				type: 'error',
				message: __('Please enter a phone number', 'quillcrm'),
			});
			return;
		}

		if (!campaignId) {
			createNotice({
				type: 'error',
				message: __('Campaign ID is missing', 'quillcrm'),
			});
			return;
		}

		// Abort any previous pending request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new AbortController for this request
		abortControllerRef.current = new AbortController();

		setIsSendingTest(true);

		try {
			// Validate E.164 format (e.g., +1234567890)
			const phone = testPhone.trim();
			if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
				createNotice({
					type: 'error',
					message: __(
						'Please enter a valid phone number in E.164 format (e.g., +1234567890)',
						'quillcrm'
					),
				});
				return;
			}

			// Get campaign data to retrieve the message content
			const campaign: any = await apiFetch({
				path: `/qc/v1/campaigns/${campaignId}`,
				method: 'GET',
				signal: abortControllerRef.current.signal,
			});

			// Extract message from template
			const message =
				campaign?.settings?.templates?.[0]?.body ||
				__('Test SMS message', 'quillcrm');

			// Send test SMS using unified endpoint
			const response: any = await apiFetch({
				path: `/qc/v1/campaigns/send-test-message`,
				method: 'POST',
				data: {
					channel: 'sms',
					phone: phone,
					message: message,
				},
				signal: abortControllerRef.current.signal,
			});

			// Only update state if component is still mounted
			if (!isMountedRef.current) return;

			createNotice({
				type: 'success',
				message:
					response.message ||
					__('Test SMS sent successfully', 'quillcrm'),
			});

			setTestPhone('');
		} catch (error: any) {
			// Ignore abort errors (expected when component unmounts)
			if (error.name === 'AbortError') {
				return;
			}

			// Only handle error if component is still mounted
			if (!isMountedRef.current) return;

			console.error('Test SMS error:', error);
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to send test SMS', 'quillcrm'),
			});
		} finally {
			// Only update state if component is still mounted
			if (isMountedRef.current) {
				setIsSendingTest(false);
			}
		}
	};

	return (
		<div className={cn('bg-[#F8F8F8] rounded-lg border border-gray-200 p-6 sticky top-4', cardClassName)}>
			{/* Header */}
			{header && (
			<div className="pb-4 border-b mb-6">
				<div className="flex items-center gap-2 justify-center text-[#660FF1]">
					<SendTestEmailIcon />
					<h3 className="text-lg text-[#660FF1]">
						{__('Send test SMS', 'quillcrm')}
					</h3>
				</div>
			</div>
			)}

			{/* Content */}
			<div className="space-y-4">
				{description && (
				<h4 className="text-base text-[#09090B]">
					{__('Who do you want to test your SMS with?', 'quillcrm')}
				</h4>
				)}
				<div>
					<label className="block text-base text-[#09090B] mb-2">
						{__('Send a test SMS to', 'quillcrm')}
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
							'quillcrm'
						)}
					</p>
				</div>

				{/* Warning */}
				<div className="bg-white border border-[#DEE1E6] rounded-lg p-4">
					<div className="flex gap-3">
						<div className="text-destructive">
							<AlertIcon width={24} height={24} />
						</div>
						<p className="text-base text-destructive">
							{__(
								'Your test SMS will be sent from your configured Twilio phone number. Ensure you have SMS credits available in your Twilio account.',
								'quillcrm'
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
							? __('Sending...', 'quillcrm')
							: __('Send Test', 'quillcrm')}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SendTestSMSCard;
