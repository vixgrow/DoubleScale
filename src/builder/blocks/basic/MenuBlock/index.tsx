/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { MenuBlockIcon } from '@quillcrm/components';
import { MenuBlockRenderer } from './Renderer';
import { MenuBlockEditor } from './Editor';

export interface MenuBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
}

const MenuBlock = {
	type: 'menu',
	name: __('Menu', 'quillcrm'),
	icon: MenuBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as MenuBlockProps,
	Renderer: MenuBlockRenderer,
	Editor: MenuBlockEditor,
};

export default MenuBlock;
