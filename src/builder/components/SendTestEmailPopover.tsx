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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { SendTestEmailIcon } from '@doublescale/components';

interface SendTestEmailPopoverProps {
	campaignId: number;
	disabled?: boolean;
	onBeforeSend?: () => Promise<{ success: boolean }>;
}

export const SendTestEmailPopover: React.FC<SendTestEmailPopoverProps> = ({
	campaignId,
	disabled = false,
	onBeforeSend,
}) => {
	const { createNotice } = useDispatch('doublescale/core');
	const [open, setOpen] = useState(false);
	const [testEmails, setTestEmails] = useState('');
	const [isSending, setIsSending] = useState(false);
	const isMountedRef = useRef(true);
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			abortControllerRef.current?.abort();
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

		const emails = testEmails
			.split(',')
			.map((email) => email.trim())
			.filter(Boolean);

		const invalidEmails = emails.filter(
			(email) => !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
		);

		if (invalidEmails.length > 0) {
			createNotice({
				type: 'error',
				message: __('Please enter valid email addresses', 'doublescale'),
			});
			return;
		}

		if (onBeforeSend) {
			const { success } = await onBeforeSend();
			if (!success) {
				return;
			}
		}

		abortControllerRef.current?.abort();
		abortControllerRef.current = new AbortController();
		setIsSending(true);

		try {
			const response: { message?: string } = await apiFetch({
				path: `/doublescale/v1/campaigns/${campaignId}/send-test-email`,
				method: 'POST',
				data: { emails },
				signal: abortControllerRef.current.signal,
			});

			if (!isMountedRef.current) {
				return;
			}

			createNotice({
				type: 'success',
				message:
					response.message ||
					__('Test email sent successfully', 'doublescale'),
			});
			setTestEmails('');
			setOpen(false);
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AbortError') {
				return;
			}
			if (!isMountedRef.current) {
				return;
			}
			const message =
				error instanceof Error
					? error.message
					: __('Failed to send test email', 'doublescale');
			createNotice({
				type: 'error',
				message,
			});
		} finally {
			if (isMountedRef.current) {
				setIsSending(false);
			}
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="secondary"
					className="px-3 gap-2"
					disabled={disabled || isSending}
				>
					<SendTestEmailIcon />
					{__('Send test email', 'doublescale')}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80">
				<div className="space-y-3">
					<p className="text-sm font-medium text-foreground">
						{__('Send a test email', 'doublescale')}
					</p>
					<p className="text-xs text-muted-foreground">
						{__(
							'Enter one or more addresses (comma-separated). The latest saved design will be sent.',
							'doublescale'
						)}
					</p>
					<Textarea
						value={testEmails}
						onChange={(e) => setTestEmails(e.target.value)}
						placeholder="name@email.com, name2@email.com"
						className="min-h-[80px] resize-none"
						disabled={isSending}
					/>
					<Button
						className="w-full"
						onClick={sendTestEmail}
						disabled={isSending || !testEmails.trim()}
					>
						{isSending
							? __('Sending...', 'doublescale')
							: __('Send', 'doublescale')}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default SendTestEmailPopover;
