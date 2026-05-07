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
import { MessageCircle } from 'lucide-react';

interface SendTestWhatsAppCardProps {
	campaignId?: number;
	header?: boolean;
	description?: boolean;
	cardClassName?: string;
	buttonClassName?: string;
	buttonVariant?: 'secondary' | 'gradient';
}

const SendTestWhatsAppCard: React.FC<SendTestWhatsAppCardProps> = ({
	campaignId,
	header = true,
	description = true,
	cardClassName = '',
	buttonClassName = '',
	buttonVariant = 'secondary',
}) => {
	const { createNotice } = useDispatch('doublescale/core');
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

	const sendTestWhatsApp = async () => {
		if (!testPhone.trim()) {
			createNotice({
				type: 'error',
				message: __('Please enter a phone number', 'doublescale'),
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
			// Validate E.164 format (e.g., +1234567890)
			const phone = testPhone.trim();
			if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
				createNotice({
					type: 'error',
					message: __(
						'Please enter a valid phone number in E.164 format (e.g., +1234567890)',
						'doublescale'
					),
				});
				return;
			}

			// Get campaign data to retrieve the template info
			const campaign: any = await apiFetch({
				path: `/doublescale/v1/campaigns/${campaignId}`,
				method: 'GET',
				signal: abortControllerRef.current.signal,
			});

			// Extract template from campaign
			const template = campaign?.settings?.templates?.[0];

			if (!template) {
				createNotice({
					type: 'error',
					message: __(
						'No WhatsApp template configured for this campaign',
						'doublescale'
					),
				});
				return;
			}

			// Send test WhatsApp using unified endpoint
			const response: any = await apiFetch({
				path: `/doublescale/v1/campaigns/send-test-message`,
				method: 'POST',
				data: {
					channel: 'whatsapp',
					phone: phone,
					template_id: template.id,
					template_variables: template.settings?.variable_mappings || {},
				},
				signal: abortControllerRef.current.signal,
			});

			// Only update state if component is still mounted
			if (!isMountedRef.current) return;

			createNotice({
				type: 'success',
				message:
					response.message ||
					__('Test WhatsApp message sent successfully', 'doublescale'),
			});

			setTestPhone('');
		} catch (error: any) {
			// Ignore abort errors (expected when component unmounts)
			if (error.name === 'AbortError') {
				return;
			}

			// Only handle error if component is still mounted
			if (!isMountedRef.current) return;

			console.error('Test WhatsApp error:', error);
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to send test WhatsApp message', 'doublescale'),
			});
		} finally {
			// Only update state if component is still mounted
			if (isMountedRef.current) {
				setIsSendingTest(false);
			}
		}
	};

	return (
		<div
			className={cn(
				'bg-[#F8F8F8] rounded-lg border border-gray-200 p-6 sticky top-4',
				cardClassName
			)}
		>
			{/* Header */}
			{header && (
				<div className="pb-4 border-b mb-6">
					<div className="flex items-center gap-2 justify-center text-[#25D366]">
						<MessageCircle className="w-5 h-5" />
						<h3 className="text-lg text-[#25D366]">
							{__('Send test WhatsApp', 'doublescale')}
						</h3>
					</div>
				</div>
			)}

			{/* Content */}
			<div className="space-y-4">
				{description && (
					<h4 className="text-base text-[#09090B]">
						{__(
							'Who do you want to test your WhatsApp message with?',
							'doublescale'
						)}
					</h4>
				)}
				<div>
					<label className="block text-base text-[#09090B] mb-2">
						{__('Send a test WhatsApp to', 'doublescale')}
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

				{/* Warning */}
				<div className="bg-white border border-[#DEE1E6] rounded-lg p-4">
					<div className="flex gap-3">
						<div className="text-amber-600">
							<AlertIcon width={24} height={24} />
						</div>
						<p className="text-base text-amber-800">
							{__(
								'WhatsApp test messages use approved templates from your Twilio account. The recipient must have a valid WhatsApp account.',
								'doublescale'
							)}
						</p>
					</div>
				</div>

				{/* Send Button */}
				<div className="flex justify-end">
					<Button
						onClick={sendTestWhatsApp}
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

export default SendTestWhatsAppCard;


