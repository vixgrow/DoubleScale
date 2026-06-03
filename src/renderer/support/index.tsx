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

const baseConfig = window.doublescale_support_portal_config as
	| PortalConfig
	| undefined;
const mount = baseConfig?.mount_id
	? document.getElementById(baseConfig.mount_id)
	: null;

if (mount && baseConfig) {
	// The shortcode can scope the portal to one mailbox via `box_id` on the
	// mount node (e.g. [doublescale_support_portal box_id="3"]). 0/absent means
	// unscoped: the customer sees and picks across all mailboxes.
	const rawBoxId = parseInt(mount.getAttribute('data-box-id') || '0', 10);
	const config: PortalConfig = {
		...baseConfig,
		box_id: Number.isFinite(rawBoxId) && rawBoxId > 0 ? rawBoxId : undefined,
	};
	createRoot(mount).render(<PortalApp config={config} />);
}
