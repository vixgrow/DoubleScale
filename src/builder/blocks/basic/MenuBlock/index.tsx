/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { MenuBlockIcon } from '@doublescale/components';

const MenuBlock = {
	type: 'menu',
	name: __('Menu', 'doublescale'),
	icon: MenuBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default MenuBlock;
