/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { MenuBlockIcon } from '@quillcrm/components';

const MenuBlock = {
	type: 'menu',
	name: __('Menu', 'quillcrm'),
	icon: MenuBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default MenuBlock;
