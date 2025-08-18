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
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	align: string;
	buttonStyle: 'primary' | 'secondary' | 'tertiary';
}

const ButtonBlock = {
	type: 'button' as const,
	name: __('Button', 'quillcrm'),
	icon: ButtonBlockIcon,
	defaultProps: {
		text: 'Click Here',
		url: '#',
		backgroundColor: '#007cba',
		padding: {
			top: 12,
			right: 24,
			bottom: 12,
			left: 24,
		},
		align: 'center',
		buttonStyle: 'primary',
	} as ButtonBlockProps,
	Renderer: ButtonRenderer,
	Editor: ButtonEditor,
};

export default ButtonBlock;
