import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProviderNotConnectedWarningProps {
	channel: 'sms' | 'whatsapp';
	onConfigureClick: () => void;
}

/**
 * Shared component for displaying provider not connected warning
 * Used in SMS and WhatsApp tabs
 * 
 * For SMS: Only Twilio is available
 * For WhatsApp: Both Twilio and Meta WhatsApp are available
 */
export function ProviderNotConnectedWarning({
	channel,
	onConfigureClick,
}: ProviderNotConnectedWarningProps) {
	const channelName = channel === 'sms' ? __('SMS', 'quillcrm') : __('WhatsApp', 'quillcrm');

	// For SMS, only Twilio is available
	// For WhatsApp, both Twilio and Meta WhatsApp are available
	const providerOptions = channel === 'sms' 
		? __('Twilio', 'quillcrm')
		: __('Twilio or Meta WhatsApp', 'quillcrm');

	return (
		<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
			<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
			<div className="flex-1">
				<p className="text-sm text-yellow-800 mb-2">
					{channel === 'sms'
						? __(
								'No SMS provider is configured. Please configure Twilio to send SMS messages.',
								'quillcrm'
						  )
						: __(
								'No WhatsApp provider is configured. Please configure Twilio or Meta WhatsApp to send messages.',
								'quillcrm'
						  )}
				</p>
				<Button
					variant="outline"
					size="sm"
					onClick={onConfigureClick}
					className="bg-white hover:bg-yellow-50"
				>
					{channel === 'sms'
						? __('Configure SMS Provider', 'quillcrm')
						: __('Configure WhatsApp Provider', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
}

interface ContactNoPhoneWarningProps {
	channel: 'sms' | 'whatsapp';
	contactId?: number;
	onAddPhoneClick?: () => void;
}

/**
 * Shared component for displaying warning when contact has no phone number
 * Used in SMS and WhatsApp tabs
 * 
 * For SMS: Checks for missing phone number
 * For WhatsApp: Checks for missing whatsapp_phone (separate field)
 */
export function ContactNoPhoneWarning({
	channel,
	contactId,
	onAddPhoneClick,
}: ContactNoPhoneWarningProps) {
	const isWhatsApp = channel === 'whatsapp';
	const channelName = isWhatsApp ? __('WhatsApp', 'quillcrm') : __('SMS', 'quillcrm');

	return (
		<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
			<Phone className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
			<div className="flex-1">
				<p className="text-sm text-orange-800 mb-2">
					{isWhatsApp
						? __(
								'This contact does not have a WhatsApp phone number. Please add a WhatsApp phone number in the contact details to send WhatsApp messages.',
								'quillcrm'
						  )
						: __(
								'This contact does not have a phone number. Please add a phone number to send SMS messages.',
								'quillcrm'
						  )}
				</p>
				<p className="text-xs text-orange-600">
					{__(
						'Phone numbers should be in E.164 format (e.g., +1234567890)',
						'quillcrm'
					)}
				</p>
				{onAddPhoneClick && (
					<Button
						variant="outline"
						size="sm"
						onClick={onAddPhoneClick}
						className="bg-white hover:bg-orange-50 mt-2"
					>
						{isWhatsApp
							? __('Add WhatsApp Phone Number', 'quillcrm')
							: __('Add Phone Number', 'quillcrm')}
					</Button>
				)}
			</div>
		</div>
	);
}

