/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import frameDashboardBg from '@doublescale/assets/images/Frame-dashboard.png';
import './style.scss';
import { PageHeader } from '@doublescale/components';
import UpgradeHeroBanner from './upgrade-hero-banner';
import UserDashboard from './user-dashboard';
import { UserDashboardShimmer } from './user-dashboard/UserDashboardShimmer';
import { useDashboardData } from './use-analytics';

/**
 * When the upgrade hero is shown: normal spacing below the tall hero.
 * When it is not shown (e.g. valid license): cards overlap the purple header.
 */
function shouldShowDashboardUpgradeHero(): boolean {
	const license = ConfigAPI.getLicense();
	const isLicensed =
		!!license &&
		typeof license === 'object' &&
		'status' in license &&
		(license as { status: string }).status === 'valid';
	const defaultShow = !isLicensed;
	return applyFilters(
		'doublescale_show_dashboard_upgrade_hero',
		defaultShow
	) as boolean;
}

const Dashboard: React.FC = () => {
	const activeTab = 'user';
	const { data, loading } = useDashboardData();
	const showUpgradeHeroBanner = shouldShowDashboardUpgradeHero();

	const tabTitles: Record<string, string | undefined> = {
		user: undefined,
		contacts: __('Contacts Analytics', 'doublescale'),
		emails: __('Emails Analytics', 'doublescale'),
		cart: __('Cart Analytics', 'doublescale'),
	};

	const hero = (
		<div
			className="doublescale-dashboard-hero"
			style={{ backgroundImage: `url(${frameDashboardBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
		>
			<div className="doublescale-dashboard-hero__header">
				<PageHeader
					title={__('Dashboard', 'doublescale')}
					subtitle={tabTitles[activeTab]}
					actions={[]}
				/>
			</div>
            {showUpgradeHeroBanner && (
				<div className="doublescale-dashboard-hero__promo">
					<UpgradeHeroBanner />
				</div>
			)} 
		</div>
	);

	if (!data || loading) {
		return (
			<div className="doublescale-dashboard">
				{hero}
				<div className="doublescale-dashboard-main">
					<UserDashboardShimmer />
				</div>
			</div>
		);
	}

	return (
		<div className="doublescale-dashboard">
			{hero}
			<div className="doublescale-dashboard-main">
				<UserDashboard dashboardData={data} />
			</div>
		</div>
	);
};

export default Dashboard;
