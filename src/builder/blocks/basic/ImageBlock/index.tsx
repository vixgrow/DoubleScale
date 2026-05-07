/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { ImageBlockIcon } from '@doublescale/components';
import { ImageBlockRenderer } from './Renderer';
import { ImageBlockEditor } from './Editor';

export interface ImageBlockProps {
	src: string;
	alt: string;
	width: string;
	height: string;
	align: string;
	backgroundColor: string;
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	link: string;
	borderRadius: string;
	shape: string;
	isProActivated: boolean;
	isPro: boolean;
}

const ImageBlock = {
	type: 'image',
	name: __('Image', 'doublescale'),
	icon: ImageBlockIcon,
	isProActivated: false,
	isPro: false,
	defaultProps: {
		src: '',
		alt: 'Image',
		width: '100%',
		height: 'auto',
		align: 'center',
		backgroundColor: 'transparent',
		padding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
		link: '',
		borderRadius: '0',
		shape: 'rectangle',
	} as ImageBlockProps,
	Renderer: ImageBlockRenderer,
	Editor: ImageBlockEditor,
};

export default ImageBlock;
