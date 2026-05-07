/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { TextBlockIcon } from '@doublescale/components';
import { TextRenderer } from './Renderer';
import { TextEditor } from './Editor';

export interface TextBlockProps {
	content: string;
	hyperlink: string;
	fontSize: number;
	color: string;
	align: string;
	fontFamily: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	'line-through': boolean;
	lineHeight: string;
	letterSpacing: string;
	borderRadius: string;
	borderWidth: string;
	linkColor: string;
	backgroundColor: string;
	textAlign: string;
	listType: string;
	headingStyle: string;
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	isProActivated: boolean;
	isPro: boolean;
}

const TextBlock = {
	type: 'text',
	name: __('Text', 'doublescale'),
	icon: TextBlockIcon,
	isProActivated: false,
	isPro: false,
	defaultProps: {
		content: '<p>Your text here</p>',
		hyperlink: 'https://',
		fontSize: 16,
		color: '#333',
		align: 'center',
		fontFamily: 'Arial',
		bold: false,
		italic: false,
		underline: false,
		'line-through': false,
		lineHeight: '1.5',
		letterSpacing: '0px',
		borderRadius: '0px',
		borderWidth: '0px',
		linkColor: '#333',
		backgroundColor: 'transparent',
		textAlign: 'left',
		listType: 'none',
		headingStyle: 'p',
		padding: {
			top: 4,
			right: 8,
			bottom: 4,
			left: 8,
		},
	} as TextBlockProps,
	Renderer: TextRenderer,
	Editor: TextEditor,
};

export default TextBlock;
