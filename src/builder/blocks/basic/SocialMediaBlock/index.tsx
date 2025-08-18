/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { SocialMediaBlockIcon } from '@quillcrm/components';
import { SocialMediaBlockRenderer } from './Renderer';
import { SocialMediaBlockEditor } from './Editor';

export interface SocialMediaBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
}

export const SocialMediaBlock = {
	type: 'social_media',
	name: __('Social Media', 'quillcrm'),
	icon: SocialMediaBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as SocialMediaBlockProps,
	Renderer: SocialMediaBlockRenderer,
	Editor: SocialMediaBlockEditor,
};