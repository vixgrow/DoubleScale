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

interface ProFeatureNoticeProps {
	featureName: string;
	description?: string;
	upgradeUrl?: string;
}

export const ProFeatureNotice: React.FC<ProFeatureNoticeProps> = ({
	featureName,
	description,
	upgradeUrl = config.getUrlQuillCRMPro(),
}) => {
	return (
		<div className="qcrm-pro-feature-notice">
			<div className="qcrm-pro-feature-notice__container">
				<div className="qcrm-pro-feature-notice__icon">
					<Crown size={48} />
				</div>
				<div className="qcrm-pro-feature-notice__content">
					<h2 className="qcrm-pro-feature-notice__title">
						<Crown
							size={24}
							className="qcrm-pro-feature-notice__title-icon"
						/>
						{featureName} {__('is a Pro Feature', 'quillcrm')}
					</h2>
					{description && (
						<p className="qcrm-pro-feature-notice__description">
							{description}
						</p>
					)}
					<div className="qcrm-pro-feature-notice__features">
						<h3>{__('Pro Features Include:', 'quillcrm')}</h3>
						<ul>
							<li>
								<AlertCircle size={16} />
								{__(
									'Advanced Sales Pipeline Management',
									'quillcrm'
								)}
							</li>
							<li>
								<AlertCircle size={16} />
								{__('Deal Tracking & Analytics', 'quillcrm')}
							</li>
							<li>
								<AlertCircle size={16} />
								{__('Activity Timeline & Notes', 'quillcrm')}
							</li>
							<li>
								<AlertCircle size={16} />
								{__('Custom Pipeline Stages', 'quillcrm')}
							</li>
							<li>
								<AlertCircle size={16} />
								{__(
									'Deal Automation Triggers & Actions',
									'quillcrm'
								)}
							</li>
						</ul>
					</div>
					<div className="qcrm-pro-feature-notice__actions">
						<a
							href={upgradeUrl}
							className="qcrm-pro-feature-notice__button qcrm-pro-feature-notice__button--primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Crown size={20} />
							{__('Upgrade to Pro', 'quillcrm')}
							<ExternalLink size={16} />
						</a>
						<a
							href={`${upgradeUrl}#features`}
							className="qcrm-pro-feature-notice__button qcrm-pro-feature-notice__button--secondary"
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('Learn More', 'quillcrm')}
							<ExternalLink size={16} />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};
