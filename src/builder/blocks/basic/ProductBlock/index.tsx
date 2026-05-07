/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { ProductBlockIcon } from '@doublescale/components';

const ProductBlock = {
	type: 'product',
	name: __('Product', 'doublescale'),
	icon: ProductBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default ProductBlock;
