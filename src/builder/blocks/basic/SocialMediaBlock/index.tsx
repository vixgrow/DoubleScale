/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { SocialMediaBlockIcon } from '@doublescale/components';

const SocialMediaBlock = {
	type: 'social_media',
	name: __('Social Media', 'doublescale'),
	icon: SocialMediaBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default SocialMediaBlock;
