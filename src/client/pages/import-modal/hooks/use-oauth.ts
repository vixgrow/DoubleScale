/**
 * Custom hook for OAuth operations
 * 
 * Separates OAuth logic from import logic for better maintainability
 */

import { useState, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export interface OAuthState {
	connecting: boolean;
	connected: boolean;
	error: string | null;
}

export interface UseOAuthOptions {
	provider: string;
	onSuccess?: (data: any) => void;
	onError?: (error: any) => void;
	onStatusChange?: (connected: boolean) => void;
}

export const useOAuth = ({ provider, onSuccess, onError, onStatusChange }: UseOAuthOptions) => {
	const { createNotice } = useDispatch('doublescale/core');
	const [state, setState] = useState<OAuthState>({
		connecting: false,
		connected: false,
		error: null,
	});

	const setConnecting = useCallback((connecting: boolean) => {
		setState(prev => ({ ...prev, connecting }));
	}, []);

	const setError = useCallback((error: string | null) => {
		setState(prev => ({ ...prev, error }));
	}, []);

	const setConnected = useCallback((connected: boolean) => {
		setState(prev => ({ ...prev, connected }));
		onStatusChange?.(connected);
	}, [onStatusChange]);

	const handleOAuthMessage = useCallback((event: MessageEvent) => {
		if (event.origin !== window.location.origin) return;

		if (event.data.type === 'QUILLCRM_OAUTH_SUCCESS') {
			if (event.data.provider === provider) {
				setConnecting(false);
				setConnected(true);
				setError(null);
				onSuccess?.(event.data);
			}
		} else if (event.data.type === 'QUILLCRM_OAUTH_ERROR') {
			if (event.data.provider === provider) {
				setConnecting(false);
				setError(event.data.message || __('OAuth authorization failed', 'doublescale'));
				onError?.(event.data);
			}
		}
	}, [provider, onSuccess, onError, setConnecting, setConnected, setError]);

	const setupMessageListener = useCallback(() => {
		window.addEventListener('message', handleOAuthMessage);
		return () => {
			window.removeEventListener('message', handleOAuthMessage);
		};
	}, [handleOAuthMessage]);

	const openOAuthPopup = useCallback((authUrl: string) => {
		const popup = window.open(
			authUrl,
			'oauth_popup',
			'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
		);

		if (!popup) {
			throw new Error(
				__('Failed to open OAuth popup. Please allow popups for this site.', 'doublescale')
			);
		}

		// Monitor popup for manual close
		const checkClosed = setInterval(() => {
			if (popup.closed) {
				clearInterval(checkClosed);
				setConnecting(false);
			}
		}, 1000);

		return popup;
	}, [setConnecting]);

	const initiateOAuth = useCallback(async (credentials?: Record<string, any>) => {
		try {
			setConnecting(true);
			setError(null);

			// Set up message listener
			const cleanup = setupMessageListener();

			// Get OAuth authorization URL
			const authResponse = (await apiFetch({
				path: '/qc/v1/import-export/oauth/authorize',
				method: 'POST',
				data: {
					provider,
					...credentials,
				},
			})) as { authorization_url: string };

			if (!authResponse.authorization_url) {
				throw new Error(
					__('Failed to get OAuth authorization URL', 'doublescale')
				);
			}

			// Open OAuth popup
			const popup = openOAuthPopup(authResponse.authorization_url);

			// Return cleanup function that can be called by the component
			return () => {
				cleanup();
				if (popup && !popup.closed) {
					popup.close();
				}
			};
		} catch (error: any) {
			setConnecting(false);
			const errorMessage = error.message || __('Failed to initiate OAuth authorization', 'doublescale');
			setError(errorMessage);

			createNotice({
				type: 'error',
				message: errorMessage,
			});

			throw error;
		}
	}, [provider, setupMessageListener, openOAuthPopup, setConnecting, setError, createNotice]);

	const disconnect = useCallback(async () => {
		try {
			await apiFetch({
				path: '/qc/v1/import-export/oauth/disconnect',
				method: 'DELETE',
				data: { provider },
			});

			setConnected(false);
			setError(null);

			createNotice({
				type: 'success',
				message: __('Successfully disconnected', 'doublescale'),
			});
		} catch (error: any) {
			const errorMessage = error.message || __('Failed to disconnect', 'doublescale');
			setError(errorMessage);

			createNotice({
				type: 'error',
				message: errorMessage,
			});
		}
	}, [provider, setConnected, setError, createNotice]);

	const checkStatus = useCallback(async () => {
		try {
			const response = await apiFetch({
				path: `/qc/v1/import-export/oauth/status?provider=${provider}`,
				method: 'GET',
			}) as { connected: boolean };

			setConnected(response.connected);
			return response.connected;
		} catch (error: any) {
			setError(error.message || __('Failed to check OAuth status', 'doublescale'));
			return false;
		}
	}, [provider, setConnected, setError]);

	return {
		...state,
		initiateOAuth,
		disconnect,
		checkStatus,
		setConnecting,
		setError,
		setConnected,
	};
};

export default useOAuth;