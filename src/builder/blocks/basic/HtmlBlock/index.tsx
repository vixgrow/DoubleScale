/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { HtmlBlockIcon } from '@quillcrm/components';
import { HtmlBlockRenderer } from './Renderer';
import { HtmlBlockEditor } from './Editor';

export interface HtmlBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
}

const HtmlBlock = {
	type: 'html' as const,
	name: __('HTML', 'quillcrm'),
	icon: HtmlBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as HtmlBlockProps,
	Renderer: HtmlBlockRenderer,
	Editor: HtmlBlockEditor,
};

export default HtmlBlock;
