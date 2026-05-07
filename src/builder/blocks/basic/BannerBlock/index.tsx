/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { BannerBlockIcon } from '@doublescale/components';

const BannerBlock = {
	type: 'banner' as const,
	name: __('Banner', 'doublescale'),
	icon: BannerBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default BannerBlock;
