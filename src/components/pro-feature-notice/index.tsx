/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import config from '../../config';
//@ts-ignore
import proImage from '../../../assets/images/pro_img.png';
import { PremiumIcon, RocketIcon } from '../icons';
import { useProUpgrade } from '../../hooks/use-pro-upgrade';

interface ProFeatureNoticeProps {
	featureName: string;
	description?: string;
	upgradeUrl?: string;
	features?: string[];
}

export const ProFeatureNotice: React.FC<ProFeatureNoticeProps> = ({
	featureName,
	description,
	upgradeUrl = config.getUrlQuillCRMPro(),
}) => {
	const {
		isInstalling,
		isActivating,
		isLicenseExpired,
		handleUpgradeClick,
		getUpgradeButtonText,
	} = useProUpgrade();

	return (
		<div className="qcrm-pro-feature-notice">
			<div className="qcrm-pro-feature-notice__container">
				<div className="bg-[#FAEADF] text-[#CB5301] rounded-full p-2">
					<PremiumIcon width={54} height={54} />
				</div>
				<div className="qcrm-pro-feature-notice__content">
					<h2 className="qcrm-pro-feature-notice__title">
						{featureName} {__('is a Pro Feature', 'quillcrm')}
					</h2>
					{description && (
						<p className="qcrm-pro-feature-notice__description">
							{description}
						</p>
					)}
					{isLicenseExpired && (
						<div className="mt-3 text-sm text-[#b91c1c] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
							{__(
								'Your license has expired. Renew to continue using Pro features.',
								'quillcrm'
							)}
						</div>
					)}
					{/* {features.length > 0 && (
						<div className="qcrm-pro-feature-notice__features">
							<h3>{__('Pro Features Include:', 'quillcrm')}</h3>
							<ul>
								{features.map((feature) => (
									<li key={feature}>
										<AlertCircle size={16} className='text-[#458DC7]'/>
										{feature}
									</li>
								))}
							</ul>
						</div>
					)} */}
					<div className="qcrm-pro-feature-notice__actions mt-5">
						<a
							href={`${upgradeUrl}#features`}
							className="qcrm-pro-feature-notice__button qcrm-pro-feature-notice__button--secondary"
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('Try a Free demo', 'quillcrm')}
						</a>
						<button
							onClick={() => handleUpgradeClick(upgradeUrl)}
							className="qcrm-pro-feature-notice__button qcrm-pro-feature-notice__button--primary"
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
