/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import config from '../config';

/**
 * Hook to handle Pro upgrade/install/activate logic
 *
 * @returns Object with state and handlers for Pro plugin actions
 */
export const useProUpgrade = () => {
	const license = config.getLicense();
	const pluginData = config.getProPluginData();
	const { createNotice } = useDispatch('doublescale/core');
	const [isInstalling, setIsInstalling] = useState(false);
	const [isActivating, setIsActivating] = useState(false);
	const ajaxUrl = config.getAjaxUrl();

	// Determine button state
	const isProInstalled = pluginData?.is_installed || false;
	const isProActive = pluginData?.is_active || false;
	const isLicenseObject = (value: typeof license): value is typeof license & { status: string } =>
		!!value && typeof value === 'object' && 'status' in value;

	const licenseStatus = isLicenseObject(license) ? license.status : 'none';
	const isLicenseExpired = licenseStatus === 'expired';
	const hasValidLicense = licenseStatus === 'valid';

	// Get plugins page URL
	const getPluginsPageUrl = () => {
		const adminUrl = config.getAdminUrl();
		return `${adminUrl}plugins.php`;
	};

	// Install Pro plugin
	const installPlugin = () => {
		if (isInstalling || isActivating) return;
		setIsInstalling(true);
		const data = new FormData();
		data.append('action', 'doublescale_install_pro');
		data.append('_nonce', config.getNonce());

		fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					config.setProPluginData({
						...config.getProPluginData(),
						is_installed: true,
					});
					createNotice({
						type: 'success',
						message: __('Pro plugin installed successfully.', 'doublescale'),
					});
					// Auto-activate after installation
					activatePlugin();
				} else {
					createNotice({
						type: 'error',
						message: res.data || __('Failed to install Pro plugin.', 'doublescale'),
					});
				}
				setIsInstalling(false);
			})
			.catch(() => {
				createNotice({
					type: 'error',
					message: __('Something went wrong', 'doublescale'),
				});
				setIsInstalling(false);
			});
	};

	// Activate Pro plugin
	const activatePlugin = () => {
		if (isInstalling || isActivating) return;
		setIsActivating(true);
		const data = new FormData();
		data.append('action', 'doublescale_activate_pro');
		data.append('_nonce', config.getNonce());

		fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					config.setProPluginData({
						...config.getProPluginData(),
						is_active: true,
					});
					createNotice({
						type: 'success',
						message: __('Pro plugin activated successfully.', 'doublescale'),
					});
					// Reload page after activation
					setTimeout(() => {
						window.location.reload();
					}, 1000);
				} else {
					createNotice({
						type: 'error',
						message: res.data || __('Failed to activate Pro plugin.', 'doublescale'),
					});
				}
				setIsActivating(false);
			})
			.catch(() => {
				createNotice({
					type: 'error',
					message: __('Something went wrong', 'doublescale'),
				});
				setIsActivating(false);
			});
	};

	// Handle primary button click
	const handleUpgradeClick = (upgradeUrl?: string) => {
		if (isProInstalled && !isProActive) {
			// Redirect to plugins page to activate
			window.location.href = getPluginsPageUrl();
			return;
		}

		if (!isProInstalled && hasValidLicense) {
			// Install Pro plugin only when license is valid
			installPlugin();
			return;
		}

		if (isLicenseExpired) {
			// Renew license -> same as upgrade URL
			const url = upgradeUrl || config.getUrlDoubleScalePro();
			window.open(url, '_blank', 'noopener,noreferrer');
			return;
		}

		// Default: Upgrade to Pro (no license or invalid license)
		const url = upgradeUrl || config.getUrlDoubleScalePro();
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	// Get primary button text
	const getUpgradeButtonText = () => {
		if (isProInstalled && !isProActive) {
			return __('Activate Pro Addon', 'doublescale');
		}

		if (!isProInstalled && hasValidLicense) {
			return isInstalling ? __('Installing...', 'doublescale') : __('Install Pro', 'doublescale');
		}

		if (isLicenseExpired) {
			return __('Renew License', 'doublescale');
		}

		// Default when plugin not installed and license invalid/missing
		return __('Upgrade to Pro', 'doublescale');
	};

	return {
		isProInstalled,
		isProActive,
		hasValidLicense,
		licenseStatus,
		isLicenseExpired,
		isInstalling,
		isActivating,
		handleUpgradeClick,
		getUpgradeButtonText,
		getPluginsPageUrl,
		installPlugin,
		activatePlugin,
	};
};

