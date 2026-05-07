/**
 * DoubleScale dependencies
 */
import {
	registerAdminPage,
	useNavigate,
	useParams,
	getToLink,
} from '@doublescale/navigation';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import config from '@doublescale/config';
import Contacts from '../pages/contacts';
import Contact from '../pages/contact';
import Lists from '../pages/contacts/lists';
import Tags from '../pages/contacts/tags';
// import CustomFields from '../pages/custom-fields'; // Moved to Pro
import Campaign from '../pages/campaign';
import LinkTriggers from '../pages/link-triggers';
import LinkTrigger from '../pages/link-trigger';
import Integrations from '../pages/intergrations';
import Templates from '../pages/templates';
import Template from '../pages/template';
import Automations from '../pages/automations';
import Automation from '../pages/automation';
import AutomationReports from '../pages/automation-reports';
import Setting from '../pages/settings';
import Dashboard from '../pages/home';
import ContactAnalytics from '../pages/home/contacts-analytics';
import EmailAnalytics from '../pages/home/emails-analytics';
import { useDashboardData } from '../pages/home/use-analytics';
import Debug from '../pages/debug';
import AnalyticsAndReports from '../pages/analytics-and-reports';
// import SalesPipeline from '../pages/sales-pipeline'; // Moved to Pro
import { ProFeatureNotice } from '@doublescale/components';
import { ProUpgradeButton } from '@/components/pro-upgrade-button';
import {
	AnalyticsReportsIcon,
	AutomationsIcon,
	CampaignsIcon,
	ContactsIcon,
	DashboardIcon,
	FormsIcon,
	IntegrationsIcon,
	SettingsIcon,
	ToolsIcon,
	CustomFieldsIcon,
	EmailSequenceIcon,
	PiplelinesIcon,
} from '@doublescale/components';
import { TaskDoneIcon as TasksIcon } from '@doublescale/components';
import { RocketIcon } from '@/components/icons';
import AvatarIcon from '@/components/icons/avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserService } from '@/services/user-service';
import type { User } from '@/services/user-service';
import GetStart from '../pages/get-start';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import Forms from '../pages/forms';
import Form from '../pages/form';
import Campaigns_EmailSequences from '../pages/campaigns';

const useOnboardingRedirect = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const checkBusinessSettings = async () => {
			try {
				const settings: any = await apiFetch({
					path: '/doublescale/v1/settings',
				});
				const business = settings?.business || {};

				const hasBusinessData =
					Boolean(business.business_name) ||
					Boolean(business.business_address) ||
					Boolean(business.business_logo);

				const isOnStart = globalThis.location?.hash?.includes('/start');

				if (!hasBusinessData && !isOnStart) {
					navigate(getToLink('start'));
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to check business settings', error);
			}
		};

		void checkBusinessSettings();
	}, [navigate]);
};

