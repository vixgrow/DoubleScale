/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { ExternalLink } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import type { PreheaderBlockProps } from '../index';
import {
	InputWithMergeTags,
	LinkInput,
	TextFormattingControl,
	AlignmentControl,
	FontControl,
	LetterSpacingControl,
	ColorPickerControl,
	PaddingControl,
	TextStyleControl,
} from '../../shared';

interface PreheaderEditorProps {
	props: PreheaderBlockProps;
	onChange: (newProps: Partial<PreheaderBlockProps>) => void;
}

export const PreheaderEditor: React.FC<PreheaderEditorProps> = ({
	props,
	onChange,
}) => {
	const {
		text,
		linkText,
		linkUrl,
		fontSize,
		textColor,
		linkColor,
		textAlign,
		fontFamily,
		bold,
		italic,
		underline,
		letterSpacing,
		headingStyle,
		padding,
	} = props;

	return (
		<div className="grid gap-5">
			{/* Text Content */}
			<InputWithMergeTags
				label={__('Text Content', 'quillcrm')}
				value={text}
				onChange={(text) => onChange({ text })}
				placeholder={__('Enter text content', 'quillcrm')}
				fieldName="text"
			/>

			{/* Link Content */}
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center text-[#333333]">
					<div>{__('Link Text', 'quillcrm')}</div>
					<ExternalLink className="size-5" />
				</div>
				<Input
					type="text"
					value={linkText}
					onChange={(e) => onChange({ linkText: e.target.value })}
					placeholder={__('Enter link text', 'quillcrm')}
					className="pr-8 h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
				/>
			</div>

			<LinkInput
				label={__('Link URL', 'quillcrm')}
				value={linkUrl}
				onChange={(linkUrl) => onChange({ linkUrl })}
				placeholder={__('https://example.com', 'quillcrm')}
			/>

			{/* Text Formatting */}
			<TextFormattingControl
				value={{ bold, italic, underline }}
				onChange={(updates) => onChange(updates)}
			/>

			{/* Text Alignment */}
			<AlignmentControl
				value={textAlign as 'left' | 'center' | 'right' | 'full'}
				onChange={(textAlign) => onChange({ textAlign })}
				label={__('Text Alignment', 'quillcrm')}
			/>

			{/* Text Style */}
			<TextStyleControl
				value={headingStyle}
				onChange={(headingStyle) => onChange({ headingStyle })}
			/>

			{/* Font and Size */}
			<FontControl
				fontFamily={fontFamily}
				fontSize={fontSize}
				onFontFamilyChange={(fontFamily) => onChange({ fontFamily })}
				onFontSizeChange={(fontSize) => onChange({ fontSize })}
			/>

			{/* Letter Spacing */}
			<LetterSpacingControl
				value={letterSpacing}
				onChange={(letterSpacing) => onChange({ letterSpacing })}
			/>

			{/* Text Color */}
			<ColorPickerControl
				value={textColor}
				onChange={(textColor) => onChange({ textColor })}
				label={__('Text Color', 'quillcrm')}
				id="text-color"
			/>

			{/* Link Color */}
			<ColorPickerControl
				value={linkColor}
				onChange={(linkColor) => onChange({ linkColor })}
				label={__('Link Color', 'quillcrm')}
				id="link-color"
			/>

			{/* Padding */}
			<PaddingControl
				value={{
					top: padding?.top || 0,
					right: padding?.right || 0,
					bottom: padding?.bottom || 0,
					left: padding?.left || 0,
				}}
				onChange={(padding) => onChange({ padding })}
			/>
		</div>
	);
};
