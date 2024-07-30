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
	label: __('Dashboard', 'quillcrm'),
	component: () => <h1>{__('Dashboard', 'quillcrm')}</h1>,
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
	path: 'campaigns/:id/:tab?',
	component: () => <Campaign />,
	label: __('Campaign', 'quillcrm'),
});
