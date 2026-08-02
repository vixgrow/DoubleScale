/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { Type } from 'lucide-react';
/**
 * internal dependencies
 */
import { RichTextEditor } from '@/components/rich-text-editor';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { TextBlockProps } from '..';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as TypographyControls from '../../shared/control-groups/typography';
import * as StyleControls from '../../shared/control-groups/style';
import * as LayoutControls from '../../shared/control-groups/layout';
import { getDefaultFontSizeForStyle } from '@/builder/utils/styleHelpers';

export interface TextEditorProps {
	props: TextBlockProps;
	onChange: (updates: Partial<TextBlockProps>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ props, onChange }) => {
	const handleDirectionChange = (textDirection: 'ltr' | 'rtl') => {
		const updates: Partial<TextBlockProps> = { textDirection };
		if (textDirection === 'rtl' && props.textAlign === 'left') {
			updates.textAlign = 'right';
		} else if (textDirection === 'ltr' && props.textAlign === 'right') {
			updates.textAlign = 'left';
		}
		onChange(updates);
	};

	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						<div>
							<RichTextEditor
								theme="builderDark"
								formattingTarget="canvas"
								content={props.content ?? ''}
								onChange={(content) => onChange({ content })}
								fontSize={props.fontSize}
								fontFamily={props.fontFamily}
								defaultBodyColor={props.color?.trim() || '#333'}
								defaultLinkColor={
									props.linkColor?.trim() || '#458DC7'
								}
							/>
						</div>

						{/* Typography Controls */}
						<TypographyControls.TextStyleControl
							value={props.headingStyle}
							onChange={(headingStyle) =>
								onChange({
									headingStyle,
									fontSize: getDefaultFontSizeForStyle(
										headingStyle
									),
								})
							}
						/>

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

						{/* Font Color */}
						<StyleControls.ColorPickerControl
							value={props.color?.trim() || '#333'}
							onChange={(color) => onChange({ color })}
							label={__('Font Color', 'doublescale')}
							id="font-color"
						/>

						{/* Line Height & Letter Spacing */}
						<div className="flex gap-3 items-center w-full">
							<div className="flex flex-col gap-2 text-white w-1/2">
								<label className="text-sm">{__('Line Height', 'doublescale')}</label>
								<Select
									value={props.lineHeight}
									onValueChange={(value) =>
										onChange({ lineHeight: value })
									}
								>
									<SelectTrigger className="w-full rounded-lg !text-white !border-none !ring-0 !ring-offset-0 h-10 "
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
									>
										<SelectValue
											placeholder={__(
												'Select line height',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">
											Single
										</SelectItem>
										<SelectItem value="1.15">
											1.15
										</SelectItem>
										<SelectItem value="1.25">
											1.25
										</SelectItem>
										<SelectItem value="1.5">1.5</SelectItem>
										<SelectItem value="2">
											Double
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<TypographyControls.LetterSpacingControl
								value={props.letterSpacing}
								onChange={(letterSpacing) =>
									onChange({ letterSpacing })
								}
								className="w-1/2"
							/>
						</div>

						<StyleControls.ColorPickerControl
							value={props.backgroundColor}
							onChange={(backgroundColor) =>
								onChange({ backgroundColor })
							}
							label={__('Background Color', 'doublescale')}
							id="bg-color"
						/>

						<LayoutControls.AlignmentControl
							value={
								(props.textAlign as
									| 'left'
									| 'center'
									| 'right') || 'left'
							}
							onChange={(textAlign) => onChange({ textAlign })}
							label={__('Text alignment', 'doublescale')}
						/>

						<div className="flex flex-col gap-2 text-white">
							<label className="text-sm">
								{__('Text direction', 'doublescale')}
							</label>
							<div
								className="flex h-10 items-center justify-between rounded-lg"
								style={{
									backgroundColor: 'rgba(255, 255, 255, 0.05)',
								}}
							>
								<button
									type="button"
									className={`flex-1 h-full rounded-lg text-sm transition-colors ${
										(props.textDirection || 'ltr') === 'ltr'
											? 'border border-white text-white'
											: 'text-white/70 hover:bg-white/10'
									}`}
									onClick={() => handleDirectionChange('ltr')}
								>
									{__('LTR', 'doublescale')}
								</button>
								<button
									type="button"
									className={`flex-1 h-full rounded-lg text-sm transition-colors ${
										props.textDirection === 'rtl'
											? 'border border-white text-white'
											: 'text-white/70 hover:bg-white/10'
									}`}
									onClick={() => handleDirectionChange('rtl')}
								>
									{__('RTL (Arabic)', 'doublescale')}
								</button>
							</div>
						</div>

						{/* Layout Controls - Padding */}
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
