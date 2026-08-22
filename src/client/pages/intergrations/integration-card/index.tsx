/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { PlusIcon } from '@doublescale/components';
import { Card, CardContent } from '@doublescale/components/ui/card';
import { Button } from '@doublescale/components/ui/button';
import { Skeleton } from '@doublescale/components/ui/skeleton';
import { Check, Lock } from 'lucide-react';
import config from '@doublescale/config';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

/**
 * Integrations whose credentials are read-only (the user copies values out of
 * DoubleScale into the third-party app) so there is nothing to "connect" here —
 * the card opens a settings view instead.
 */
const SETTINGS_ONLY_INTEGRATIONS = ['zapier'];

/**
 * Helper function to get button text based on state
 */
const getButtonText = (
	isLoading: boolean,
	isConnected: boolean,
	isSettingsOnly: boolean
) => {
	if (isLoading && (isConnected || isSettingsOnly)) {
		return __('Updating...', 'doublescale');
	}
	if (isConnected || isSettingsOnly) {
		return __('Settings', 'doublescale');
	}
	if (isLoading) {
		return __('Connecting...', 'doublescale');
	}
	return null; // Will show "Connect Now" with icon
};

/**
 * Integration Card Component Props
 */
export interface IntegrationCardProps {
	integrationKey: string;
	integration: any;
	imageUrl: string;
	isLoading: boolean;
	onNavigate: () => void;
	onDisconnect: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
	integrationKey,
	integration,
	imageUrl,
	isLoading,
	onNavigate,
	onDisconnect,
}) => {
	const isSettingsOnly = SETTINGS_ONLY_INTEGRATIONS.includes(integrationKey);
	const buttonText = getButtonText(
		isLoading,
		integration.is_connected,
		isSettingsOnly
	);
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;
	const isProFeature = integration.is_pro && !isProActive;
	const upgradeUrl = config.getUrlDoubleScalePro();
	const {
		isInstalling,
		isActivating,
		handleUpgradeClick,
		getUpgradeButtonText,
	} = useProUpgrade();

	return (
		<Card className="relative h-full overflow-hidden rounded-[20px] border border-border bg-[#F7F8FA]">
			{isLoading && (
				<div className="absolute inset-0 z-10 pointer-events-none">
					<Skeleton className="w-full h-full rounded-lg" />
				</div>
			)}

			<CardContent className={`p-4 h-full flex flex-col ${isLoading ? 'opacity-50' : ''}`}>
				{/* Header with logo and connection status */}
				<div className="flex items-center justify-between mb-3 w-full">
					<div className="flex items-center gap-4 w-full">
						{imageUrl && (
							<div className="w-12 h-12 flex items-center justify-center shrink-0">
								<img
									src={imageUrl}
									alt={integration.label}
									className="max-w-full max-h-full object-contain"
								/>
							</div>
						)}
						<div className="font-semibold text-lg w-full">
							{integration.label}
						</div>
					</div>
					{isProFeature ? (
						<div className="text-white bg-primary rounded-full p-1">
							<Lock className="w-4 h-4" />
						</div>
					) : (
						integration.is_connected && (
							<div className="text-white bg-[#16A34A] rounded-full p-1">
								<Check className="w-4 h-4" />
							</div>
						)
					)}
				</div>

				{/* Description */}
				<div className="text-base text-gray-500 border-b pb-3 flex-1">
					{integration.description}
				</div>

				{/* Action buttons */}
				<div className="flex items-center justify-end gap-3 mt-4">
					{isProFeature ? (
						<Button
							onClick={() => handleUpgradeClick(upgradeUrl)}
							variant="default"
							className="rounded-lg"
							disabled={isInstalling || isActivating}
						>
							{getUpgradeButtonText()}
						</Button>
					) : (
						<>
							<Button
								onClick={onNavigate}
								variant="secondary"
								className="rounded-lg bg-white"
								disabled={isLoading}
							>
								{buttonText || (
									<>
										{__('Connect Now', 'doublescale')}
										<PlusIcon />
									</>
								)}
							</Button>
							{integration.is_connected && (
								<Button
									variant="destructive"
									className="rounded-lg bg-white"
									onClick={onDisconnect}
									disabled={isLoading}
								>
									{isLoading
										? __('Disconnecting...', 'doublescale')
										: __('Disconnect', 'doublescale')}
								</Button>
							)}
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
