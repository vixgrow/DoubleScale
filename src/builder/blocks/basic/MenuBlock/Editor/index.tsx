/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState } from 'react';
/**
 * internal dependencies
 */
import { Checkbox } from '@/components/ui/checkbox';
import { AlignmentControl, PaddingControl } from '../../shared';
import { MenuBlockProps, MenuItem } from '..';
import { MenuList } from './MenuList';
import { SingleItemEditor } from './SingleItemEditor';
import { BulkEditor } from './BulkEditor';

export interface MenuBlockEditorProps {
	props: MenuBlockProps;
	onChange: (updates: Partial<MenuBlockProps>) => void;
}

export const MenuBlockEditor: React.FC<MenuBlockEditorProps> = ({
	props,
	onChange,
}) => {
	const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(
		null
	);
	const [editAllItems, setEditAllItems] = useState(false);

	const addMenuItem = () => {
		const newId = (props.menuItems.length + 1).toString();
		const newMenuItem: MenuItem = {
			id: newId,
			name: `Menu Item ${newId.padStart(2, '0')}`,
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
		};

		onChange({
			menuItems: [...props.menuItems, newMenuItem],
		});
		setSelectedMenuItem(newId);
	};

	const removeMenuItem = (id: string) => {
		const updatedItems = props.menuItems.filter((item) => item.id !== id);
		onChange({ menuItems: updatedItems });
		if (selectedMenuItem === id) {
			setSelectedMenuItem(
				updatedItems.length > 0 ? updatedItems[0].id : null
			);
		}
	};

	const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
		const updatedItems = props.menuItems.map((item) =>
			item.id === id ? { ...item, ...updates } : item
		);
		onChange({ menuItems: updatedItems });
	};

	const updateAllMenuItems = (updates: Partial<MenuItem>) => {
		const updatedItems = props.menuItems.map((item) => ({
			...item,
			...updates,
		}));
		onChange({ menuItems: updatedItems });
	};

	const selectedItem =
		props.menuItems.find((item) => item.id === selectedMenuItem) ||
		props.menuItems[0];

	return (
		<div className="grid gap-5">
			{/* Menu Items List */}
			<MenuList
				menuItems={props.menuItems}
				selectedMenuItem={selectedMenuItem}
				onAddMenuItem={addMenuItem}
				onRemoveMenuItem={removeMenuItem}
				onSelectMenuItem={setSelectedMenuItem}
			/>

			{/* Edit Mode Toggle */}
			<div className="flex items-center space-x-2">
				<Checkbox
					id="edit-all-items"
					checked={editAllItems}
					onCheckedChange={(checked) =>
						setEditAllItems(checked as boolean)
					}
				/>
				<label
					htmlFor="edit-all-items"
					className="text-sm font-medium text-[#333333] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					{__('Edit all items at once', 'quillcrm')}
				</label>
			</div>

			{/* Single Item Editor */}
			{selectedItem && !editAllItems && (
				<SingleItemEditor
					item={selectedItem}
					onUpdate={(updates) =>
						updateMenuItem(selectedItem.id, updates)
					}
				/>
			)}

			{/* Bulk Editor */}
			{editAllItems && (
				<BulkEditor item={selectedItem} onUpdate={updateAllMenuItems} />
			)}

			{/* Line Separator */}
			<div className="border-t border-gray-200"></div>

			{/* Alignment */}
			<AlignmentControl
				value={props.align as 'left' | 'center' | 'right' | 'full'}
				onChange={(value) => onChange({ align: value })}
			/>

			{/* Padding Controls - For whole menu section */}
			<PaddingControl
				value={props.padding}
				onChange={(value) => onChange({ padding: value })}
			/>
		</div>
	);
};
