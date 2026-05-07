/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * External dependencies
 */
import { ConfigProvider } from 'antd';

/**
 * Internal dependencies
 */
import PageLayout from './layout';
import '../stores';
export * from './types';
import '../styles/react-select-global.css';

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
