/**
 * Customer invoice renderer.
 *
 * Mounts onto `#doublescale-invoice-view` from the `[doublescale_invoice]` shortcode.
 */

import { createRoot } from '@wordpress/element';

import PublicInvoiceApp from './app';
import './style.scss';

const config = window.doublescale_invoice_config;
const mount = config?.mount_id ? document.getElementById(config.mount_id) : null;

if (mount) {
	const hash = mount.getAttribute('data-invoice-hash') || '';
	if (hash) {
		createRoot(mount).render(<PublicInvoiceApp hash={hash} />);
	}
}
