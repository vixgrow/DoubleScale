/**
 * Customer contract renderer.
 *
 * Mounts onto `#doublescale-contract-view` from the `[doublescale_contract]` shortcode.
 */

import { createRoot } from '@wordpress/element';

import PublicContractApp from './app';
import './style.scss';

const config = window.doublescale_contract_config;
const mount = config?.mount_id ? document.getElementById(config.mount_id) : null;

if (mount) {
	const hash = mount.getAttribute('data-contract-hash') || '';
	if (hash) {
		createRoot(mount).render(<PublicContractApp hash={hash} />);
	}
}

declare global {
	interface Window {
		doublescale_contract_config?: {
			public_rest_url?: string;
			lang?: string;
			mount_id?: string;
		};
	}
}
