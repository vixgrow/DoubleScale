/**
 * Header Pro Bells
 *
 * Placeholder Inbox + Notification bell icons rendered in the admin
 * header next to the user avatar when the Pro plugin is NOT active.
 * The icons mirror Pro's layout (so the visual hierarchy stays
 * consistent) but clicking either one opens a small popover that
 * promotes the Pro upgrade -- same pattern as ProFeatureNotice, just
 * compact enough to fit a popover surface.
 *
 * When Pro is active, Pro's `addFilter('doublescale_header_before_avatar', ...)`
 * return value replaces this entire output via the filter slot in
 * `src/client/layout/controller.tsx`, so these placeholders never
 * render alongside the real ones.
 */

import { __ } from '@wordpress/i18n';
import { Bell, Mail } from 'lucide-react';

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@doublescale/components/ui/popover';
import config from '@doublescale/config';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';
import { PremiumIcon, RocketIcon } from '@/components/icons';

import './style.scss';

interface ProBellPopoverProps {
	featureName: string;
	description: string;
	icon: React.ReactNode;
	ariaLabel: string;
	buttonClassName: string;
}

const ProBellPopover: React.FC<ProBellPopoverProps> = ({
	featureName,
	description,
	icon,
	ariaLabel,
	buttonClassName,
}) => {
	const {
		isInstalling,
		isActivating,
		isLicenseExpired,
		handleUpgradeClick,
		getUpgradeButtonText,
	} = useProUpgrade();

	const upgradeUrl = config.getUrlDoubleScalePro();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={buttonClassName}
					aria-label={ariaLabel}
				>
					{icon}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="doublescale-header-pro-bell__popover"
				align="end"
				sideOffset={8}
			>
				<div className="doublescale-header-pro-bell__popover-header">
					<div className="doublescale-header-pro-bell__popover-icon">
						<PremiumIcon width={28} height={28} />
					</div>
					<div className="doublescale-header-pro-bell__popover-headings">
						<h3 className="doublescale-header-pro-bell__popover-title">
							{featureName}{' '}
							{__('is a Pro Feature', 'doublescale')}
						</h3>
						<p className="doublescale-header-pro-bell__popover-description">
							{description}
						</p>
					</div>
				</div>

				{isLicenseExpired && (
					<div className="doublescale-header-pro-bell__popover-license-expired">
						{__(
							'Your license has expired. Renew to continue using Pro features.',
							'doublescale'
						)}
					</div>
				)}

				<div className="doublescale-header-pro-bell__popover-actions">
					<a
						href={`${upgradeUrl}#features`}
						target="_blank"
						rel="noopener noreferrer"
						className="doublescale-header-pro-bell__popover-btn doublescale-header-pro-bell__popover-btn--secondary"
					>
						{__('Try a Free demo', 'doublescale')}
					</a>
					<button
						type="button"
						onClick={() => handleUpgradeClick(upgradeUrl)}
						disabled={isInstalling || isActivating}
						className="doublescale-header-pro-bell__popover-btn doublescale-header-pro-bell__popover-btn--primary"
					>
						<RocketIcon />
						{getUpgradeButtonText()}
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export const HeaderProBells: React.FC = () => {
	return (
		<>
			<ProBellPopover
				featureName={__('Inbox', 'doublescale')}
				description={__(
					'Centralize incoming email, SMS and WhatsApp replies from your contacts in one inbox with DoubleScale Pro.',
					'doublescale'
				)}
				icon={<Mail size={20} />}
				ariaLabel={__('Inbox (Pro feature)', 'doublescale')}
				buttonClassName="doublescale-header-pro-bell doublescale-header-pro-bell--inbox"
			/>
			<ProBellPopover
				featureName={__('Notifications', 'doublescale')}
				description={__(
					'Get in-app notifications for automations, campaigns, contacts and pipeline activity with DoubleScale Pro.',
					'doublescale'
				)}
				icon={<Bell size={20} />}
				ariaLabel={__('Notifications (Pro feature)', 'doublescale')}
				buttonClassName="doublescale-header-pro-bell doublescale-header-pro-bell--notifications"
			/>
		</>
	);
};

export default HeaderProBells;
