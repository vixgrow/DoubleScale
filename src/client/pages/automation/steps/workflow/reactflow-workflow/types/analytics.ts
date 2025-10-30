/**
 * TypeScript types for automation step analytics
 */

/**
 * Raw analytics response from backend API
 */
export interface StepAnalyticsResponse {
	sent: number;
	opened: number;
	clicked: number;
	delivered: number;
	read: number;
	unsubscribed: number;
	openRate: number;
	clickRate: number;
	deliveryRate: number;
	readRate: number;
	unsubscribedRate: number;
}

/**
 * Analytics data formatted for AnalyticsPopup component
 */
export interface FormattedAnalytics {
	sent: number;
	clickRate: number;
	unsubscribedRate: number;  // Renamed for clarity - it's a percentage
	openRate: number;
	clickToOpenRate: number;
}

/**
 * Transform backend analytics response to popup format
 */
export const formatAnalyticsForPopup = (
	data: StepAnalyticsResponse
): FormattedAnalytics => {
	return {
		sent: data.sent,
		clickRate: data.clickRate,
		unsubscribedRate: data.unsubscribedRate,
		openRate: data.openRate,
		// Calculate click-to-open rate using raw counts for accuracy
		clickToOpenRate:
			data.opened > 0
				? (data.clicked / data.opened) * 100
				: 0,
	};
};
