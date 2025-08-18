/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { ButtonBlockIcon } from '@quillcrm/components';
import { ButtonRenderer } from './Renderer';
import { ButtonEditor } from './Editor';

export interface ButtonBlockProps {
	text: string;
	url: string;
	backgroundColor: string;
	textColor: string;
	borderRadius: string;
	padding: string;
	align: string;
}

const ButtonBlock = {
	type: 'button' as const,
	name: __('Button', 'quillcrm'),
	icon: ButtonBlockIcon,
	defaultProps: {
		text: 'Click Here',
		url: '#',
		backgroundColor: '#007cba',
		textColor: '#ffffff',
		borderRadius: '4px',
		padding: '12px 24px',
		align: 'center',
	} as ButtonBlockProps,
	Renderer: ButtonRenderer,
	Editor: ButtonEditor,
};

export default ButtonBlock;