export const HeaderBar = ({ page }: { page: any }) => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const navigate = useNavigate();

	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const license = config.getLicense();
	const hasValidLicense =
		Boolean(license) &&
		typeof license === 'object' &&
		'status' in license &&
		(license as unknown as { status: string }).status === 'valid';

	useEffect(() => {
		let isMounted = true;
		const fetchCurrentUser = async () => {
			const globalUser = (window as Window & { qcData?: { currentUser?: any } })
				.qcData?.currentUser;
			if (globalUser) {
				setCurrentUser({
					id: Number(globalUser.id),
					display_name:
						globalUser.display_name ||
						globalUser.name ||
						globalUser.username ||
						'',
					email: globalUser.email || '',
					name: globalUser.name,
					username: globalUser.username,
					avatar_urls: globalUser.avatar_urls,
				});
				return;
			}
			try {
				const user = await UserService.getCurrentUser();
				if (isMounted && user) setCurrentUser(user);
			} catch {
				// silently fail
			}
		};
		fetchCurrentUser();
		return () => {
			isMounted = false;
		};
	}, []);

	const avatarUrl = useMemo(() => {
		if (!currentUser?.avatar_urls) return undefined;
		for (const size of ['48', '96', '64', '24']) {
			const url = currentUser.avatar_urls[size];
			if (!url) {
				continue;
			}
			const normalized = String(url).toLowerCase();
			const isPlaceholderAvatar =
				normalized.includes('gravatar.com/avatar') &&
				(normalized.includes('d=mm') ||
					normalized.includes('d=mystery') ||
					normalized.includes('d=blank') ||
					normalized.includes('d=identicon') ||
					normalized.includes('d=monsterid') ||
					normalized.includes('d=wavatar') ||
					normalized.includes('d=retro'));
			if (!isPlaceholderAvatar) {
				return url;
			}
		}
		return undefined;
	}, [currentUser]);

	const displayName = currentUser?.display_name || __('Guest', 'doublescale');

	return (
		<div className="doublescale-layout__header-bar">
			<div className="doublescale-layout__header-left">
				<span className="doublescale-layout__page-title">{page.label}</span>
			</div>
			<div className="doublescale-layout__header-right">
				{Boolean(
					applyFilters('doublescale_show_activate_license', !hasValidLicense)
				) && (
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							navigate(getToLink('settings/license'));
						}}
						className="doublescale-layout__license-link"
					>
						<RocketIcon />
						{__('Activate License', 'doublescale')}
					</a>
				)}
				{!isProActive && <ProUpgradeButton />}
				{applyFilters('doublescale_header_before_avatar', null) as React.ReactNode}
				<div className="doublescale-layout__header-divider"></div>
				<div className="doublescale-layout__header-user-info">
					<Avatar className="doublescale-layout__header-avatar">
						{avatarUrl ? (
							<AvatarImage src={avatarUrl} alt={displayName} />
						) : null}
						<AvatarFallback className="doublescale-layout__header-avatar-fallback">
							<AvatarIcon />
						</AvatarFallback>
					</Avatar>
					<span className="doublescale-layout__header-user-name">{displayName}</span>
				</div>
			</div>
		</div>
	);
};

export const Controller = ({ page }) => {
	const navigate = useNavigate();
	const params = useParams();

	const { isCrmManager } = useCapabilities();
	if (isCrmManager()) {
		useOnboardingRedirect();
	}

	const handleNavigate = (path: string) => navigate(getToLink(path));

	useEffect(() => {
		window.document.documentElement.scrollTop = 0;
	}, []);

	return (
		<div className="doublescale-page-component-wrapper">
			<page.component navigate={handleNavigate} params={params} />
		</div>
	);
};

registerAdminPage('dashboard', {
	path: '/',
	component: () => <Dashboard />,
	label: __('Dashboard', 'doublescale'),
	icon: <DashboardIcon />,
	requiredCapability: ['doublescale_crm_manager'],
});

registerAdminPage('contacts', {
	path: 'contacts',
	component: () => <Contacts />,
	label: __('Contacts', 'doublescale'),
	icon: <ContactsIcon />,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager', 'doublescale_sales_rep'],
});

registerAdminPage('start', {
	path: 'start',
	component: () => <GetStart />,
	label: __('Get Started', 'doublescale'),
	icon: <DashboardIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	hidden: true,
});

