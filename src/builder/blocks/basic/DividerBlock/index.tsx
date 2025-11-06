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
	backgroundColor: string;
	style: string;
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	align: 'left' | 'center' | 'right' | 'full';
	width: string;
	borderRadius: string;
	opacity: number;
}

const DividerBlock = {
	type: 'divider' as const,
	name: __('Divider', 'quillcrm'),
	icon: DividerBlockIcon,
	defaultProps: {
		height: '1',
		color: '#cccccc',
		backgroundColor: 'transparent',
		style: 'solid',
		padding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
		align: 'center',
		width: '100',
		borderRadius: '0',
		opacity: 1,
	} as DividerBlockProps,
	Renderer: DividerRenderer,
	Editor: DividerEditor,
};

export default DividerBlock;
