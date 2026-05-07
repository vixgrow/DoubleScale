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
import { AlertIcon, SendTestEmailIcon } from '@doublescale/components/icons';
import { cn } from '@/lib/utils';

interface SendTestEmailCardProps {
	campaignId?: number;
	header?: boolean;
	description?: boolean;
	cardClassName?: string;
	buttonClassName?: string;
	buttonVariant?: 'secondary' | 'gradient';
}

const SendTestEmailCard: React.FC<SendTestEmailCardProps> = ({
	campaignId,
	header = true,
	description = true,
	cardClassName = '',
	buttonClassName = '',
	buttonVariant = 'secondary',
}) => {
	const { createNotice } = useDispatch('doublescale/core');
	const [testEmails, setTestEmails] = useState('');
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

	const sendTestEmail = async () => {
		if (!testEmails.trim()) {
			createNotice({
				type: 'error',
				message: __(
					'Please enter at least one email address',
					'doublescale'
				),
			});
			return;
		}

		if (!campaignId) {
			createNotice({
				type: 'error',
				message: __('Campaign ID is missing', 'doublescale'),
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
			// Parse comma-separated emails
			const emails = testEmails.split(',').map((email) => email.trim());

			// Validate emails
			const invalidEmails = emails.filter(
				(email) => !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
			);

			if (invalidEmails.length > 0) {
				createNotice({
					type: 'error',
					message: __(
						'Please enter valid email addresses',
						'doublescale'
					),
				});
				return;
			}

			// Send all test emails in a single request with abort signal
			const response: any = await apiFetch({
				path: `/doublescale/v1/campaigns/${campaignId}/send-test-email`,
				method: 'POST',
				data: {
					emails: emails,
				},
				signal: abortControllerRef.current.signal,
			});

			// Only update state if component is still mounted
			if (!isMountedRef.current) return;

			createNotice({
				type: 'success',
				message:
					response.message ||
					__('Test email sent successfully', 'doublescale'),
			});

			setTestEmails('');
		} catch (error: any) {
			// Ignore abort errors (expected when component unmounts)
			if (error.name === 'AbortError') {
				return;
			}

			// Only handle error if component is still mounted
			if (!isMountedRef.current) return;

			console.error('Test email error:', error);
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to send test email', 'doublescale'),
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
			{header && (
				<div className="pb-4 border-b mb-6">
					<div className="flex items-center gap-2 justify-center text-[#660FF1]">
						<SendTestEmailIcon />
						<h3 className="text-lg text-[#660FF1]">
							{__('Send test email', 'doublescale')}
						</h3>
					</div>
				</div>
			)}

			{/* Content */}
			<div className="space-y-4">
				{description && (
					<h4 className="text-base text-[#09090B]">
						{__(
							'Who do you want to test your email with?',
							'doublescale'
						)}
					</h4>
				)}

				<div>
					<label className="block text-base text-[#09090B] mb-2">
						{__('Send a test email to', 'doublescale')}
					</label>
					<Textarea
						value={testEmails}
						onChange={(e) => setTestEmails(e.target.value)}
						placeholder="name@email.com,name@email.com"
						className="w-full resize-none bg-white"
						rows={2}
					/>
					<p className="text-base font-medium text-secondary mt-2">
						{__(
							'If you enter multiple emails, separate them with a comma',
							'doublescale'
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
								"Your test email could land in a spam folder. But don't worry, once you send the actual campaign, the emails will successfully reach your recipients.",
								'doublescale'
							)}
						</p>
					</div>
				</div>

				{/* Send Button */}
				<div className="flex justify-end">
					<Button
						onClick={sendTestEmail}
						disabled={isSendingTest || !testEmails.trim()}
						variant={buttonVariant}
						className={cn(buttonClassName)}
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

export default SendTestEmailCard;
