/**
 * Customer support portal renderer.
 *
 * Mounts a small SPA onto the `#doublescale-support-portal` div emitted by
 * the `[doublescale_support_portal]` shortcode. Routes are internal state
 * (no React Router) — the portal lives inside a host page, so changing
 * `window.location` would navigate away from the shortcode page.
 */

import { createRoot } from '@wordpress/element';

import type { PortalConfig } from './types';
import PortalApp from './app';
import './style.scss';

const config = window.doublescale_support_portal_config as PortalConfig | undefined;
const mount = config?.mount_id ? document.getElementById(config.mount_id) : null;

if (mount && config) {
	createRoot(mount).render(<PortalApp config={config} />);
}
