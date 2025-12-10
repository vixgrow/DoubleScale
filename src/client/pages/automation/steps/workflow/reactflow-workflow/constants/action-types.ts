/**
 * Constants for automation action types
 */

export const ANALYTICS_ACTIONS = ['send_email', 'send_sms', /* 'send_whatsapp' */] as const; // WhatsApp - Coming in next version

export type AnalyticsActionType = typeof ANALYTICS_ACTIONS[number];

export type ActionChannelType = 'email' | 'sms' /* | 'whatsapp' */; // WhatsApp - Coming in next version

/**
 * Check if an action supports analytics
 */
export const supportsAnalytics = (action: string): action is AnalyticsActionType => {
	return ANALYTICS_ACTIONS.includes(action as AnalyticsActionType);
};

/**
 * Get channel type from action name
 */
export const getChannelType = (action: string): ActionChannelType => {
	if (action === 'send_email') return 'email';
	if (action === 'send_sms') return 'sms';
	// if (action === 'send_whatsapp') return 'whatsapp'; // WhatsApp - Coming in next version
	return 'email'; // fallback
};
