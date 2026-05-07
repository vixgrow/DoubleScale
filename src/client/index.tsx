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
