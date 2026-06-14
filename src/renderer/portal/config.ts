import type { PortalRendererConfig } from './types';

export const getPortalConfig = (): PortalRendererConfig | undefined =>
	window.doublescale_client_portal_config;
