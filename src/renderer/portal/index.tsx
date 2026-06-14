/**
 * Client Portal renderer entry. Mounts onto `#doublescale-client-portal` from
 * the `[doublescale_client_portal]` shortcode.
 */

import { createRoot } from '@wordpress/element';

import PortalApp from './app';
import { getPortalConfig } from './config';
import './style.scss';

const config = getPortalConfig();
const mount = config?.mount_id ? document.getElementById(config.mount_id) : null;

if (mount && config) {
	const rawBoxId = parseInt(mount.getAttribute('data-box-id') || '0', 10);
	if (Number.isFinite(rawBoxId) && rawBoxId > 0) {
		config.box_id = rawBoxId;
	}
	createRoot(mount).render(<PortalApp config={config} />);
}
