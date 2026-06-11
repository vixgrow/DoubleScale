/**
 * Customer proposal renderer.
 *
 * Mounts onto `#doublescale-proposal-view` from the `[doublescale_proposal]` shortcode.
 */

import { createRoot } from '@wordpress/element';

import PublicProposalApp from './app';
import './style.scss';

const config = window.doublescale_proposal_config;
const mount = config?.mount_id ? document.getElementById(config.mount_id) : null;

if (mount) {
	const hash = mount.getAttribute('data-proposal-hash') || '';
	if (hash) {
		createRoot(mount).render(<PublicProposalApp hash={hash} />);
	}
}
