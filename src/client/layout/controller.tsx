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
import Lists from '../pages/lists';
import Tags from '../pages/tags';
import CustomFields from '../pages/custom-fields';
import Campaigns from '../pages/campaings';
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

registerAdminPage('home', {
	path: '/',
	component: () => <Dashboard />,
	label: __('Home', 'quillcrm'),
});

registerAdminPage('contacts', {
	path: 'contacts',
	component: () => <Contacts />,
	label: __('Contacts', 'quillcrm'),
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
});

registerAdminPage('tags', {
	path: 'tags',
	component: () => <Tags />,
	label: __('Tags', 'quillcrm'),
});

registerAdminPage('custom-fields', {
	path: 'custom-fields',
	component: () => <CustomFields />,
	label: __('Custom Fields', 'quillcrm'),
});

registerAdminPage('campaigns', {
	path: 'campaigns',
	component: () => <Campaigns />,
	label: __('Campaigns', 'quillcrm'),
});

registerAdminPage('campaign', {
	path: 'campaigns/:id/:tab?/:subtab?',
	component: () => <Campaign />,
	label: __('Campaign', 'quillcrm'),
	hidden: true,
});

registerAdminPage('forms', {
	path: 'forms',
	component: () => <Forms />,
	label: __('Forms', 'quillcrm'),
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
});

registerAdminPage('templates', {
	path: 'templates',
	component: () => <Templates />,
	label: __('Templates', 'quillcrm'),
});

registerAdminPage('template', {
	path: 'templates/:id',
	component: () => <Template />,
	label: __('Template', 'quillcrm'),
	hidden: true,
});

registerAdminPage('automations', {
	path: 'automations',
	component: () => <Automations />,
	label: __('Automations', 'quillcrm'),
});

registerAdminPage('automation', {
	path: 'automations/:id/:tab?',
	component: () => <Automation />,
	label: __('Automation', 'quillcrm'),
	hidden: true,
});

registerAdminPage('abandoned-carts', {
	path: 'abandoned-carts',
	component: () => <AbandonedCartsList />,
	label: __('Abandoned Carts', 'quillcrm'),
});

registerAdminPage('settings', {
	path: 'settings',
	component: () => <Setting />,
	label: __('Settings', 'quillcrm'),
});

registerAdminPage('cart-analytics', {
	path: 'cart-analytics',
	component: () => <CartAnalysis />,
	label: __('Cart Analytics', 'quillcrm'),
});

registerAdminPage('contacts-analytics', {
	path: 'contacts-analytics',
	component: () => <ContactAnalytics />,
	label: __('Contacts Analytics', 'quillcrm'),
});

registerAdminPage('emails-analytics', {
	path: 'emails-analytics',
	component: () => <EmailAnalytics />,
	label: __('Emails Analytics', 'quillcrm'),
});
