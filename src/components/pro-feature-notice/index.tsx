/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import config from '@doublescale/config';
import { AlertCircle } from 'lucide-react';
import { PremiumIcon, RocketIcon } from '@/components/icons';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

interface ProFeatureNoticeProps {
	featureName: string;
	description?: string;
	upgradeUrl?: string;
	features?: string[];
}

export const ProFeatureNotice: React.FC<ProFeatureNoticeProps> = ({
	featureName,
	description,
	upgradeUrl = config.getUrlDoubleScalePro(),
	features,
}) => {
	const {
		isInstalling,
		isActivating,
		isLicenseExpired,
		handleUpgradeClick,
		getUpgradeButtonText,
	} = useProUpgrade();

	return (
		<div className="doublescale-pro-feature-notice">
			<div className="doublescale-pro-feature-notice__container">
				<div className="bg-primary/10 text-primary rounded-2xl p-3">
					<PremiumIcon width={40} height={40} />
				</div>
				<div className="doublescale-pro-feature-notice__content">
					<h2 className="doublescale-pro-feature-notice__title">
						{featureName} {__('is a Pro Feature', 'doublescale')}
					</h2>
					{description && (
						<p className="doublescale-pro-feature-notice__description">
							{description}
						</p>
					)}
					{isLicenseExpired && (
						<div className="mt-3 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
							{__(
								'Your license has expired. Renew to continue using Pro features.',
								'doublescale'
							)}
						</div>
					)}
					{features && features.length > 0 && (
						<div className="doublescale-pro-feature-notice__features">
							<h3>{__('Pro features include:', 'doublescale')}</h3>
							<ul>
								{features.map((feature) => (
									<li key={feature}>
										<AlertCircle size={16} className="text-[#458DC7]" />
										{feature}
									</li>
								))}
							</ul>
						</div>
					)}
					<div className="doublescale-pro-feature-notice__actions mt-5">
						<a
							href={`${upgradeUrl}#features`}
							className="doublescale-pro-feature-notice__button doublescale-pro-feature-notice__button--secondary"
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('Try a Free demo', 'doublescale')}
						</a>
						<button
							onClick={() => handleUpgradeClick(upgradeUrl)}
							className="doublescale-pro-feature-notice__button doublescale-pro-feature-notice__button--primary"
							disabled={isInstalling || isActivating}
						>
							<RocketIcon />
							{getUpgradeButtonText()}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
