/**
 * Provider Status Utilities
 * Shared utilities for checking message provider status
 * 
 * @since 1.0.0
 * @package QuillCRM
 */

import apiFetch from '@wordpress/api-fetch';

export interface ProviderStatusResponse {
	connected: boolean;
	provider_name?: string;
	provider_slug?: string;
	error?: string;
	help_link?: string;
}

/**
 * Check provider status for a specific channel
 * 
 * @param channel - The channel to check ('sms' or 'whatsapp')
 * @returns Promise<ProviderStatusResponse>
 */
export async function checkProviderStatus(
	channel: 'sms' | 'whatsapp'
): Promise<ProviderStatusResponse> {
	try {
		const response = await apiFetch({
			path: `/qc/v1/integrations/provider-status?channel=${channel}`,
		}) as ProviderStatusResponse;

		return response;
	} catch (error: any) {
		// If the API call fails, return a disconnected status
		return {
			connected: false,
			error: error.message || `Failed to check ${channel.toUpperCase()} provider status`,
		};
	}
}

