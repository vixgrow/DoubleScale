/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';

type TypeformIntegrationStatus = {
	isConnected: boolean;
	isLoading: boolean;
};

/**
 * Live Typeform connection status from the Integrations REST API.
 * Avoids stale {@see ConfigAPI.getIntegrations()} after saving a token in the SPA.
 */
export function useTypeformIntegrationStatus(): TypeformIntegrationStatus {
	const [isConnected, setIsConnected] = useState<boolean>(() =>
		Boolean(ConfigAPI.getIntegrations()?.typeform?.is_connected)
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			try {
				const response = await apiFetch<{
					is_connected?: boolean;
					settings?: Record<string, unknown>;
				}>({
					path: '/doublescale/v1/integrations/typeform',
				});

				if (cancelled) {
					return;
				}

				const connected =
					typeof response.is_connected === 'boolean'
						? response.is_connected
						: Boolean(
								(response.settings as { access_token?: string } | undefined)
									?.access_token
							);

				setIsConnected(connected);

				const integrations = ConfigAPI.getIntegrations();
				if (integrations.typeform) {
					ConfigAPI.setIntegrations({
						...integrations,
						typeform: {
							...integrations.typeform,
							is_connected: connected,
						},
					});
				}
			} catch {
				if (!cancelled) {
					setIsConnected(
						Boolean(ConfigAPI.getIntegrations()?.typeform?.is_connected)
					);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	return { isConnected, isLoading };
}
