/**
 * QuillCRM dependencies
 */
import { registerAdminPage } from '@quillcrm/navigation';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
import CustomFields from '../pages/custom-fields';
import Campaigns from '../pages/campaigns';
import Campaign from '../pages/campaign';
import Forms from '../pages/forms';
import Form from '../pages/form';
import LinkTriggers from '../pages/link-triggers';
import LinkTrigger from '../pages/link-trigger';
import Integrations from '../pages/intergrations';
import Templates from '../pages/templates';
import Template from '../pages/template';
import Automations from '../pages/automations';
import Automation from '../pages/automation';
import AutomationReports from '../pages/automation-reports';
import AbandonedCartsList from '../pages/abandond-carts';
import Setting from '../pages/settings';
import Dashboard from '../pages/home';
import CartAnalysis from '../pages/home/cart-analytics';
import ContactAnalytics from '../pages/home/contacts-analytics';
import EmailAnalytics from '../pages/home/emails-analytics';
import { useDashboardData } from '../pages/home/use-analytics';
import Debug from '../pages/debug';
import AnalyticsAndReports from '../pages/analytics-and-reports';
import SalesPipeline from '../pages/sales-pipeline';
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

// Import Lucide React icon for pipeline
import { User as UserIcon } from 'lucide-react';
import SequencesMail from '../pages/email-sequences/sequences-mail';
import { Button } from '@quillcrm/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserService } from '@/services/user-service';
import type { User } from '@/services/user-service';

export const Controller = ({ page }) => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	const handleBackToDashboard = () => {
		const ajaxUrl = (window as Window & { ajaxurl?: string }).ajaxurl ?? '';

		if (ajaxUrl.includes('admin-ajax.php')) {
			window.location.href = ajaxUrl.replace('admin-ajax.php', 'index.php');
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
			<page.component />
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
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('contact', {
	path: 'contacts/:id/:tab?',
	component: () => <Contact />,
	label: __('Contact', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
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

registerAdminPage('custom-fields', {
	path: 'custom-fields',
	component: () => <CustomFields />,
	label: __('Custom Fields', 'quillcrm'),
	icon: <CustomFieldsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
	hidden: true,
});

registerAdminPage('campaigns', {
	path: 'campaigns',
	component: () => <Campaigns />,
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

registerAdminPage('sales-pipeline', {
	path: 'sales-pipeline',
	component: () => <SalesPipeline />,
	label: __('Pipelines', 'quillcrm'),
	icon: <PiplelinesIcon />,
	requiredCapability: ['quillcrm_crm_manager', 'quillcrm_deal_owner'],
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

registerAdminPage('link-triggers', {
	path: 'link-triggers',
	component: () => <LinkTriggers />,
	label: __('Link Triggers', 'quillcrm'),
	icon: <ToolsIcon />,
	requiredCapability: ['quillcrm_crm_manager'],
	hidden: true,
});

registerAdminPage('link-trigger', {
	path: 'link-triggers/:id',
	component: () => <LinkTrigger />,
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
	component: () => <AbandonedCartsList />,
	label: __('Abandoned Carts', 'quillcrm'),
	hidden: true,
});

registerAdminPage('analytics-and-reports', {
	path: 'analytics-and-reports',
	component: () => <AnalyticsAndReports />,
	label: __('Analytics', 'quillcrm'),
	icon: <AnalyticsReportsIcon />,
	requiredCapability: ['quillcrm_crm_manager', 'quillcrm_deal_owner'],
});

registerAdminPage('deals-analytics', {
	path: 'deals-analytics',
	component: () => <AnalyticsAndReports defaultTab="deals" />,
	label: __('Deals Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('sales-rep-analytics', {
	path: 'sales-rep-analytics',
	component: () => <AnalyticsAndReports defaultTab="sales-rep" />,
	label: __('Sales Rep Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('pipeline-analytics', {
	path: 'pipeline-analytics',
	component: () => <AnalyticsAndReports defaultTab="pipeline-analysis" />,
	label: __('Pipeline Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

registerAdminPage('my-reports', {
	path: 'my-reports',
	component: () => <AnalyticsAndReports defaultTab="my-reports" />,
	label: __('My Reports', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_deal_owner'],
});

// Wrapper components for analytics pages that need dashboard data
const CartAnalyticsWrapper = () => {
	const { data } = useDashboardData();
	return data ? <CartAnalysis dashboardData={data} /> : null;
};

const ContactAnalyticsWrapper = () => {
	const { data } = useDashboardData();
	return data ? <ContactAnalytics dashboardData={data} /> : null;
};

const EmailAnalyticsWrapper = () => {
	const { data } = useDashboardData();
	return data ? <EmailAnalytics dashboardData={data} /> : null;
};

registerAdminPage('cart-analytics', {
	path: 'cart-analytics',
	component: () => <CartAnalyticsWrapper />,
	label: __('Cart Analytics', 'quillcrm'),
	hidden: true,
	requiredCapability: ['quillcrm_crm_manager'],
});

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
