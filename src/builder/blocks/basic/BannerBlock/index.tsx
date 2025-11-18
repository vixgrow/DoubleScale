/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { BannerBlockIcon } from '@quillcrm/components';

const BannerBlock = {
	type: 'banner' as const,
	icon: BannerBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default BannerBlock;
