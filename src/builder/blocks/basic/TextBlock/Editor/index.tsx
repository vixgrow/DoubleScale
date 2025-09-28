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
import { MergeTagsIcon } from '@quillcrm/components';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { TextBlockProps } from '..';
import { useDispatch } from '@wordpress/data';
import { RichTextEditor } from './RichTextEditor';
import {
	LinkInput,
	FontControl,
	TextFormattingControl,
	AlignmentControl,
	ColorPickerControl,
	PaddingControl,
	LetterSpacingControl,
	TextStyleControl,
} from '../../shared';

export interface TextEditorProps {
	props: TextBlockProps;
	onChange: (updates: Partial<TextBlockProps>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ props, onChange }) => {
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('quillcrm/core');

	const handleMergeTagClick = () => {
		// Set the callback to insert the merge tag into the content field
		setMergeTagCallback((tagValue: string) => {
			onChange({ content: props.content + tagValue });
		});
		setMergeTagsVisible(true);
	};

	return (
		<div className="grid gap-5">
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center text-[#333333]">
					<div>{__('Text Content', 'quillcrm')}</div>
					<div
						className="cursor-pointer hover:opacity-80"
						onClick={handleMergeTagClick}
					>
						<MergeTagsIcon />
					</div>
				</div>
				<RichTextEditor
					content={props.content}
					onChange={(content) => onChange({ content })}
				/>
			</div>

			<LinkInput
				label={__('Link URL', 'quillcrm')}
				value={props.hyperlink}
				onChange={(hyperlink) => onChange({ hyperlink })}
				placeholder="https://example.com"
			/>

			<TextFormattingControl
				value={{
					bold: props.bold,
					italic: props.italic,
					underline: props.underline,
					strikethrough: props['line-through'],
				}}
				onChange={(updates) => {
					const newProps: Partial<TextBlockProps> = {};
					if ('bold' in updates) newProps.bold = updates.bold;
					if ('italic' in updates) newProps.italic = updates.italic;
					if ('underline' in updates)
						newProps.underline = updates.underline;
					if ('strikethrough' in updates)
						newProps['line-through'] = updates.strikethrough;

					// Clear HTML formatting from content when using TextFormattingControl
					// This ensures props-based formatting takes precedence
					let cleanContent = props.content;
					if (cleanContent && cleanContent.includes('<')) {
						// Remove formatting tags but preserve the text content
						cleanContent = cleanContent
							.replace(/<\/?(b|strong)>/gi, '')
							.replace(/<\/?(i|em)>/gi, '')
							.replace(/<\/?(u)>/gi, '')
							.replace(/<\/?(s|strike|del)>/gi, '')
							.replace(/style\s*=\s*"[^"]*font-weight[^"]*"/gi, '')
							.replace(/style\s*=\s*"[^"]*font-style[^"]*"/gi, '')
							.replace(/style\s*=\s*"[^"]*text-decoration[^"]*"/gi, '')
							.replace(/style\s*=\s*'[^']*font-weight[^']*'/gi, '')
							.replace(/style\s*=\s*'[^']*font-style[^']*'/gi, '')
							.replace(/style\s*=\s*'[^']*text-decoration[^']*'/gi, '')
							.replace(/style\s*=\s*""\s*/gi, '')
							.replace(/style\s*=\s*''\s*/gi, '')
							.replace(/\s*style\s*=\s*""/gi, '')
							.replace(/\s*style\s*=\s*''/gi, '');

						newProps.content = cleanContent;
					}

					onChange(newProps);
				}}
			/>

			<AlignmentControl
				value={props.textAlign as 'left' | 'center' | 'right' | 'full'}
				onChange={(value) => onChange({ textAlign: value })}
				label={__('Text Alignment', 'quillcrm')}
				includeFull={true}
			/>

			<TextStyleControl
				value={props.headingStyle}
				onChange={(headingStyle) => onChange({ headingStyle })}
			/>

			<FontControl
				fontFamily={props.fontFamily}
				fontSize={props.fontSize}
				onFontFamilyChange={(fontFamily) => onChange({ fontFamily })}
				onFontSizeChange={(fontSize) => onChange({ fontSize })}
			/>
			<div className="flex gap-3 items-center w-full">
				<div className="flex flex-col gap-2 text-[#333333] w-1/2">
					<div>{__('Line Height', 'quillcrm')}</div>
					<Select
						value={props.lineHeight}
						onValueChange={(value) =>
							onChange({ lineHeight: value })
						}
					>
						<SelectTrigger className="w-full rounded-lg border-border h-10">
							<SelectValue
								placeholder={__(
									'Select line height',
									'quillcrm'
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1">Single</SelectItem>
							<SelectItem value="1.15">1.15</SelectItem>
							<SelectItem value="1.25">1.25</SelectItem>
							<SelectItem value="1.5">1.5</SelectItem>
							<SelectItem value="2">Double</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<LetterSpacingControl
					value={props.letterSpacing}
					onChange={(letterSpacing) => onChange({ letterSpacing })}
					className="w-1/2"
				/>
			</div>

			<ColorPickerControl
				value={props.color}
				onChange={(color) => onChange({ color })}
				label={__('Text Color', 'quillcrm')}
				id="text-color"
			/>

			<ColorPickerControl
				value={props.backgroundColor}
				onChange={(backgroundColor) => onChange({ backgroundColor })}
				label={__('Background Color', 'quillcrm')}
				id="bg-color"
			/>

			<ColorPickerControl
				value={props.linkColor}
				onChange={(linkColor) => onChange({ linkColor })}
				label={__('Link Color', 'quillcrm')}
				id="link-color"
			/>
			<PaddingControl
				value={{
					top: props.padding?.top || 0,
					right: props.padding?.right || 0,
					bottom: props.padding?.bottom || 0,
					left: props.padding?.left || 0,
				}}
				onChange={(padding) => onChange({ padding })}
			/>
		</div>
	);
};
