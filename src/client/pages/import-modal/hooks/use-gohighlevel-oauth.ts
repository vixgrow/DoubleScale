/**
 * Custom hook for GoHighLevel OAuth operations
 *
 * Specialized hook that handles GoHighLevel-specific OAuth flow
 */

import { useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useOAuth } from './use-oauth';

export interface GoHighLevelCredentials {
	client_id: string;
	client_secret: string;
}

export interface GoHighLevelOAuthState {
	connected: boolean;
	connecting: boolean;
	error: string | null;
	locationName?: string;
	locationId?: string;
	connectedAt?: string;
	expiresIn?: number;
}

interface UseGoHighLevelOAuthOptions {
	onSuccess?: (data: any) => void;
	onError?: (error: any) => void;
	onDataFetched?: (data: any) => void;
}

export const useGoHighLevelOAuth = ({
	onSuccess,
	onError,
	onDataFetched,
}: UseGoHighLevelOAuthOptions = {}) => {
	const oauth = useOAuth({
		provider: 'gohighlevel',
		onSuccess: (data) => {
			onSuccess?.(data);
			// After successful OAuth, fetch source data
			fetchSourceData();
		},
		onError,
	});

	const fetchSourceData = useCallback(async () => {
		try {
			console.log('GoHighLevel: Fetching source data...');
			const response = (await apiFetch({
				path: '/qc/v1/import-export/gohighlevel',
				method: 'GET',
			})) as { [key: string]: any };

			console.log(
				'GoHighLevel: Source data fetched successfully:',
				response
			);
			onDataFetched?.(response);
			return response;
		} catch (error: any) {
			console.error('GoHighLevel: Failed to fetch source data:', error);
			const errorMessage =
				error.message ||
				__('Failed to fetch GoHighLevel data', 'doublescale');
			oauth.setError(errorMessage);
			throw new Error(errorMessage);
		}
	}, [onDataFetched, oauth]);

	const connectWithCredentials = useCallback(
		async (credentials: GoHighLevelCredentials) => {
			try {
				console.log('GoHighLevel: Validating credentials...');
				// Validate credentials
				if (!credentials.client_id) {
					throw new Error(__('Client ID is required', 'doublescale'));
				}
				if (!credentials.client_secret) {
					throw new Error(
						__('Client Secret is required', 'doublescale')
					);
				}

				console.log('GoHighLevel: Checking OAuth status...');
				// Check if OAuth is already connected first
				const isConnected = await oauth.checkStatus();
				console.log('GoHighLevel: OAuth connected:', isConnected);

				if (isConnected) {
					// Already connected, just fetch data
					console.log(
						'GoHighLevel: Already connected, fetching data...'
					);
					return await fetchSourceData();
				}

				// Not connected, initiate OAuth flow
				console.log('GoHighLevel: Not connected, initiating OAuth...');
				return await oauth.initiateOAuth({
					client_id: credentials.client_id,
					client_secret: credentials.client_secret,
				});
			} catch (error: any) {
				console.error(
					'GoHighLevel: connectWithCredentials error:',
					error
				);
				const errorMessage =
					error.message ||
					__('Failed to connect to GoHighLevel', 'doublescale');
				oauth.setError(errorMessage);
				throw error;
			}
		},
		[oauth, fetchSourceData]
	);

	const reconnect = useCallback(
		async (credentials: GoHighLevelCredentials) => {
			try {
				// Disconnect first, then reconnect
				await oauth.disconnect();
				return await connectWithCredentials(credentials);
			} catch (error: any) {
				const errorMessage =
					error.message ||
					__('Failed to reconnect to GoHighLevel', 'doublescale');
				oauth.setError(errorMessage);
				throw error;
			}
		},
		[oauth, connectWithCredentials]
	);

	const getConnectionStatus = useCallback(async () => {
		try {
			const response = (await apiFetch({
				path: '/qc/v1/import-export/oauth/status?provider=gohighlevel',
				method: 'GET',
			})) as GoHighLevelOAuthState;

			return response;
		} catch (error: any) {
			oauth.setError(
				error.message ||
				__('Failed to get connection status', 'doublescale')
			);
			return null;
		}
	}, [oauth]);

	const isExpiringSoon = useCallback((expiresIn?: number) => {
		if (!expiresIn) return false;
		return expiresIn < 300; // Less than 5 minutes
	}, []);

	const formatTimeRemaining = useCallback((seconds?: number): string => {
		if (!seconds || seconds <= 0) return __('Expired', 'doublescale');

		const minutes = Math.floor(seconds / 60);
		if (minutes < 1) return __('Less than 1 minute', 'doublescale');
		if (minutes === 1) return __('1 minute', 'doublescale');
		return `${minutes} minutes`;
	}, []);

	return {
		...oauth,
		connectWithCredentials,
		reconnect,
		fetchSourceData,
		getConnectionStatus,
		isExpiringSoon,
		formatTimeRemaining,
	};
};
