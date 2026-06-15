/**
 * Client Portal renderer entry. Mounts onto `#doublescale-client-portal` from
 * the `[doublescale_client_portal]` shortcode.
 */

import { createRoot } from '@wordpress/element';

import PortalApp from './app';
import { getPortalConfig } from './config';
import './style.scss';

/**
 * Seed the Free public invoice/proposal renderer config globals from the portal's
 * REST root.
 *
 * The Documents section embeds the standalone PublicInvoiceApp / PublicProposalApp,
 * which read their REST base from `window.doublescale_{invoice,proposal}_config`.
 * WordPress only localizes those globals on the standalone public invoice/proposal
 * pages, so on the portal page they are absent and the apps fall back to a
 * root-relative `/wp-json/...` path that 404s on a subdirectory install. Deriving
 * the base from `rest_root` (WP `rest_url()`) is correct for both pretty and plain
 * permalinks. Only set when absent so a real localized config is never clobbered.
 */
const seedSalesPublicConfig = ( restRoot: string, lang: string ): void => {
	const base = restRoot.replace( /\/$/, '' );
	if ( ! window.doublescale_invoice_config ) {
		window.doublescale_invoice_config = {
			public_rest_url: `${ base }/doublescale/v1/sales/public/invoices`,
			lang,
			mount_id: '',
		};
	}
	if ( ! window.doublescale_proposal_config ) {
		window.doublescale_proposal_config = {
			public_rest_url: `${ base }/doublescale/v1/sales/public/proposals`,
			lang,
			mount_id: '',
		};
	}
};

const config = getPortalConfig();
const mount = config?.mount_id ? document.getElementById(config.mount_id) : null;

if (mount && config) {
	if ( config.rest_root ) {
		seedSalesPublicConfig( config.rest_root, config.lang || '' );
	}

	const rawBoxId = parseInt(mount.getAttribute('data-box-id') || '0', 10);
	if (Number.isFinite(rawBoxId) && rawBoxId > 0) {
		config.box_id = rawBoxId;
	}
	createRoot(mount).render(<PortalApp config={config} />);
}
