/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { Plugin, PluginStatus } from './types';

interface UsePluginInstallerReturn {
	checkPluginStatus: (pluginFile: string) => Promise<PluginStatus | null>;
	installPlugin: (plugin: Plugin) => Promise<boolean>;
	activatePlugin: (pluginFile: string) => Promise<boolean>;
	isProcessing: boolean;
}

export function usePluginInstaller(): UsePluginInstallerReturn {
	const { createNotice } = useDispatch('quillcrm/core');
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	const checkPluginStatus = async (
		pluginFile: string
	): Promise<PluginStatus | null> => {
		try {
			const response: {
				data?: Record<
					string,
					{ is_installed?: boolean; is_active?: boolean }
				>;
			} = await apiFetch({
				path: `/qc/v1/plugins/status?plugins=${encodeURIComponent(
					pluginFile
				)}`,
				method: 'GET',
			});

			const status = response?.data?.[pluginFile];
			if (status) {
				return {
					isInstalled: Boolean(status.is_installed),
					isActive: Boolean(status.is_active),
				};
			}
			return null;
		} catch (error: any) {
			console.error('Failed to check plugin status:', error);
			const errorMessage =
				error?.message ||
				error?.data?.message ||
				__('Failed to check plugin status', 'quillcrm');
			createNotice({
				type: 'error',
				message: errorMessage,
			});
			return null;
		}
	};

	const installPlugin = async (plugin: Plugin): Promise<boolean> => {
		if (!plugin.pluginFile || !plugin.downloadUrl) {
			createNotice({
				type: 'error',
				message: __(
					'Plugin information is incomplete. Cannot install.',
					'quillcrm'
				),
			});
			return false;
		}

		setIsProcessing(true);
		try {
			await apiFetch({
				path: '/qc/v1/plugins/install',
				method: 'POST',
				data: {
					download_url: plugin.downloadUrl,
					plugin_file: plugin.pluginFile,
				},
			});

			createNotice({
				type: 'success',
				message: __('Plugin installed successfully', 'quillcrm'),
			});

			return true;
		} catch (error: any) {
			console.error('Failed to install plugin:', error);
			const errorMessage =
				error?.message ||
				error?.data?.message ||
				__('Failed to install plugin', 'quillcrm');
			createNotice({
				type: 'error',
				message: errorMessage,
			});
			return false;
		} finally {
			setIsProcessing(false);
		}
	};

	const activatePlugin = async (pluginFile: string): Promise<boolean> => {
		setIsProcessing(true);
		try {
			await apiFetch({
				path: '/qc/v1/plugins/activate',
				method: 'POST',
				data: {
					plugin_file: pluginFile,
				},
			});

			createNotice({
				type: 'success',
				message: __('Plugin activated successfully', 'quillcrm'),
			});

			return true;
		} catch (error: any) {
			console.error('Failed to activate plugin:', error);
			const errorMessage =
				error?.message ||
				error?.data?.message ||
				__('Failed to activate plugin', 'quillcrm');
			createNotice({
				type: 'error',
				message: errorMessage,
			});
			return false;
		} finally {
			setIsProcessing(false);
		}
	};

	return {
		checkPluginStatus,
		installPlugin,
		activatePlugin,
		isProcessing,
	};
}
