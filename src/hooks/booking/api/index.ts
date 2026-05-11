/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { NAMESPACE } from '@/constants/booking';

/**
 * Turn WP REST / apiFetch errors into a clearer message (includes validation param hints).
 *
 * @param apiPath Relative path passed to callApi (e.g. `integrations/zoom/…/accounts`). Used so
 * Zoom-only copy is not shown for Apple (which also nests credentials under `app_credentials`).
 */
function formatBookingRestError(err: unknown, apiPath = ''): string {
	const e = err as {
		message?: string;
		data?: { params?: Record<string, string> };
	};
	let message =
		typeof e?.message === 'string' && e.message.trim()
			? e.message.trim()
			: __('Something went wrong. Please try again.', 'doublescale');

	const params = e?.data?.params;
	if (params && typeof params === 'object') {
		const lines: string[] = [];
		for (const [key, val] of Object.entries(params)) {
			const detail = typeof val === 'string' ? val : JSON.stringify(val);
			lines.push(`${key}: ${detail}`);
		}
		if (lines.length) {
			const paramsBlob = lines.join(' ').toLowerCase();
			const isInvalidAppCredentials =
				/Invalid parameter\(s\):\s*app_credentials/i.test(message);

			const isZoomCredentialsPath =
				/\/integrations\/zoom\//i.test(apiPath) ||
				/\/zoom\/[\d]+\/accounts/i.test(apiPath);

			const isAppleCredentialsPath =
				/\/integrations\/apple\//i.test(apiPath) ||
				/\/apple\/[\d]+\/accounts/i.test(apiPath);
			const looksLikeAppleParams =
				isAppleCredentialsPath ||
				/\bapple_id\b/.test(paramsBlob) ||
				/\bapp_password\b/.test(paramsBlob);

			let usedFriendlyAppCredentialsMessage = false;

			if (isInvalidAppCredentials && isZoomCredentialsPath) {
				message = __(
					'Zoom could not save your connection. Enter Account ID, Client ID, and Client Secret from your Zoom Server-to-Server OAuth app, then click save again.',
					'doublescale'
				);
				usedFriendlyAppCredentialsMessage = true;
			} else if (isInvalidAppCredentials && looksLikeAppleParams) {
				const missingAppleId = /\bapple_id\b/.test(paramsBlob);
				const missingAppPassword = /\bapp_password\b/.test(paramsBlob);
				if (missingAppleId && missingAppPassword) {
					message = __(
						'Apple Calendar needs your Apple ID (the email for your Apple account) and an app-specific password. Create the password at appleid.apple.com → Sign-In and Security → App-Specific Passwords, then paste both here and save.',
						'doublescale'
					);
				} else if (missingAppleId) {
					message = __(
						'Enter your Apple ID — the email address you use for iCloud and Apple Calendar — then save again.',
						'doublescale'
					);
				} else if (missingAppPassword) {
					message = __(
						'Enter an app-specific password for Apple Calendar (not your normal Apple password). Create one at appleid.apple.com → Sign-In and Security → App-Specific Passwords, then paste it here and save.',
						'doublescale'
					);
				} else {
					message = __(
						'Apple Calendar could not validate your sign-in. Check your Apple ID and app-specific password, then save again.',
						'doublescale'
					);
				}
				usedFriendlyAppCredentialsMessage = true;
			}

			if (!usedFriendlyAppCredentialsMessage) {
				message += '\n\n' + lines.join('\n');
			}
		}
	}

	return message;
}

interface ApiOptions {
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	data?: Record<string, any>;
	onSuccess?: (response: any) => void;
	onError?: (error: string) => void;
	isCore?: boolean;
}

const useApi = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const callApi = useCallback(
		async ({
			path,
			method = 'GET',
			data,
			onSuccess,
			onError,
			isCore = true,
		}: ApiOptions) => {
			setLoading(true);
			setError(null);

			try {
				const response = await apiFetch({
					path: isCore ? `${NAMESPACE}/${path}` : path,
					method,
					data,
				});
				onSuccess?.(response);
			} catch (err: unknown) {
				const message = formatBookingRestError(err, path);
				setError(message);
				onError?.(message);
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	return { callApi, loading, error };
};

export default useApi;
