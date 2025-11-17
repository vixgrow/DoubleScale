/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { UnknownBlockIcon } from '@quillcrm/components';
import { UnknownRenderer } from './Renderer';
import { UnknownEditor } from './Editor';

export interface UnknownBlockProps {
	originalType: string;
	originalProps: Record<string, any>;
}

const UnknownBlock = {
	type: 'unknown',
	name: __('Unknown Block', 'quillcrm'),
	icon: UnknownBlockIcon,
	defaultProps: {
		originalType: '',
		originalProps: {},
	} as UnknownBlockProps,
	Renderer: UnknownRenderer,
	Editor: UnknownEditor,
};

export default UnknownBlock;
