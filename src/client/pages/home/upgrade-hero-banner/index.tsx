/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button } from 'antd';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import upgradePlanArt from '@doublescale/assets/images/upgrade-plan.png';
import UpgradePlanIcon from './upgrade-plan-icon';

const UpgradeHeroBanner: React.FC = () => {
	const plansUrl = ConfigAPI.getUrlDoubleScalePro();

	return (
		<div className="doublescale-upgrade-hero-banner">
			<div className="doublescale-upgrade-hero-banner__inner">
				<div className="doublescale-upgrade-hero-banner__copy">
					<h2 className="doublescale-upgrade-hero-banner__title">
						{__('Upgrade your plan for more feature access.', 'doublescale')}
					</h2>
					<p className="doublescale-upgrade-hero-banner__text">
						{__(
							'Step into a world of possibilities where growth feels natural and progress flows effortlessly. This is your space to connect, engage, and move forward with confidence—creating a journey that inspires today and opens doors for tomorrow.',
							'doublescale'
						)}
					</p>
					<div className="doublescale-upgrade-hero-banner__actions">
						<Button
							type="default"
							className="doublescale-upgrade-hero-banner__btn-primary"
							onClick={() => {
								window.open(plansUrl, '_blank', 'noopener,noreferrer');
							}}
						>
							<span className="doublescale-upgrade-hero-banner__sparkle inline-flex items-center gap-2">
								<UpgradePlanIcon />
								{__('Upgrade plan', 'doublescale')}
							</span>
						</Button>
						<Button
							type="default"
							className="doublescale-upgrade-hero-banner__btn-secondary"
							onClick={() => {
								window.open(plansUrl, '_blank', 'noopener,noreferrer');
							}}
						>
							{__('See all plans', 'doublescale')}
						</Button>
					</div>
				</div>
				<div className="doublescale-upgrade-hero-banner__art">
					<img
						src={upgradePlanArt}
						alt=""
						className="doublescale-upgrade-hero-banner__art-img"
						decoding="async"
					/>
				</div>
			</div>
		</div>
	);
};

export default UpgradeHeroBanner;
