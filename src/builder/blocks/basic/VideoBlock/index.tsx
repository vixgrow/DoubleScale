/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { VideoBlockIcon } from '@quillcrm/components';
import { VideoBlockRenderer } from './Renderer';
import { VideoBlockEditor } from './Editor';

export interface VideoBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
}

export const VideoBlock = {
	type: 'video',
	name: __('Video', 'quillcrm'),
	icon: VideoBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as VideoBlockProps,
	Renderer: VideoBlockRenderer,
	Editor: VideoBlockEditor,
};
