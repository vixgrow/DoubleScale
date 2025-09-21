/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { ProductBlockIcon } from '@quillcrm/components';
import { ProductBlockRenderer } from './Renderer';
import { ProductBlockEditor } from './Editor';

export interface ProductBlockProps {
	imageSrc: string;
	imageAlt: string;
	width: string;
	title: string;
	description: string;
	price: string;
	buttonText: string;
	buttonLink: string;
	buttonStyle: 'primary' | 'secondary' | 'tertiary';
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	imagePadding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	borderColor: string;
	titleColor: string;
	descriptionColor: string;
	priceColor: string;
	imageBackgroundColor: string;
}

const ProductBlock = {
	type: 'product',
	name: __('Product', 'quillcrm'),
	icon: ProductBlockIcon,
	defaultProps: {
		imageSrc: '',
		imageAlt: 'Product Image',
		width: '100%',
		title: 'Product Title',
		description: 'Product description goes here',
		price: '99.99 EGP',
		buttonText: 'Shop Now',
		buttonLink: '#',
		buttonStyle: 'primary',
		padding: {
			top: 16,
			right: 16,
			bottom: 16,
			left: 16,
		},
		imagePadding: {
			top: 8,
			right: 8,
			bottom: 8,
			left: 8,
		},
		borderColor: '#e5e7eb',
		titleColor: '#1f2937',
		descriptionColor: '#000000',
		priceColor: '#059669',
		imageBackgroundColor: '#f9fafb',
	} as ProductBlockProps,
	Renderer: ProductBlockRenderer,
	Editor: ProductBlockEditor,
};

export default ProductBlock;
