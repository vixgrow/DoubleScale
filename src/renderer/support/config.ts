/**
 * Resolve the portal renderer config global.
 *
 * The support ticket views (`app.tsx` + `views/*`) are reused 1:1 inside the
 * unified Client Portal bundle. There, the config is localized under
 * `window.doublescale_client_portal_config` (by the Portal module's
 * PortalFrontendHandler); in the standalone support bundle it is
 * `window.doublescale_support_portal_config`. Both carry the same shape (the
 * Support module injects the support REST bases + uploader settings into the
 * client-portal config via the `doublescale_client_portal_config` filter), so we
 * prefer the unified global and fall back to the support one.
 */

import type { PortalConfig } from './types';

declare global {
	interface Window {
		doublescale_client_portal_config?: PortalConfig;
	}
}

export const getSupportPortalConfig = (): PortalConfig | undefined =>
	window.doublescale_client_portal_config ??
	window.doublescale_support_portal_config;
