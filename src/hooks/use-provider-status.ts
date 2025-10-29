/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */

interface ProviderStatus {
	connected: boolean;
	provider_name: string;
	provider_slug: string;
	error: string | null;
	help_link: string;
}

interface UseProviderStatusReturn {
	isConnected: boolean;
	isLoading: boolean;
	providerName: string;
	error: string | null;
	helpLink: string;
	checkStatus: () => Promise<boolean>;
	showConnectionError: () => void;
}

/**
 * Hook to check message provider connection status
 *
 * @param channel Channel type ('sms' or 'whatsapp')
 * @returns Provider status and helper functions
 */
export function useProviderStatus(
	channel: 'sms' | 'whatsapp'
): UseProviderStatusReturn {
	const [status, setStatus] = useState<ProviderStatus | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const { createNotice } = useDispatch('quillcrm/core');

	/**
	 * Fetch provider status from API
	 */
	const fetchStatus = useCallback(async () => {
		setIsLoading(true);
		console.log(`[QuillCRM] Fetching provider status for ${channel}`);
		try {
			const response = await apiFetch<ProviderStatus>({
				path: `/qc/v1/integrations/provider-status?channel=${channel}`,
			});
			console.log(`[QuillCRM] Provider status response for ${channel}:`, response);
			setStatus(response);
			return response.connected;
		} catch (error: any) {
			console.error(`[QuillCRM] Failed to check provider status for ${channel}:`, error);
			setStatus({
				connected: false,
				provider_name: 'Unknown',
				provider_slug: '',
				error:
					error.message ||
					__('Failed to check provider status', 'quillcrm'),
				help_link: '/wp-admin/admin.php?page=quillcrm#/settings/integrations',
			});
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [channel]);

	/**
	 * Check status and return boolean result
	 */
	const checkStatus = useCallback(async (): Promise<boolean> => {
		return await fetchStatus();
	}, [fetchStatus]);

	/**
	 * Show connection error notification
	 * Note: This is now handled by inline UI in the component
	 */
	const showConnectionError = useCallback(() => {
		console.log('[QuillCRM] showConnectionError called', { status, channel });
		
		if (!status || status.connected) {
			console.log('[QuillCRM] Skipping error - no status or already connected');
			return;
		}

		// Inline notification will be shown in the UI component
		// This is just here for backward compatibility
		console.log('[QuillCRM] Provider not configured - inline notification should be visible');
	}, [status, channel]);

	// Fetch status on mount
	useEffect(() => {
		fetchStatus();
	}, [fetchStatus]);

	return {
		isConnected: status?.connected ?? false,
		isLoading,
		providerName: status?.provider_name ?? '',
		error: status?.error ?? null,
		helpLink: status?.help_link ?? '',
		checkStatus,
		showConnectionError,
	};
}
