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
	videoUrl: string;
	imageUrl: string;
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
	borderRadius: string;
	shape: string;
}

const VideoBlock = {
	type: 'video',
	name: __('Video', 'quillcrm'),
	icon: VideoBlockIcon,
	defaultProps: {
		videoUrl: '',
		imageUrl: '',
		alt: 'Video',
		width: '100%',
		height: 'auto',
		align: 'center',
		backgroundColor: '#000000',
		padding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
		borderRadius: '0',
		shape: 'rectangle',
	} as VideoBlockProps,
	Renderer: VideoBlockRenderer,
	Editor: VideoBlockEditor,
};

export default VideoBlock;
