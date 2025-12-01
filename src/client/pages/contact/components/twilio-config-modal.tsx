/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@quillcrm/components';
import { Settings } from 'lucide-react';

interface TwilioConfigModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

const TwilioConfigModal: React.FC<TwilioConfigModalProps> = ({
	open,
	onClose,
	onSuccess,
}) => {
	console.log('[TwilioConfigModal] Rendered with open:', open);
	
	const { createNotice } = useDispatch('quillcrm/core');
	const [accountSid, setAccountSid] = useState('');
	const [authToken, setAuthToken] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		// Validation
		if (!accountSid || !authToken || !phoneNumber) {
			createNotice({
				type: 'error',
				message: __('Please fill in all fields', 'quillcrm'),
			});
			return;
		}

		setIsSaving(true);
		try {
			// Save Twilio configuration via existing integration API
			// Uses the same endpoint as the Integrations settings page
			await apiFetch({
				path: '/qc/v1/integrations/twilio',
				method: 'POST',
				data: {
					settings: {
						account_sid: accountSid,
						auth_token: authToken,
						phone_number: phoneNumber,
					},
				},
			});

			createNotice({
				type: 'success',
				message: __('Twilio configured successfully!', 'quillcrm'),
			});

			// Reset form
			setAccountSid('');
			setAuthToken('');
			setPhoneNumber('');

			// Call success callback to refresh provider status
			if (onSuccess) {
				onSuccess();
			}

			onClose();
		} catch (error: any) {
			let errorMessage = __('Failed to save Twilio configuration', 'quillcrm');

			if (error.message) {
				errorMessage = error.message;
			} else if (error.data?.message) {
				errorMessage = error.data.message;
			}

			createNotice({
				type: 'error',
				message: errorMessage,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSave();
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogOverlay className="z-[1800000]" />
			<DialogContent className="max-w-2xl z-[1800001]" removePortal={true}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="w-5 h-5" />
						{__('Configure Twilio Integration', 'quillcrm')}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
							<p className="text-sm text-blue-800">
								{__(
									'To send SMS and WhatsApp messages, you need to configure your Twilio account credentials. You can find these in your Twilio Console.',
									'quillcrm'
								)}
							</p>
							<a
								href="https://console.twilio.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
							>
								{__('Open Twilio Console →', 'quillcrm')}
							</a>
						</div>

						<Field
							label={__('Account SID', 'quillcrm')}
							type="text"
							value={accountSid}
							onChange={(value) => setAccountSid(value)}
							placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
							required
							helperText={__(
								'Your Twilio Account SID (starts with AC)',
								'quillcrm'
							)}
						/>

						<Field
							label={__('Auth Token', 'quillcrm')}
							type="password"
							value={authToken}
							onChange={(value) => setAuthToken(value)}
							placeholder="********************************"
							required
							helperText={__(
								'Your Twilio Auth Token (keep this secret)',
								'quillcrm'
							)}
						/>

						<Field
							label={__('Phone Number', 'quillcrm')}
							type="text"
							value={phoneNumber}
							onChange={(value) => setPhoneNumber(value)}
							placeholder="+1234567890"
							required
							helperText={__(
								'Your Twilio phone number in E.164 format (e.g., +1234567890)',
								'quillcrm'
							)}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSaving}
						>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							type="submit"
							disabled={isSaving}
							className="bg-primary"
						>
							{isSaving
								? __('Saving...', 'quillcrm')
								: __('Save Configuration', 'quillcrm')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default TwilioConfigModal;

