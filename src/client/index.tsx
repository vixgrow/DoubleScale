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
import '../api/email-editor-blocks';
import '../styles/react-select-global.css';

const appRoot = document.getElementById('qcrm-admin-root');

if (appRoot) {
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
	);
}
