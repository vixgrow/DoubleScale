import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon } from '@doublescale/components';

interface ProviderNotConnectedWarningProps {
	channel: 'sms' | 'whatsapp';
	onConfigureClick: () => void;
}

/**
 * Shared component for displaying provider not connected warning
 * Used in SMS and WhatsApp tabs
 *
 * For SMS: Only Twilio is available
 * For WhatsApp: Only Meta WhatsApp is available (Twilio WhatsApp was removed)
 */
export function ProviderNotConnectedWarning({
	channel,
	onConfigureClick,
}: ProviderNotConnectedWarningProps) {
	const channelName = channel === 'sms' ? __('SMS', 'doublescale') : __('WhatsApp', 'doublescale');

	return (
		<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
			<AlertTriangleIcon width={24} height={24} color="#CA8A04" />
			<div className="flex-1">
				<p className="text-sm text-yellow-800 mb-2">
					{channel === 'sms'
						? __(
								'No SMS provider is configured. Please configure Twilio to send SMS messages.',
								'doublescale'
						  )
						: __(
								'No WhatsApp provider is configured. Please configure Meta WhatsApp to send messages.',
								'doublescale'
						  )}
				</p>
				<Button
					variant="outline"
					size="sm"
					onClick={onConfigureClick}
					className="bg-white hover:bg-yellow-50"
				>
					{channel === 'sms'
						? __('Configure SMS Provider', 'doublescale')
						: __('Configure WhatsApp Provider', 'doublescale')}
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
	const channelName = isWhatsApp ? __('WhatsApp', 'doublescale') : __('SMS', 'doublescale');

	return (
		<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
			<Phone className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
			<div className="flex-1">
				<p className="text-sm text-orange-800 mb-2">
					{isWhatsApp
						? __(
								'This contact does not have a WhatsApp phone number. Please add a WhatsApp phone number in the contact details to send WhatsApp messages.',
								'doublescale'
						  )
						: __(
								'This contact does not have a phone number. Please add a phone number to send SMS messages.',
								'doublescale'
						  )}
				</p>
				<p className="text-xs text-orange-600">
					{__(
						'Phone numbers should be in E.164 format (e.g., +1234567890)',
						'doublescale'
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
							? __('Add WhatsApp Phone Number', 'doublescale')
							: __('Add Phone Number', 'doublescale')}
					</Button>
				)}
			</div>
		</div>
	);
}

