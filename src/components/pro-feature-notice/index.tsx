/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { AlertCircle, Crown, ExternalLink } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import config from '../../config';
//@ts-ignore
import proImage from '../../../assets/images/pro_img.png';
import { RocketIcon } from '../icons';

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
	features = [],
}) => {
	return (
		<div className="qcrm-pro-feature-notice">
			<div className="qcrm-pro-feature-notice__container">
				<img src={proImage} alt="Pro Feature" />
				<div className="qcrm-pro-feature-notice__content">
					<h2 className="qcrm-pro-feature-notice__title">
						{featureName} {__('is a Pro Feature', 'quillcrm')}
					</h2>
					{description && (
						<p className="qcrm-pro-feature-notice__description">
							{description}
						</p>
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
						<a
							href={upgradeUrl}
							className="qcrm-pro-feature-notice__button qcrm-pro-feature-notice__button--primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							<RocketIcon />
							{__('Upgrade to Pro', 'quillcrm')}
						</a>
						
					</div>
				</div>
			</div>
		</div>
	);
};
