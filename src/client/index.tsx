/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies — align entry CSS with DoubleScale Pro (Tailwind + globals).
 */
import './style.scss';
import PageLayout from './layout';
import '../stores';
export * from './types';
import '../styles/react-select-global.css';
import config from '@doublescale/config';

// Booking admin pages register themselves via `registerAdminPage()` as a side
// effect of the import. Only load when the booking module is enabled so the
// pages don't appear in the sidebar/router when toggled off.
if (config.isModuleEnabled('booking')) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
	require('./pages/booking');
}

// Support module pages — same side-effect pattern as booking.
if (config.isModuleEnabled('support')) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
	require('./pages/support');
}

// Knowledge Base module pages — same side-effect pattern.
if (config.isModuleEnabled('knowledgebase')) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
	require('./pages/knowledgebase');
}

// Sales module pages — always register; visibility gated by requiresModule + navbar.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
require('./pages/sales');

// NOTE: the cross-module staff calendar is rendered as a section on the Dashboard
// (`pages/home`), not a separate page — no registration needed here.

/**
 * When PHP marks the install as Pro (`doublescalePro.isPro`), treat Pro as active for
 * sidebar and feature gates even if the Pro client bundle did not register first.
 */
addFilter(
	'doublescale_is_pro_active',
	'doublescale/free-is-pro-from-php-config',
	(active: boolean) => {
		if (active) {
			return active;
		}
		if (config.getProPluginData()?.is_active) {
			return true;
		}
		const cfg = (window as { doublescalePro?: { isPro?: boolean } })
			.doublescalePro;
		return Boolean(cfg?.isPro);
	},
	1
);

const appRoot = document.getElementById( 'doublescale-admin-root' );

if (appRoot) {
	setTimeout(() => {
		createRoot(appRoot).render(<PageLayout />);
	}, 1500);
}
