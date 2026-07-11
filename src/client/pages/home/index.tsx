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
import { Button } from '@/components/ui/button';
import UpgradeHeroBanner from './upgrade-hero-banner';
import SmtpSetupAlert from './smtp-setup-alert';
import UserDashboard from './user-dashboard';
import { UserDashboardShimmer } from './user-dashboard/UserDashboardShimmer';
import { useDashboardData } from './use-analytics';
import AdminCalendar from '../calendar';

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
	const { data, loading, refetch } = useDashboardData();
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

	if (loading && !data) {
		return (
			<div className="doublescale-dashboard">
				{hero}
				<div className="doublescale-dashboard-main">
					<UserDashboardShimmer />
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="doublescale-dashboard">
				{hero}
				<div className="doublescale-dashboard-main flex flex-col items-center justify-center gap-4 px-6 py-16">
					<p className="text-center text-muted-foreground">
						{__(
							'Could not load dashboard data. Check your connection or try again.',
							'doublescale'
						)}
					</p>
					<Button type="button" onClick={() => void refetch()}>
						{__('Try again', 'doublescale')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="doublescale-dashboard">
			{hero}
			<div className="doublescale-dashboard-main">
				<SmtpSetupAlert />
				<UserDashboard dashboardData={data} />
				{/* Cross-module staff calendar — role-scoped server-side. */}
				<AdminCalendar />
			</div>
		</div>
	);
};

export default Dashboard;
