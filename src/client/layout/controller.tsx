/**
 * QuillCRM dependencies
 */
import { registerAdminPage } from '@quillcrm/navigation';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
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
import AbandonedCartsList from '../pages/abandond-carts';
import Setting from '../pages/settings';
import Dashboard from '../pages/home';
import CartAnalysis from '../pages/cart-analytics';
import ContactAnalytics from '../pages/contacts-analytics';
import EmailAnalytics from '../pages/emails-analytics';
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
} from '@quillcrm/components';

// Import Lucide React icon for pipeline
import { TrendingUp } from 'lucide-react';

export const Controller = ({ page }) => {
	useEffect(() => {
		window.document.documentElement.scrollTop = 0;
	}, []);

	return (
		// Using motion div with layoutScroll to reevaluate positions when the user scrolls.
		<motion.div layoutScroll className="qcrm-page-component-wrapper">
			<page.component />
		</motion.div>
	);
};

registerAdminPage('dashboard', {
	path: '/',
	component: () => <Dashboard />,
	label: __('Dashboard', 'quillcrm'),
	icon: <DashboardIcon />,
});

registerAdminPage('contacts', {
	path: 'contacts',
	component: () => <Contacts />,
	label: __('Contacts', 'quillcrm'),
	icon: <ContactsIcon />,
});

registerAdminPage('contact', {
	path: 'contacts/:id/:tab?',
	component: () => <Contact />,
	label: __('Contact', 'quillcrm'),
	hidden: true,
});

registerAdminPage('lists', {
	path: 'lists',
	component: () => <Lists />,
	label: __('Lists', 'quillcrm'),
	hidden: true,
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
});

registerAdminPage('campaigns', {
	path: 'campaigns',
	component: () => <Campaigns />,
	label: __('Campaigns', 'quillcrm'),
	icon: <CampaignsIcon />,
});

registerAdminPage('campaign', {
	path: 'campaigns/:id/:tab?/:subtab?',
	component: () => <Campaign />,
	label: __('Campaign', 'quillcrm'),
	hidden: true,
});

registerAdminPage('sales-pipeline', {
	path: 'sales-pipeline',
	component: () => <SalesPipeline />,
	label: __('Sales Pipeline', 'quillcrm'),
	icon: <TrendingUp size={20} />,
});

registerAdminPage('automations', {
	path: 'automations',
	component: () => <Automations />,
	label: __('Automations', 'quillcrm'),
	icon: <AutomationsIcon />,
});

registerAdminPage('automation', {
	path: 'automations/:id/:tab?',
	component: () => <Automation />,
	label: __('Automation', 'quillcrm'),
	hidden: true,
});

registerAdminPage('forms', {
	path: 'forms',
	component: () => <Forms />,
	label: __('Forms', 'quillcrm'),
	icon: <FormsIcon />,
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
	label: __('Analytics and Reports', 'quillcrm'),
	icon: <AnalyticsReportsIcon />,
});

registerAdminPage('cart-analytics', {
	path: 'cart-analytics',
	component: () => <CartAnalysis />,
	label: __('Cart Analytics', 'quillcrm'),
	hidden: true,
});

registerAdminPage('contacts-analytics', {
	path: 'contacts-analytics',
	component: () => <ContactAnalytics />,
	label: __('Contacts Analytics', 'quillcrm'),
	hidden: true,
});

registerAdminPage('emails-analytics', {
	path: 'emails-analytics',
	component: () => <EmailAnalytics />,
	label: __('Emails Analytics', 'quillcrm'),
	hidden: true,
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
});

registerAdminPage('debug', {
	path: 'debug',
	component: () => <Debug />,
	label: __('Debug', 'quillcrm'),
	hidden: true,
});
