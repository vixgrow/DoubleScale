/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';

type JotformIntegrationStatus = {
	isConnected: boolean;
	isLoading: boolean;
};

/**
 * Live Jotform connection status from the Integrations REST API.
 * Avoids stale {@see ConfigAPI.getIntegrations()} after saving an API key in the SPA.
 */
export function useJotformIntegrationStatus(): JotformIntegrationStatus {
	const [isConnected, setIsConnected] = useState<boolean>(() =>
		Boolean(ConfigAPI.getIntegrations()?.jotform?.is_connected)
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
					path: '/doublescale/v1/integrations/jotform',
				});

				if (cancelled) {
					return;
				}

				const connected =
					typeof response.is_connected === 'boolean'
						? response.is_connected
						: Boolean(
								(response.settings as { api_key?: string } | undefined)
									?.api_key
							);

				setIsConnected(connected);

				const integrations = ConfigAPI.getIntegrations();
				if (integrations.jotform) {
					ConfigAPI.setIntegrations({
						...integrations,
						jotform: {
							...integrations.jotform,
							is_connected: connected,
						},
					});
				}
			} catch {
				if (!cancelled) {
					setIsConnected(
						Boolean(ConfigAPI.getIntegrations()?.jotform?.is_connected)
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
