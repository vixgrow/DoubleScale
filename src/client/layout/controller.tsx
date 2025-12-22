/**
 * QuillCRM dependencies
 */
import {
	registerAdminPage,
	useNavigate,
	useParams,
	getToLink,
} from '@quillcrm/navigation';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

/**
 * External Dependencies
 */
import { motion } from 'framer-motion';

/**
 * Internal dependencies
 */
import Contacts from '../pages/contacts';
import Contact from '../pages/contact';
import Lists from '../pages/contacts/lists';
import Tags from '../pages/contacts/tags';
// import CustomFields from '../pages/custom-fields'; // Moved to Pro
import Campaigns from '../pages/campaigns';
import Campaign from '../pages/campaign';
// import LinkTriggers from '../pages/link-triggers'; // Moved to Pro
// import LinkTrigger from '../pages/link-trigger'; // Moved to Pro
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
import { ProFeatureNotice } from '@quillcrm/components';
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
	WordPressIcon,
} from '@quillcrm/components';
import EmailSequences from '../pages/email-sequences';
import { User as UserIcon } from 'lucide-react';
import SequencesMail from '../pages/email-sequences/sequences-mail';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserService } from '@/services/user-service';
import type { User } from '@/services/user-service';
import GetStart from '../pages/get-start';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import Forms from '../pages/forms';
import Form from '../pages/form';
import Campaigns_EmailSequences from '../pages/campaigns';

