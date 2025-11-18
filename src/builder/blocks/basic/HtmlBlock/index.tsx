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
	customCss: string;
	width: string;
	isProActivated: boolean;
	isPro: boolean;
	padding?: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
}

const HtmlBlock = {
	type: 'html' as const,
	name: __('HTML', 'quillcrm'),
	icon: HtmlBlockIcon,
	isProActivated: false,
	isPro: false,
	defaultProps: {
		content: '',
		customCss: '',
		width: '100',
		padding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
	} as HtmlBlockProps,
	Renderer: HtmlBlockRenderer,
	Editor: HtmlBlockEditor,
};

export default HtmlBlock;
