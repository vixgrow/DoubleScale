/**
 * Provider Status Utilities
 * Shared utilities for checking message provider status
 * 
 * @since 1.0.0
 * @package DoubleScale
 */

import apiFetch from '@wordpress/api-fetch';

export interface ProviderStatusResponse {
	connected: boolean;
	provider_name?: string;
	provider_slug?: string;
	/** The provider the user selected as default, which may differ from provider_slug. */
	selected_slug?: string;
	/** True when the selected provider was unusable and another one is being used instead. */
	using_fallback?: boolean;
	/** Human-readable explanation of the fallback, when using_fallback is true. */
	fallback_notice?: string | null;
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
			path: `/doublescale/v1/integrations/provider-status?channel=${channel}`,
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

