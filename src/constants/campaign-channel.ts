/**
 * Campaign Channel Constants (Frontend)
 *
 * These string constants are used in the frontend and sent to the backend API.
 * The backend automatically converts them to integers for database storage.
 *
 * @since 1.0.0
 * @package QuillCRM
 */

/**
 * Campaign channel type constants
 * Uses strings for readability and self-documenting code
 */
export const CAMPAIGN_CHANNEL = {
	EMAIL: 'email',
	SMS: 'sms',
	WHATSAPP: 'whatsapp',
	SEQUENCE_MAIL: 'sequence_mail',
} as const;

/**
 * Type for campaign channel values
 */
export type CampaignChannelType =
	(typeof CAMPAIGN_CHANNEL)[keyof typeof CAMPAIGN_CHANNEL];

/**
 * Get human-readable label for campaign channel
 */
export function getCampaignChannelLabel(channel: CampaignChannelType): string {
	const labels = {
		[CAMPAIGN_CHANNEL.EMAIL]: 'Email',
		[CAMPAIGN_CHANNEL.SMS]: 'SMS',
		[CAMPAIGN_CHANNEL.WHATSAPP]: 'WhatsApp',
		[CAMPAIGN_CHANNEL.SEQUENCE_MAIL]: 'Sequence Mail',
	};

	return labels[channel] || 'Unknown';
}

/**
 * Check if channel requires phone number
 */
export function channelRequiresPhone(channel: CampaignChannelType): boolean {
	return (
		channel === CAMPAIGN_CHANNEL.SMS ||
		channel === CAMPAIGN_CHANNEL.WHATSAPP
	);
}

/**
 * Check if channel is email-based
 */
export function isEmailChannel(channel: CampaignChannelType): boolean {
	return (
		channel === CAMPAIGN_CHANNEL.EMAIL ||
		channel === CAMPAIGN_CHANNEL.SEQUENCE_MAIL
	);
}

/**
 * Get recipient field name for channel
 */
export function getRecipientField(
	channel: CampaignChannelType
): 'email' | 'phone' {
	return channelRequiresPhone(channel) ? 'phone' : 'email';
}
