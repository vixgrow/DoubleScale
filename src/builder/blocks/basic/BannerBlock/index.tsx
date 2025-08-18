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
}

export const BannerBlock = {
	type: 'banner' as const,
	name: __('Banner', 'quillcrm'),
	icon: BannerBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as BannerBlockProps,
	Renderer: BannerRenderer,
	Editor: BannerEditor,
};
