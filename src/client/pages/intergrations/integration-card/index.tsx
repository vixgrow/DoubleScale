/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { PlusIcon } from '@quillcrm/components';
import { Card, CardContent } from '@quillcrm/components/ui/card';
import { Button } from '@quillcrm/components/ui/button';
import { Skeleton } from '@quillcrm/components/ui/skeleton';
import { Check, Lock } from 'lucide-react';
import config from '@quillcrm/config';

/**
 * Helper function to get button text based on state
 */
const getButtonText = (isLoading: boolean, isConnected: boolean) => {
	if (isLoading && isConnected) {
		return __('Updating...', 'quillcrm');
	}
	if (isConnected) {
		return __('Settings', 'quillcrm');
	}
	if (isLoading) {
		return __('Connecting...', 'quillcrm');
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
	const buttonText = getButtonText(isLoading, integration.is_connected);
	const isProActive = applyFilters(
		'quillcrm_is_pro_active',
		false
	) as boolean;
	const isProFeature = integration.is_pro && !isProActive;
	const upgradeUrl = config.getUrlQuillCRMPro();

	return (
		<Card className="shadow-none max-w-md relative overflow-hidden">
			{isLoading && (
				<div className="absolute inset-0 z-10 pointer-events-none">
					<Skeleton className="w-full h-full rounded-lg" />
				</div>
			)}

			{/* Pro Feature Overlay */}
			{isProFeature && (
				<div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex items-center justify-center">
					<div className="text-center p-4">
						<div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
							<Lock className="w-6 h-6 text-primary" />
						</div>
						<h3 className="font-semibold text-lg mb-1">
							{__('Pro Feature', 'quillcrm')}
						</h3>
						<p className="text-sm text-gray-600 mb-3">
							{__(
								'Upgrade to QuillCRM Pro to unlock this integration',
								'quillcrm'
							)}
						</p>
						<Button
							variant="default"
							size="sm"
							className="rounded-lg"
							onClick={() => window.open(upgradeUrl, '_blank')}
						>
							{__('Upgrade Now', 'quillcrm')}
						</Button>
					</div>
				</div>
			)}

			<CardContent className={`p-4 ${isLoading ? 'opacity-50' : ''}`}>
				{/* Header with logo and connection status - Keep logo visible */}
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-4">
						{imageUrl && (
							<img
								src={imageUrl}
								alt={integration.label}
								className={`max-w-[100px] h-auto ${isProFeature ? 'relative z-30' : ''}`}
							/>
						)}
						<div
							className={`font-semibold text-xl ${isProFeature ? 'blur-sm' : ''}`}
						>
							{integration.label}
						</div>
					</div>
					{integration.is_connected && (
						<div className="text-white bg-[#16A34A] rounded-full p-1">
							<Check className="w-4 h-4" />
						</div>
					)}
				</div>

				{/* Description - Blur only this section for Pro features */}
				<div
					className={`text-base text-gray-500 border-b pb-3 ${isProFeature ? 'blur-sm' : ''}`}
				>
					{integration.description}
				</div>

				{/* Action buttons - Blur only this section for Pro features */}
				<div
					className={`flex items-center justify-end gap-3 mt-4 ${isProFeature ? 'blur-sm' : ''}`}
				>
					<Button
						onClick={onNavigate}
						variant="secondary"
						className="rounded-lg"
						disabled={isLoading || isProFeature}
					>
						{buttonText || (
							<>
								{__('Connect Now', 'quillcrm')}
								<PlusIcon />
							</>
						)}
					</Button>
					{integration.is_connected && (
						<Button
							variant="destructive"
							className="rounded-lg"
							onClick={onDisconnect}
							disabled={isLoading || isProFeature}
						>
							{isLoading
								? __('Disconnecting...', 'quillcrm')
								: __('Disconnect', 'quillcrm')}
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
