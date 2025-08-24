/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
	PaddingBottomIcon,
	PaddingLeftIcon,
	PaddingRightIcon,
	PaddingTopIcon,
} from '@quillcrm/components';
import { cn } from '@/lib/utils';
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
			<div className="flex flex-col gap-2 text-[#333333]">
				<label className="text-sm">
					{__('Alignment on desktop', 'quillcrm')}
				</label>
				<div className="flex items-center justify-between border rounded-lg">
					<AlignLeft
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.align === 'left' &&
								'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() => onChange({ align: 'left' })}
					/>
					<AlignCenter
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.align === 'center' &&
								'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ align: 'center' })}
					/>
					<AlignRight
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.align === 'right' &&
								'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ align: 'right' })}
					/>
				</div>
			</div>

			{/* Padding Controls - For whole menu section */}
			<div>
				<label className="text-sm text-[#333333] mb-2 block">
					{__('Padding', 'quillcrm')}
				</label>
				<div className="flex gap-2">
					<div className="relative flex items-center">
						<div className="absolute left-2 text-[#333333]">
							<PaddingLeftIcon />
						</div>
						<Input
							type="number"
							value={props.padding?.left || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...props.padding,
										left: parseInt(e.target.value) || 0,
									},
								})
							}
							className="h-10"
							style={{
								borderColor: '#e5e5e5',
								borderRadius: '0.5rem',
								paddingLeft: '32px',
							}}
						/>
					</div>
					<div className="relative flex items-center">
						<div className="absolute left-2 text-[#333333]">
							<PaddingRightIcon />
						</div>
						<Input
							type="number"
							value={props.padding?.right || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...props.padding,
										right: parseInt(e.target.value) || 0,
									},
								})
							}
							className="h-10"
							style={{
								borderColor: '#e5e5e5',
								borderRadius: '0.5rem',
								paddingLeft: '32px',
							}}
						/>
					</div>
					<div className="relative flex items-center">
						<div className="absolute left-2 text-[#333333]">
							<PaddingTopIcon />
						</div>
						<Input
							type="number"
							value={props.padding?.top || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...props.padding,
										top: parseInt(e.target.value) || 0,
									},
								})
							}
							className="h-10"
							style={{
								borderColor: '#e5e5e5',
								borderRadius: '0.5rem',
								paddingLeft: '32px',
							}}
						/>
					</div>
					<div className="relative flex items-center">
						<div className="absolute left-2 text-[#333333]">
							<PaddingBottomIcon />
						</div>
						<Input
							type="number"
							value={props.padding?.bottom || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...props.padding,
										bottom: parseInt(e.target.value) || 0,
									},
								})
							}
							className="h-10"
							style={{
								borderColor: '#e5e5e5',
								borderRadius: '0.5rem',
								paddingLeft: '32px',
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
