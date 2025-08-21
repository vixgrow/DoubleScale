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

export interface MenuItem {
	id: string;
	name: string;
	link: string;
	fontSize: number;
	color: string;
	fontFamily: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strikethrough: boolean;
	backgroundColor: string;
	borderRadius: string;
	letterSpacing: string;
}

export interface MenuBlockProps {
	menuItems: MenuItem[];
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	align: string;
}

const MenuBlock = {
	type: 'menu',
	name: __('Menu', 'quillcrm'),
	icon: MenuBlockIcon,
	defaultProps: {
		menuItems: [
			{
				id: '1',
				name: 'Menu Item 01',
				link: '#',
				fontSize: 16,
				color: '#333',
				fontFamily: 'Arial',
				bold: false,
				italic: false,
				underline: false,
				strikethrough: false,
				backgroundColor: 'transparent',
				borderRadius: '0',
				letterSpacing: '0px',
			},
			{
				id: '2',
				name: 'Menu Item 02',
				link: '#',
				fontSize: 16,
				color: '#333',
				fontFamily: 'Arial',
				bold: false,
				italic: false,
				underline: false,
				strikethrough: false,
				backgroundColor: 'transparent',
				borderRadius: '0',
				letterSpacing: '0px',
			},
		],
		padding: {
			top: 4,
			right: 8,
			bottom: 4,
			left: 8,
		},
		align: 'center',
	} as MenuBlockProps,
	Renderer: MenuBlockRenderer,
	Editor: MenuBlockEditor,
};

export default MenuBlock;
