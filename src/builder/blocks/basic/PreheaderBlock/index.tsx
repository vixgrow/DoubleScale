/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { PreheaderBlockIcon } from '@doublescale/components';
import { PreheaderRenderer } from './Renderer';
import { PreheaderEditor } from './Editor';

export interface PreheaderBlockProps {
	text: string;
	linkText: string;
	linkUrl: string;
	fontSize: number;
	textColor: string;
	linkColor: string;
	textAlign: string;
	fontFamily: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	letterSpacing: string;
	headingStyle: string;
	padding?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
}

const PreheaderBlock: {
	type: string;
	name: string;
	icon: any;
	isPro: boolean;
	isProActivated: boolean;
	defaultProps: PreheaderBlockProps;
	Renderer: React.ComponentType<{ props: PreheaderBlockProps }>;
	Editor: React.ComponentType<{
		props: PreheaderBlockProps;
		onChange: (newProps: Partial<PreheaderBlockProps>) => void;
	}>;
} = {
	type: 'preheader',
	name: __('Preheader', 'doublescale'),
	icon: PreheaderBlockIcon,
	isProActivated: false,
	isPro: false,
	defaultProps: {
		text: 'If you cannot see images, Please',
		linkText: 'Click here',
		linkUrl: 'https://',
		fontSize: 12,
		textColor: '#9197A4',
		linkColor: '#3B82F6',
		textAlign: 'left',
		fontFamily: 'Arial',
		bold: false,
		italic: false,
		underline: true,
		letterSpacing: '0px',
		headingStyle: 'p',
		padding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
	},
	Renderer: PreheaderRenderer,
	Editor: PreheaderEditor,
};

export default PreheaderBlock;
