/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { MenuItem } from '../..';
import {
	ColorPickerControl,
	ShapeSelectorControl,
	FontControl,
	LetterSpacingControl,
	TextFormattingControl,
	LinkInput,
} from '../../../shared';

interface SingleItemEditorProps {
	item: MenuItem;
	onUpdate: (updates: Partial<MenuItem>) => void;
}

export const SingleItemEditor: React.FC<SingleItemEditorProps> = ({
	item,
	onUpdate,
}) => {
	return (
		<div className="border-t pt-5">
			<h3 className="text-[#333333] text-sm font-semibold mb-4">
				{__('Edit Menu Item', 'quillcrm')} - {item.name}
			</h3>

			<div className="space-y-4">
				{/* Name and Link */}
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Name', 'quillcrm')}
					</label>
					<Input
						type="text"
						value={item.name}
						onChange={(e) => onUpdate({ name: e.target.value })}
						className="h-10"
						style={{
							borderColor: '#e5e5e5',
							borderRadius: '0.5rem',
						}}
						placeholder="Menu item name"
					/>
				</div>
				<LinkInput
					label={__('Link', 'quillcrm')}
					value={item.link}
					onChange={(link) => onUpdate({ link })}
					placeholder="https://example.com"
				/>

				{/* Font and Size */}
				<FontControl
					fontFamily={item.fontFamily}
					fontSize={item.fontSize}
					onFontFamilyChange={(fontFamily) =>
						onUpdate({ fontFamily })
					}
					onFontSizeChange={(fontSize) => onUpdate({ fontSize })}
				/>

				{/* Letter Spacing */}
				<LetterSpacingControl
					value={item.letterSpacing}
					onChange={(letterSpacing) => onUpdate({ letterSpacing })}
				/>

				{/* Text Formatting */}
				<TextFormattingControl
					value={{
						bold: item.bold,
						italic: item.italic,
						underline: item.underline,
						strikethrough: item.strikethrough,
					}}
					onChange={(updates) => onUpdate(updates)}
				/>

				{/* Color and Background */}
				<ColorPickerControl
					value={item.color}
					onChange={(color) => onUpdate({ color })}
					label={__('Text Color', 'quillcrm')}
					id="text-color"
				/>
				<ColorPickerControl
					value={item.backgroundColor}
					onChange={(backgroundColor) =>
						onUpdate({ backgroundColor })
					}
					label={__('Background Color', 'quillcrm')}
					id="bg-color"
				/>

				{/* Shape and Border Radius */}
				<ShapeSelectorControl
					value={item.borderRadius}
					onChange={(borderRadius) => onUpdate({ borderRadius })}
				/>
			</div>
		</div>
	);
};
