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

export interface TextEditorProps {
	props: TextBlockProps;
	onChange: (updates: Partial<TextBlockProps>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ props, onChange }) => {
	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						<div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
							<div className="flex items-center gap-2 text-white">
								<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08]">
									<Type className="h-4 w-4" aria-hidden />
								</span>
								<span className="text-base font-medium">
									{__('Text Settings', 'doublescale')}
								</span>
							</div>

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

							<p className="text-sm text-white/65">
								{__(
									'Use the toolbar for formatting, text color, and links. Use the sparkles icon in the block toolbar for AI-generated text.',
									'doublescale'
								)}
							</p>
						</div>

						{/* Typography Controls */}
						<TypographyControls.TextStyleControl
							value={props.headingStyle}
							onChange={(headingStyle) =>
								onChange({ headingStyle })
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
