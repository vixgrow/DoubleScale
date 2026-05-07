/**
 * Preheader Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better type safety and organization
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Input } from '@/components/ui/input';
import type { PreheaderBlockProps } from '../index';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as TypographyControls from '../../shared/control-groups/typography';
import * as StyleControls from '../../shared/control-groups/style';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as MediaControls from '../../shared/control-groups/media';

interface PreheaderEditorProps {
	props: PreheaderBlockProps;
	onChange: (newProps: Partial<PreheaderBlockProps>) => void;
}

export const PreheaderEditor: React.FC<PreheaderEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* Text Content */}
						<MediaControls.InputWithMergeTags
							label={__('Text Content', 'doublescale')}
							value={props.text}
							onChange={(text) => onChange({ text })}
							placeholder={__('Enter text content', 'doublescale')}
							fieldName="text"
						/>

						{/* Link Content */}
						<div className="flex flex-col gap-2">
							<div className="flex justify-between items-center text-[#333333]">
								<div>{__('Link Text', 'doublescale')}</div>
								<ExternalLink className="size-5" />
							</div>
							<Input
								type="text"
								value={props.linkText}
								onChange={(e) =>
									onChange({ linkText: e.target.value })
								}
								placeholder={__('Enter link text', 'doublescale')}
								className="pr-8 h-10"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
								}}
							/>
						</div>

						<MediaControls.LinkInput
							label={__('Link URL', 'doublescale')}
							value={props.linkUrl}
							onChange={(linkUrl) => onChange({ linkUrl })}
							placeholder={__('https://example.com', 'doublescale')}
						/>

						{/* Text Formatting */}
						<TypographyControls.TextFormattingControl
							value={{
								bold: props.bold,
								italic: props.italic,
								underline: props.underline,
							}}
							onChange={(updates) => onChange(updates)}
						/>

						{/* Text Alignment */}
						<LayoutControls.AlignmentControl
							value={
								props.textAlign as
									| 'left'
									| 'center'
									| 'right'
									| 'full'
							}
							onChange={(textAlign) => onChange({ textAlign })}
							label={__('Text Alignment', 'doublescale')}
						/>

						{/* Text Style */}
						<TypographyControls.TextStyleControl
							value={props.headingStyle}
							onChange={(headingStyle) =>
								onChange({ headingStyle })
							}
						/>

						{/* Font and Size */}
						<TypographyControls.FontControl
							fontFamily={props.fontFamily}
							fontSize={props.fontSize}
							onFontFamilyChange={(fontFamily) =>
								onChange({ fontFamily })
							}
							onFontSizeChange={(fontSize) =>
								onChange({ fontSize })
							}
						/>

						{/* Letter Spacing */}
						<TypographyControls.LetterSpacingControl
							value={props.letterSpacing}
							onChange={(letterSpacing) =>
								onChange({ letterSpacing })
							}
						/>

						{/* Text Color */}
						<StyleControls.ColorPickerControl
							value={props.textColor}
							onChange={(textColor) => onChange({ textColor })}
							label={__('Text Color', 'doublescale')}
							id="text-color"
						/>

						{/* Link Color */}
						<StyleControls.ColorPickerControl
							value={props.linkColor}
							onChange={(linkColor) => onChange({ linkColor })}
							label={__('Link Color', 'doublescale')}
							id="link-color"
						/>

						{/* Padding */}
						<LayoutControls.PaddingControl
							value={{
								top: props.padding?.top || 0,
								right: props.padding?.right || 0,
								bottom: props.padding?.bottom || 0,
								left: props.padding?.left || 0,
							}}
							onChange={(padding) => onChange({ padding })}
						/>
					</>
				)}
			</BaseBlockEditor>
		</BlockEditorErrorBoundary>
	);
};
