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
import {
	FontControl,
	LetterSpacingControl,
	TextFormattingControl,
	ColorPickerControl,
	ShapeSelectorControl,
} from '../../../shared';
import { MenuItem } from '../..';

interface BulkEditorProps {
	item: MenuItem;
	onUpdate: (updates: Partial<MenuItem>) => void;
}

export const BulkEditor: React.FC<BulkEditorProps> = ({ item, onUpdate }) => {
	return (
		<div className="border-t pt-5">
			<h3 className="text-[#333333] text-sm font-semibold mb-4">
				{__('Edit All Menu Items', 'quillcrm')}
			</h3>

			<div className="space-y-4">
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
					onChange={(value) => onUpdate({ letterSpacing: value })}
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
					onChange={(value) => onUpdate({ color: value })}
					label={__('Text Color', 'quillcrm')}
				/>
				<ColorPickerControl
					value={item.backgroundColor}
					onChange={(value) => onUpdate({ backgroundColor: value })}
					label={__('Background Color', 'quillcrm')}
				/>

				{/* Shape and Border Radius */}
				<ShapeSelectorControl
					value={item.borderRadius}
					onChange={(value) => onUpdate({ borderRadius: value })}
				/>
			</div>
		</div>
	);
};
