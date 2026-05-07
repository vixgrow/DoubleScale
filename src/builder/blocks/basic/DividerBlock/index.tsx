/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { DividerBlockIcon } from '@doublescale/components';

const DividerBlock = {
	type: 'divider' as const,
	name: __('Divider', 'doublescale'),
	icon: DividerBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default DividerBlock;
