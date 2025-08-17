/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { TextBlockIcon } from '@quillcrm/components';
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
	letterSpacing: string;
	borderRadius: string;
	borderWidth: string;
	borderColor: string;
	backgroundColor: string;
}

export const TextBlock = {
	type: 'text',
	name: __('Text', 'quillcrm'),
	icon: TextBlockIcon,
	defaultProps: {
		content: 'Your text here',
		hyperlink: 'https;//',
		fontSize: 16,
		color: '#333',
		align: 'center',
		fontFamily: 'Arial',
		bold: false,
		italic: false,
		underline: false,
		letterSpacing: '0px',
		borderRadius: '0px',
		borderWidth: '0px',
		borderColor: '#333',
		backgroundColor: '#fff',
	} as TextBlockProps,
	Renderer: TextRenderer,
	Editor: TextEditor,
};