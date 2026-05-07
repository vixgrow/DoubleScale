/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { UnknownBlockIcon } from '@doublescale/components';
import { UnknownRenderer } from './Renderer';
import { UnknownEditor } from './Editor';

export interface UnknownBlockProps {
	originalType: string;
	originalProps: Record<string, any>;
}

const UnknownBlock = {
	type: 'unknown',
	name: __('Unknown Block', 'doublescale'),
	icon: UnknownBlockIcon,
	defaultProps: {
		originalType: '',
		originalProps: {},
	} as UnknownBlockProps,
	Renderer: UnknownRenderer,
	Editor: UnknownEditor,
};

export default UnknownBlock;
