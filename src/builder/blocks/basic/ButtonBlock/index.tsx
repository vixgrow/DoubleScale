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
	containerPadding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	isProActivated: boolean;
	isPro: boolean;
	containerBackgroundColor: string;
	align: string;
	buttonStyle: 'primary' | 'secondary' | 'tertiary';
}

const ButtonBlock = {
	type: 'button' as const,
	name: __('Button', 'quillcrm'),
	icon: ButtonBlockIcon,
	isProActivated: false,
	isPro: false,
	defaultProps: {
		text: 'Click Here',
		url: '#',
		containerPadding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
		containerBackgroundColor: 'transparent',
		align: 'center',
		buttonStyle: 'primary',
	} as ButtonBlockProps,
	Renderer: ButtonRenderer,
	Editor: ButtonEditor,
};

export default ButtonBlock;
