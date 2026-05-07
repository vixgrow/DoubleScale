/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Plugin } from './types';
import { usePluginInstaller } from './use-plugin-installer';

interface PluginStatusCardProps {
	readonly plugin: Plugin;
	readonly variant?: 'default' | 'compact';
	readonly onStatusChange?: (isActive: boolean) => void;
	readonly className?: string;
}

export const PluginStatusCard: React.FC<PluginStatusCardProps> = ({
	plugin,
	variant = 'default',
	onStatusChange,
	className = '',
}) => {
	const { checkPluginStatus, installPlugin, activatePlugin, isProcessing } =
		usePluginInstaller();
	const [isChecking, setIsChecking] = useState<boolean>(true);
	const [actualPluginFile, setActualPluginFile] = useState<string | null>(null);
	const [pluginStatus, setPluginStatus] = useState<{
		isInstalled: boolean;
		isActive: boolean;
	}>({
		isInstalled: plugin.isInstalled || false,
		isActive: plugin.isActive || false,
	});

	// Check plugin status on mount
	useEffect(() => {
		const checkStatus = async () => {
			if (!plugin.pluginFile) {
				setIsChecking(false);
				return;
			}

			setIsChecking(true);
			const status = await checkPluginStatus(plugin.pluginFile);
			if (status) {
				setPluginStatus(status);
				// Store the actual plugin file path if it's different from expected
				if (status.actualPluginFile) {
					setActualPluginFile(status.actualPluginFile);
				}
				onStatusChange?.(status.isActive);
			}
			setIsChecking(false);
		};

		checkStatus();
	}, [plugin.pluginFile]);

	const handleInstall = async () => {
		const actualPluginFile = await installPlugin(plugin);
		if (actualPluginFile) {
			// Use the actual plugin file path returned from the server
			// This might differ from the expected path if the plugin folder name is different
			const status = await checkPluginStatus(actualPluginFile);
			if (status) {
				setPluginStatus(status);
				onStatusChange?.(status.isActive);
			}
		}
	};

	const handleActivate = async () => {
		// Use the actual plugin file path if available, otherwise use the expected path
		const pluginFileToActivate = actualPluginFile || plugin.pluginFile;
		if (!pluginFileToActivate) return;

		const success = await activatePlugin(pluginFileToActivate);
		if (success) {
			// Check status using the original plugin file path (the API will find the actual path)
			const status = await checkPluginStatus(plugin.pluginFile);
			if (status) {
				setPluginStatus(status);
				if (status.actualPluginFile) {
					setActualPluginFile(status.actualPluginFile);
				}
				onStatusChange?.(status.isActive);
			}
		}
	};

	const handleConfigure = () => {
		if (plugin.settingsUrl) {
			window.open(plugin.settingsUrl, '_blank');
		}
	};

	// Show skeleton loader while checking
	if (isChecking) {
		return (
			<Card
				className={`p-6 bg-white border border-[#DEE1E6] rounded-lg shadow-sm ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
					<div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
					<div className="h-10 bg-gray-200 rounded w-32"></div>
				</div>
			</Card>
		);
	}

	// Plugin is active - show success state
	if (pluginStatus.isActive) {
		return (
			<Card
				className={`p-6 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg ${className}`}
			>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-[#166534] mb-2 flex items-center gap-2">
							<svg
								className="w-5 h-5"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
							{plugin.name} {__('Active', 'doublescale')}
						</h3>
						{variant === 'default' && (
							<p className="text-sm text-[#166534]">
								{__(
									'Plugin is active and ready to use.',
									'doublescale'
								)}
							</p>
						)}
					</div>
					{plugin.settingsUrl && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleConfigure}
							className="border-[#166534] text-[#166534] hover:bg-[#DCFCE7]"
						>
							{__('Configure', 'doublescale')}
						</Button>
					)}
				</div>
			</Card>
		);
	}

	// Plugin is installed but not active
	if (pluginStatus.isInstalled && !pluginStatus.isActive) {
		return (
			<Card
				className={`p-6 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg ${className}`}
			>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-[#92400E] mb-2 flex items-center gap-2">
							<svg
								className="w-5 h-5"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
							{plugin.name} {__('Not Active', 'doublescale')}
						</h3>
						{variant === 'default' && (
							<p className="text-sm text-[#92400E]">
								{__(
									'Plugin is installed but not active. Activate it to use its features.',
									'doublescale'
								)}
							</p>
						)}
					</div>
					<Button
						variant="default"
						size="sm"
						onClick={handleActivate}
						disabled={isProcessing}
						className="bg-[#D97706] text-white hover:bg-[#B45309]"
					>
						{isProcessing
							? __('Activating...', 'doublescale')
							: __('Activate', 'doublescale')}
					</Button>
				</div>
			</Card>
		);
	}

	// Plugin is not installed
	return (
		<Card
			className={`p-6 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg ${className}`}
		>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-[#991B1B] mb-2 flex items-center gap-2">
						<svg
							className="w-5 h-5"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
						{plugin.name}
					</h3>
					{variant === 'default' && (
						<p className="text-sm text-[#991B1B]">
							{plugin.description ||
								__(
									'Plugin is not installed. Install it to use its features.',
									'doublescale'
								)}
						</p>
					)}
				</div>
				<Button
					variant="default"
					size="sm"
					onClick={handleInstall}
					disabled={isProcessing}
					className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
				>
					{isProcessing
						? __('Installing...', 'doublescale')
						: __('Install', 'doublescale')}
				</Button>
			</div>
		</Card>
	);
};
