/**
 * Extensions admin page registration (free + Pro shells).
 */
import { __ } from '@wordpress/i18n';
import { ExtensionsIcon } from '@doublescale/components';
import { registerAdminPage } from '@doublescale/navigation';
import Extensions from './index';

registerAdminPage('extensions', {
	path: 'extensions',
	component: () => <Extensions />,
	label: __('Extensions', 'doublescale'),
	icon: <ExtensionsIcon width={24} height={24} />,
	requiredCapability: ['doublescale_crm_manager'],
});
