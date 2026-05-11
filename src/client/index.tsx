/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createRoot } from '@wordpress/element';

/**
 * External dependencies
 */
import { ConfigProvider } from 'antd';

/**
 * Internal dependencies — align entry CSS with DoubleScale Pro (Tailwind + globals).
 */
import './style.scss';
import PageLayout from './layout';
import '../stores';
export * from './types';
import '../styles/react-select-global.css';
import LinkTriggers from './pages/link-triggers';
import config from '@doublescale/config';

// Booking admin pages register themselves via `registerAdminPage()` as a side
// effect of the import. Only load when the booking module is enabled so the
// pages don't appear in the sidebar/router when toggled off.
if (config.isModuleEnabled('booking')) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
	require('./pages/booking');
}

/**
 * Link triggers REST + DB live in the free plugin; register the real settings UI here.
 * DoubleScale Pro re-registers this filter at priority 100 when present.
 */
addFilter(
	'doublescale_settings_link_triggers_settings',
	'doublescale/free-link-triggers-settings',
	() => {
		return () => <LinkTriggers />;
	},
	5
);

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
		const cfg = (window as { doublescalePro?: { isPro?: boolean } })
			.doublescalePro;
		return Boolean(cfg?.isPro);
	},
	1
);

const appRoot = document.getElementById( 'doublescale-admin-root' );

if (appRoot) {
	setTimeout(() => {
		createRoot(appRoot).render(
			<ConfigProvider
				theme={{
					token: {
						colorPrimary: '#6d78d8',
					},
					components: {
						Button: {
							algorithm: false,
						},
						Input: {
							paddingBlock: 14,
							paddingInline: 14,
						},
					},
				}}
			>
				<PageLayout />
			</ConfigProvider>
		)
	}, 1500);
}