registerAdminPage('contact', {
	path: 'contacts/:id/:tab?',
	component: () => <Contact />,
	label: __('Contact', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager', 'doublescale_sales_rep'],
});

registerAdminPage('lists', {
	path: 'lists',
	component: () => <Lists />,
	label: __('Lists', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager'],
});

registerAdminPage('tags', {
	path: 'tags',
	component: () => <Tags />,
	label: __('Tags', 'doublescale'),
	hidden: true,
});

// Custom Fields page registration - now handled by Pro plugin
registerAdminPage('custom-fields', {
	path: 'custom-fields',
	component: () => (
		<ProFeatureNotice
			featureName={__('Custom Fields', 'doublescale')}
			description={__(
				'Custom Fields is a Pro feature. Please upgrade to the Pro plan to access this feature.',
				'doublescale'
			)}
		/>
	),
	label: __('Custom Fields', 'doublescale'),
	icon: <CustomFieldsIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	hidden: true,
});

registerAdminPage('campaigns', {
	path: 'campaigns',
	component: () => <Campaigns_EmailSequences path="campaigns" />,
	label: __('Campaigns', 'doublescale'),
	icon: <CampaignsIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'campaigns',
});

registerAdminPage('campaign', {
	path: 'campaigns/:id/:tab?/:subtab?',
	component: () => <Campaign />,
	label: __('Campaign', 'doublescale'),
	hidden: true,
	requiresModule: 'campaigns',
});

registerAdminPage('email-sequences', {
	path: 'email-sequences',
	component: () => <Campaigns_EmailSequences path="email-sequences" />,
	label: __('Email Sequences', 'doublescale'),
	icon: <EmailSequenceIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	hidden: true,
	requiresModule: 'campaigns',
});

registerAdminPage('email-sequence', {
	path: 'email-sequences/:id',
	component: () => (
		<ProFeatureNotice
			featureName={__('Email Sequence', 'doublescale')}
			description={__(
				'View and manage email sequences with DoubleScale Pro.',
				'doublescale'
			)}
		/>
	),
	label: __('Email Sequence', 'doublescale'),
	hidden: true,
	requiresModule: 'campaigns',
});

// Sales Pipeline - stub registration that Pro plugin will override via filter
// The Pro plugin uses addFilter('DoubleScale.Navigation.PageSettings') to replace the component
// If Pro is not active, shows upgrade notice instead of blank page
registerAdminPage('sales-pipeline', {
	path: 'sales-pipeline',
	component: () => (
		<ProFeatureNotice
			featureName={__('Sales Pipeline', 'doublescale')}
			description={__(
				'Manage your sales pipeline, track deals through stages, and close more sales with DoubleScale Pro.',
				'doublescale'
			)}
			features={[
				__('Advanced Sales Pipeline Management', 'doublescale'),
				__('Deal Tracking & Analytics', 'doublescale'),
				__('Activity Timeline & Notes', 'doublescale'),
				__('Custom Pipeline Stages', 'doublescale'),
				__('Deal Automation Triggers & Actions', 'doublescale'),
			]}
		/>
	), // Pro plugin overrides with actual pipeline
	label: __('Pipelines', 'doublescale'),
	icon: <PiplelinesIcon />,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager', 'doublescale_sales_rep'],
	requiresModule: 'deals',
});

// Deal Detail - stub registration that Pro plugin will override
registerAdminPage('deal-detail', {
	path: 'pipeline/deal/:id',
	component: () => (
		<ProFeatureNotice
			featureName={__('Deal Details', 'doublescale')}
			description={__(
				'View and manage deal details with DoubleScale Pro.',
				'doublescale'
			)}
		/>
	),
	label: __('Deal Details', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager', 'doublescale_sales_rep'],
	requiresModule: 'deals',
});

registerAdminPage('automations', {
	path: 'automations',
	component: () => <Automations />,
	label: __('Automations', 'doublescale'),
	icon: <AutomationsIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'automations',
});

registerAdminPage('automation', {
	path: 'automations/:id/:tab?',
	component: () => <Automation />,
	label: __('Automation', 'doublescale'),
	hidden: true,
	requiresModule: 'automations',
});

registerAdminPage('automation-reports', {
	path: 'automations/:id/reports',
	component: () => <AutomationReports />,
	label: __('Automation Reports', 'doublescale'),
	hidden: true,
	requiresModule: 'automations',
});

registerAdminPage('forms', {
	path: 'forms',
	component: () => <Forms />,
	label: __('Forms', 'doublescale'),
	icon: <FormsIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'forms',
});

registerAdminPage('form', {
	path: 'forms/:id/:tab?',
	component: () => <Form />,
	label: __('Form', 'doublescale'),
	hidden: true,
	requiresModule: 'forms',
});

registerAdminPage('link-triggers', {
	path: 'link-triggers',
	component: () => <LinkTriggers />,
	label: __('Link Triggers', 'doublescale'),
	icon: <ToolsIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	hidden: true, // Hidden from sidebar - accessible via Settings
});

registerAdminPage('link-trigger', {
	path: 'link-triggers/:id',
	component: () => <LinkTrigger />,
	label: __('Link Trigger', 'doublescale'),
	hidden: true,
});

registerAdminPage('integrations', {
	path: 'integrations/:id?/:tab?',
	component: () => <Integrations />,
	label: __('Integrations', 'doublescale'),
	icon: <IntegrationsIcon />,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'integrations',
});

registerAdminPage('templates', {
	path: 'templates',
	component: () => <Templates />,
	label: __('Templates', 'doublescale'),
	hidden: true,
	requiresModule: 'campaigns',
});

registerAdminPage('template', {
	path: 'templates/:id',
	component: () => <Template />,
	label: __('Template', 'doublescale'),
	hidden: true,
	requiresModule: 'campaigns',
});

registerAdminPage('abandoned-carts', {
	path: 'abandoned-carts',
	component: () => (
		<ProFeatureNotice
			featureName={__('Abandoned Carts', 'doublescale')}
			description={__(
				'Abandoned Carts is a Pro feature. Please upgrade to the Pro plan to access this feature.',
				'doublescale'
			)}
		/>
	),
	label: __('Abandoned Carts', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'campaigns',
});

// Tasks - stub registration that Pro plugin will override via filter
registerAdminPage('tasks', {
	path: 'tasks',
	component: () => (
		<ProFeatureNotice
			featureName={__('Tasks', 'doublescale')}
			description={__(
				'Manage your CRM tasks, schedule follow-ups, and track activities with DoubleScale Pro.',
				'doublescale'
			)}
			features={[
				__('Task Management & Scheduling', 'doublescale'),
				__('Contact & Deal Task Association', 'doublescale'),
				__('Priority & Status Tracking', 'doublescale'),
				__('Task Reminders & Due Dates', 'doublescale'),
				__('Assigned User Management', 'doublescale'),
			]}
		/>
	),
	label: __('Tasks', 'doublescale'),
	icon: <TasksIcon />,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager', 'doublescale_sales_rep'],
	requiresModule: 'tasks',
});

registerAdminPage('analytics-and-reports', {
	path: 'analytics-and-reports',
	component: (props) => <AnalyticsAndReports {...props} />,
	label: __('Analytics', 'doublescale'),
	icon: <AnalyticsReportsIcon />,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager', 'doublescale_sales_rep'],
	requiresModule: 'analytics',
});

registerAdminPage('deals-analytics', {
	path: 'deals-analytics',
	component: (props) => <AnalyticsAndReports {...props} defaultTab="deals" />,
	label: __('Deals Analytics', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager'],
	requiresModule: 'analytics',
});

registerAdminPage('sales-rep-analytics', {
	path: 'sales-rep-analytics',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="sales-rep" />
	),
	label: __('Sales Rep Analytics', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager'],
	requiresModule: 'analytics',
});

registerAdminPage('pipeline-analytics', {
	path: 'pipeline-analytics',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="pipeline-analysis" />
	),
	label: __('Pipeline Analytics', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager'],
	requiresModule: 'analytics',
});

registerAdminPage('my-reports', {
	path: 'my-reports',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="my-reports" />
	),
	label: __('My Reports', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_sales_rep', 'doublescale_sales_manager', 'doublescale_crm_manager'],
	requiresModule: 'analytics',
});

registerAdminPage('cart-analytics', {
	path: 'cart-analytics',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="cart-analytics" />
	),
	label: __('Cart Analytics', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'analytics',
});

const ContactAnalyticsWrapper = () => {
	const { data } = useDashboardData();
	return data ? <ContactAnalytics dashboardData={data} /> : null;
};

const EmailAnalyticsWrapper = () => {
	const { data } = useDashboardData();
	return data ? <EmailAnalytics dashboardData={data} /> : null;
};

registerAdminPage('contacts-analytics', {
	path: 'contacts-analytics',
	component: () => <ContactAnalyticsWrapper />,
	label: __('Contacts Analytics', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'analytics',
});

registerAdminPage('emails-analytics', {
	path: 'emails-analytics',
	component: () => <EmailAnalyticsWrapper />,
	label: __('Emails Analytics', 'doublescale'),
	hidden: true,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'analytics',
});

// registerAdminPage('tools', {
// 	path: 'tools',
// 	component: () => <Tools />,
// 	label: __('Tools', 'doublescale'),
// 	icon: <ToolsIcon />,
// });

registerAdminPage('settings', {
	path: 'settings/:tab?',
	component: () => <Setting />,
	label: __('Settings', 'doublescale'),
	icon: <SettingsIcon />,
	requiredCapability: ['doublescale_crm_manager', 'doublescale_sales_manager', 'doublescale_sales_rep'],
});

registerAdminPage('debug', {
	path: 'debug',
	component: () => <Debug />,
	label: __('Debug', 'doublescale'),
	hidden: true,
});
