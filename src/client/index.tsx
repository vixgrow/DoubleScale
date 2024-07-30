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

const appRoot = document.getElementById('qcrm-admin-root');

if (appRoot) {
	createRoot(appRoot).render(
		<ConfigProvider
			theme={{
				components: {
					Button: {
						borderRadius: 0,
						borderRadiusLG: 0,
						borderRadiusSM: 0,
						borderRadiusOuter: 0,
						algorithm: false,
					},
					Input: {
						borderRadius: 0,
						borderRadiusLG: 0,
						borderRadiusSM: 0,
						borderRadiusOuter: 0,
						paddingBlock: 14,
						paddingInline: 14,
					},
				},
			}}
		>
			<PageLayout />
		</ConfigProvider>
	);
}
