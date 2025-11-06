import React from 'react';
import { __ } from '@wordpress/i18n';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProviderNotConnectedWarningProps {
	channel: 'sms' | 'whatsapp';
	onConfigureClick: () => void;
}

/**
 * Shared component for displaying provider not connected warning
 * Used in SMS and WhatsApp tabs
 */
export function ProviderNotConnectedWarning({
	channel,
	onConfigureClick,
}: ProviderNotConnectedWarningProps) {
	const channelName = channel === 'sms' ? __('SMS', 'quillcrm') : __('WhatsApp', 'quillcrm');

	return (
		<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
			<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
			<div className="flex-1">
				<p className="text-sm text-yellow-800 mb-2">
					{channel === 'sms'
						? __(
								'Twilio is not configured. Please configure Twilio to send SMS messages.',
								'quillcrm'
						  )
						: __(
								'Twilio is not configured. Please configure Twilio to send WhatsApp messages.',
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
						? __('Configure Twilio to send SMS', 'quillcrm')
						: __('Configure Twilio to send WhatsApp', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
}

