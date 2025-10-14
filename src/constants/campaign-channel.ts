/**
 * Campaign Channel Constants (Frontend)
 *
 * These constants MUST match the backend PHP constants in:
 * includes/constants/class-campaign-channel.php
 *
 * @since 1.0.0
 * @package QuillCRM
 */

/**
 * Campaign channel type constants
 * Uses integers to match backend representation
 */
export const CAMPAIGN_CHANNEL = {
	EMAIL: 1,
	SMS: 2,
	WHATSAPP: 3,
	SEQUENCE_MAIL: 4,
} as const;

/**
 * Type for campaign channel values
 */
export type CampaignChannelType = typeof CAMPAIGN_CHANNEL[keyof typeof CAMPAIGN_CHANNEL];

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
	return channel === CAMPAIGN_CHANNEL.SMS || channel === CAMPAIGN_CHANNEL.WHATSAPP;
}

/**
 * Check if channel is email-based
 */
export function isEmailChannel(channel: CampaignChannelType): boolean {
	return channel === CAMPAIGN_CHANNEL.EMAIL || channel === CAMPAIGN_CHANNEL.SEQUENCE_MAIL;
}

/**
 * Get recipient field name for channel
 */
export function getRecipientField(channel: CampaignChannelType): 'email' | 'phone' {
	return channelRequiresPhone(channel) ? 'phone' : 'email';
}

/**
 * Legacy string to integer mapping (for migration)
 * @deprecated Use CAMPAIGN_CHANNEL constants directly
 */
export function legacyStringToChannel(str: string): CampaignChannelType {
	const mapping: Record<string, CampaignChannelType> = {
		'email': CAMPAIGN_CHANNEL.EMAIL,
		'sms': CAMPAIGN_CHANNEL.SMS,
		'whatsapp': CAMPAIGN_CHANNEL.WHATSAPP,
		'sequence_mail': CAMPAIGN_CHANNEL.SEQUENCE_MAIL,
	};

	return mapping[str] || CAMPAIGN_CHANNEL.EMAIL;
}

/**
 * Integer to legacy string mapping (for backward compatibility)
 * @deprecated Will be removed in future version
 */
export function channelToLegacyString(channel: CampaignChannelType): string {
	const mapping: Record<CampaignChannelType, string> = {
		[CAMPAIGN_CHANNEL.EMAIL]: 'email',
		[CAMPAIGN_CHANNEL.SMS]: 'sms',
		[CAMPAIGN_CHANNEL.WHATSAPP]: 'whatsapp',
		[CAMPAIGN_CHANNEL.SEQUENCE_MAIL]: 'sequence_mail',
	};

	return mapping[channel] || 'email';
}
