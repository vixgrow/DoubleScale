/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { ImageBlockIcon } from '@quillcrm/components';
import { ImageBlockRenderer } from './Renderer';
import { ImageBlockEditor } from './Editor';

export interface ImageBlockProps {
	src: string;
	alt: string;
	width: string;
	align: string;
}

export const ImageBlock = {
	type: 'image',
	name: __('Image', 'quillcrm'),
	icon: ImageBlockIcon,
	defaultProps: {
		src: 'https://via.placeholder.com/400x200?text=Image',
		alt: 'Image',
		width: '100%',
		align: 'center',
	} as ImageBlockProps,
	Renderer: ImageBlockRenderer,
	Editor: ImageBlockEditor,
};
