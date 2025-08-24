/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { BannerBlockIcon } from '@quillcrm/components';
import { BannerRenderer } from './Renderer';
import { BannerEditor } from './Editor';

export interface BannerBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
	src: string;
	alt: string;
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
	rotation: number;
}

const BannerBlock = {
	type: 'banner' as const,
	name: __('Banner', 'quillcrm'),
	icon: BannerBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
		src: '',
		alt: 'Banner',
		backgroundColor: '#f3f4f6',
		padding: {
			top: 20,
			right: 20,
			bottom: 20,
			left: 20,
		},
		link: '',
		borderRadius: '9999',
		shape: 'circle',
		rotation: 0,
	} as BannerBlockProps,
	Renderer: BannerRenderer,
	Editor: BannerEditor,
};

export default BannerBlock;
