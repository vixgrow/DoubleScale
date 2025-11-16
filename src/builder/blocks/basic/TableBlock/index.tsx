/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { TableBlockIcon } from '@quillcrm/components';
import { TableBlockRenderer } from './Renderer';
import { TableBlockEditor } from './Editor';

export interface TableBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
	isProActivated: boolean;
	isPro: boolean;
}

const TableBlock = {
	type: 'table',
	name: __('Table', 'quillcrm'),
	icon: TableBlockIcon,
	isProActivated: false,
	isPro: false,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as TableBlockProps,
	Renderer: TableBlockRenderer,
	Editor: TableBlockEditor,
};

export default TableBlock;
