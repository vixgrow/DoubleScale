/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { DividerBlockIcon } from '@quillcrm/components';
import { DividerRenderer } from './Renderer';
import { DividerEditor } from './Editor';

export interface DividerBlockProps {
	height: string;
	color: string;
	style: string;
	margin: string;
}

export const DividerBlock = {
	type: 'divider' as const,
	name: __('Divider', 'quillcrm'),
	icon: DividerBlockIcon,
	defaultProps: {
		height: '1px',
		color: '#cccccc',
		style: 'solid',
		margin: '20px 0',
	} as DividerBlockProps,
	Renderer: DividerRenderer,
	Editor: DividerEditor,
};
