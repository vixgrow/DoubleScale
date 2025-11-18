/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { ProductBlockIcon } from '@quillcrm/components';

const ProductBlock = {
	type: 'product',
	name: __('Product', 'quillcrm'),
	icon: ProductBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default ProductBlock;
