/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button } from 'antd';
import { X } from 'lucide-react';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import upgradePlanArt from '@doublescale/assets/images/upgrade-plan.png';
import UpgradePlanIcon from './upgrade-plan-icon';

const DISMISS_STORAGE_KEY = 'doublescale.dashboard.upgradeHeroDismissed';

function readDismissed(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	try {
		return window.localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

const UpgradeHeroBanner: React.FC = () => {
	const plansUrl = ConfigAPI.getUrlDoubleScalePro();
	const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());

	if (dismissed) {
		return null;
	}

	const handleDismiss = () => {
		try {
			window.localStorage.setItem(DISMISS_STORAGE_KEY, '1');
		} catch {
			// localStorage may be unavailable (private mode / quota); still hide for this session.
		}
		setDismissed(true);
	};

	return (
		<div className="doublescale-upgrade-hero-banner">
			<button
				type="button"
				className="doublescale-upgrade-hero-banner__dismiss"
				onClick={handleDismiss}
				aria-label={__('Dismiss upgrade banner', 'doublescale')}
			>
				<X size={18} aria-hidden="true" />
			</button>
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
