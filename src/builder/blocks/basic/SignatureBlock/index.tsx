/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { SignatureBlockIcon } from '@quillcrm/components';
import { SignatureBlockRenderer } from './Renderer';
import { SignatureBlockEditor } from './Editor';

export interface SignatureBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
}

export const SignatureBlock = {
	type: 'signature',
	name: __('Signature', 'quillcrm'),
	icon: SignatureBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as SignatureBlockProps,
	Renderer: SignatureBlockRenderer,
	Editor: SignatureBlockEditor,
};