const useOnboardingRedirect = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const checkBusinessSettings = async () => {
			try {
				const settings: any = await apiFetch({
					path: '/qc/v1/settings',
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

export const Controller = ({ page }) => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const navigate = useNavigate();
	const params = useParams();

	// Check if Pro is active
	const isProActive = applyFilters(
		'quillcrm_is_pro_active',
		false
	) as boolean;

	const { isCrmManager } = useCapabilities();
	if (isCrmManager()) {
		useOnboardingRedirect();
	}

	// Navigation helper for Pro components
	const handleNavigate = (path: string) => navigate(getToLink(path));

	const handleBackToDashboard = () => {
		const ajaxUrl = (window as Window & { ajaxurl?: string }).ajaxurl ?? '';

		if (ajaxUrl.includes('admin-ajax.php')) {
			window.location.href = ajaxUrl.replace(
				'admin-ajax.php',
				'index.php'
			);
			return;
		}

		window.location.href = `${window.location.origin}/wp-admin/`;
	};

	useEffect(() => {
		window.document.documentElement.scrollTop = 0;
	}, []);

	useEffect(() => {
		let isMounted = true;

		const normalizeUser = (user: any): User | null => {
			if (!user) {
				return null;
			}

			const displayName =
				user.display_name ||
				user.name ||
				user.username ||
				(user.id ? `User ${user.id}` : '');

			return {
				id: Number(user.id),
				display_name: displayName,
				email: user.email || '',
				name: user.name,
				username: user.username,
				avatar_urls: user.avatar_urls,
			};
		};

		const fetchCurrentUser = async () => {
			const globalUser = (
				window as Window & {
					qcData?: { currentUser?: any };
				}
			).qcData?.currentUser;

			if (globalUser) {
				const normalizedUser = normalizeUser(globalUser);

				if (isMounted && normalizedUser) {
					setCurrentUser(normalizedUser);
				}

				return;
			}

			try {
				const user = await UserService.getCurrentUser();

				if (isMounted && user) {
					setCurrentUser(user);
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to load current user', error);
			}
		};

		fetchCurrentUser();

		return () => {
			isMounted = false;
		};
	}, []);

	const avatarUrl = useMemo(() => {
		if (!currentUser?.avatar_urls) {
			return undefined;
		}

		const preferredSizes = ['96', '64', '48', '24'];

		for (const size of preferredSizes) {
			if (currentUser.avatar_urls[size]) {
				return currentUser.avatar_urls[size];
			}
		}

		return undefined;
	}, [currentUser]);

	const displayName = currentUser?.display_name || __('Guest', 'quillcrm');

	const avatarInitials = useMemo(() => {
		if (!currentUser?.display_name) {
			return '';
		}

		const parts = currentUser.display_name
			.split(' ')
			.map((part) => part.trim())
			.filter(Boolean);

		if (!parts.length) {
			return currentUser.display_name.slice(0, 2).toUpperCase();
		}

		return parts
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase();
	}, [currentUser]);

	return (
		// Using motion div with layoutScroll to reevaluate positions when the user scrolls.
		<motion.div layoutScroll className="qcrm-page-component-wrapper">
			<div className="flex justify-between items-center w-full">
				<div
					className="text-[#CB5301] flex items-center gap-2 cursor-pointer text-base p-0 bg-transparent"
					onClick={handleBackToDashboard}
				>
					<WordPressIcon />
					{__('Back to WordPress Dashboard', 'quillcrm')}
				</div>
				<div className="flex items-center gap-3 justify-end w-1/2">
					{!isProActive && <ProUpgradeButton />}
					<Avatar className="w-10 h-10 bg-[#F5F5F5]">
						{avatarUrl ? (
							<AvatarImage src={avatarUrl} alt={displayName} />
						) : null}
						<AvatarFallback className="text-[#1D1F2C] flex items-center justify-center uppercase">
							{avatarInitials || <UserIcon className="w-5 h-5" />}
						</AvatarFallback>
					</Avatar>
					<div className="text-lg font-semibold text-[#333333]">
						{displayName}
					</div>
				</div>
			</div>
			<page.component navigate={handleNavigate} params={params} />
		</motion.div>
	);
};

registerAdminPage('dashboard', {
	path: '/',
	component: () => <Dashboard />,
	label: __('Dashboard', 'quillcrm'),
	icon: <DashboardIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('contacts', {
	path: 'contacts',
	component: () => <Contacts />,
	label: __('Contacts', 'quillcrm'),
	icon: <ContactsIcon />,
	requiredCapability: ['quillcrm_crm_manager', 'quillcrm_sales_rep'],
});

registerAdminPage('start', {
	path: 'start',
	component: () => <GetStart />,
	label: __('Get Started', 'quillcrm'),
	icon: <DashboardIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
	hidden: true,
});

registerAdminPage('contact', {
	path: 'contacts/:id/:tab?',
	component: () => <Contact />,
	label: __('Contact', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager', 'quillcrm_sales_rep'],
});

registerAdminPage('lists', {
	path: 'lists',
	component: () => <Lists />,
	label: __('Lists', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('tags', {
	path: 'tags',
	component: () => <Tags />,
	label: __('Tags', 'quillcrm'),
	hidden: true,
});

// Custom Fields page registration - now handled by Pro plugin
registerAdminPage('custom-fields', {
	path: 'custom-fields',
	component: () => (
		<ProFeatureNotice
			featureName={__('Custom Fields', 'quillcrm')}
			description={__(
				'Custom Fields is a Pro feature. Please upgrade to the Pro plan to access this feature.',
				'quillcrm'
			)}
		/>
	),
	label: __('Custom Fields', 'quillcrm'),
	icon: <CustomFieldsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
	hidden: true,
});

registerAdminPage('campaigns', {
	path: 'campaigns',
	component: () => <Campaigns_EmailSequences />,
	label: __('Campaigns', 'quillcrm'),
	icon: <CampaignsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('campaign', {
	path: 'campaigns/:id/:tab?/:subtab?',
	component: () => <Campaign />,
	label: __('Campaign', 'quillcrm'),
	hidden: true,
});

registerAdminPage('email-sequences', {
	path: 'email-sequences',
	component: () => <EmailSequences />,
	label: __('Email Sequence', 'quillcrm'),
	icon: <EmailSequenceIcon />,
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('email-sequence', {
	path: 'email-sequences/:id',
	component: () => <SequencesMail />,
	label: __('Email Sequence', 'quillcrm'),
	hidden: true,
});

// Sales Pipeline - stub registration that Pro plugin will override via filter
// The Pro plugin uses addFilter('QuillCRM.Navigation.PageSettings') to replace the component
// If Pro is not active, shows upgrade notice instead of blank page
registerAdminPage('sales-pipeline', {
	path: 'sales-pipeline',
	component: () => (
		<ProFeatureNotice
			featureName={__('Sales Pipeline', 'quillcrm')}
			description={__(
				'Manage your sales pipeline, track deals through stages, and close more sales with QuillCRM Pro.',
				'quillcrm'
			)}
			features={[
				__('Advanced Sales Pipeline Management', 'quillcrm'),
				__('Deal Tracking & Analytics', 'quillcrm'),
				__('Activity Timeline & Notes', 'quillcrm'),
				__('Custom Pipeline Stages', 'quillcrm'),
				__('Deal Automation Triggers & Actions', 'quillcrm'),
			]}
		/>
	), // Pro plugin overrides with actual pipeline
	label: __('Pipelines', 'quillcrm'),
	icon: <PiplelinesIcon />,
	requiredCapability: ['quillcrm_crm_manager', 'quillcrm_sales_rep'],
});

// Deal Detail - stub registration that Pro plugin will override
registerAdminPage('deal-detail', {
	path: 'pipeline/deal/:id',
	component: () => (
		<ProFeatureNotice
			featureName={__('Deal Details', 'quillcrm')}
			description={__(
				'View and manage deal details with QuillCRM Pro.',
				'quillcrm'
			)}
		/>
	),
	label: __('Deal Details', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager', 'quillcrm_sales_rep'],
});

registerAdminPage('automations', {
	path: 'automations',
	component: () => <Automations />,
	label: __('Automations', 'quillcrm'),
	icon: <AutomationsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('automation', {
	path: 'automations/:id/:tab?',
	component: () => <Automation />,
	label: __('Automation', 'quillcrm'),
	hidden: true,
});

registerAdminPage('automation-reports', {
	path: 'automations/:id/reports',
	component: () => <AutomationReports />,
	label: __('Automation Reports', 'quillcrm'),
	hidden: true,
});

registerAdminPage('forms', {
	path: 'forms',
	component: () => <Forms />,
	label: __('Forms', 'quillcrm'),
	icon: <FormsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('form', {
	path: 'forms/:id/:tab?',
	component: () => <Form />,
	label: __('Form', 'quillcrm'),
	hidden: true,
});

// Link Triggers - stub registration that Pro plugin will override
registerAdminPage('link-triggers', {
	path: 'link-triggers',
	component: () => (
		<ProFeatureNotice
			featureName={__('Link Triggers', 'quillcrm')}
			description={__(
				'Create trackable links with automated actions. Track clicks, auto-login users, and trigger automations with QuillCRM Pro.',
				'quillcrm'
			)}
		/>
	),
	label: __('Link Triggers', 'quillcrm'),
	icon: <ToolsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
	hidden: true, // Hidden from sidebar - accessible via Settings
});

// Link Trigger Edit - stub registration
registerAdminPage('link-trigger', {
	path: 'link-triggers/:id',
	component: () => (
		<ProFeatureNotice
			featureName={__('Link Triggers', 'quillcrm')}
			description={__(
				'Create trackable links with automated actions. Track clicks, auto-login users, and trigger automations with QuillCRM Pro.',
				'quillcrm'
			)}
		/>
	),
	label: __('Link Trigger', 'quillcrm'),
	hidden: true,
});

registerAdminPage('integrations', {
	path: 'integrations/:id?/:tab?',
	component: () => <Integrations />,
	label: __('Integrations', 'quillcrm'),
	icon: <IntegrationsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('templates', {
	path: 'templates',
	component: () => <Templates />,
	label: __('Templates', 'quillcrm'),
	hidden: true,
});

registerAdminPage('template', {
	path: 'templates/:id',
	component: () => <Template />,
	label: __('Template', 'quillcrm'),
	hidden: true,
});

registerAdminPage('abandoned-carts', {
	path: 'abandoned-carts',
	component: () => (
		<ProFeatureNotice
			featureName={__('Abandoned Carts', 'quillcrm')}
			description={__(
				'Abandoned Carts is a Pro feature. Please upgrade to the Pro plan to access this feature.',
				'quillcrm'
			)}
		/>
	),
	label: __('Abandoned Carts', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('analytics-and-reports', {
	path: 'analytics-and-reports',
	component: (props) => <AnalyticsAndReports {...props} />,
	label: __('Analytics', 'quillcrm'),
	icon: <AnalyticsReportsIcon />,
	requiredCapability: ['quillcrm_crm_manager', 'quillcrm_sales_rep'],
});

registerAdminPage('deals-analytics', {
	path: 'deals-analytics',
	component: (props) => <AnalyticsAndReports {...props} defaultTab="deals" />,
	label: __('Deals Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('sales-rep-analytics', {
	path: 'sales-rep-analytics',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="sales-rep" />
	),
	label: __('Sales Rep Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('pipeline-analytics', {
	path: 'pipeline-analytics',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="pipeline-analysis" />
	),
	label: __('Pipeline Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('my-reports', {
	path: 'my-reports',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="my-reports" />
	),
	label: __('My Reports', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_sales_rep', 'quillcrm_crm_manager'],
});

registerAdminPage('cart-analytics', {
	path: 'cart-analytics',
	component: (props) => (
		<AnalyticsAndReports {...props} defaultTab="cart-analytics" />
	),
	label: __('Cart Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
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
	label: __('Contacts Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('emails-analytics', {
	path: 'emails-analytics',
	component: () => <EmailAnalyticsWrapper />,
	label: __('Emails Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

// registerAdminPage('tools', {
// 	path: 'tools',
// 	component: () => <Tools />,
// 	label: __('Tools', 'quillcrm'),
// 	icon: <ToolsIcon />,
// });

registerAdminPage('settings', {
	path: 'settings',
	component: () => <Setting />,
	label: __('Settings', 'quillcrm'),
	icon: <SettingsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('debug', {
	path: 'debug',
	component: () => <Debug />,
	label: __('Debug', 'quillcrm'),
	hidden: true,
});
