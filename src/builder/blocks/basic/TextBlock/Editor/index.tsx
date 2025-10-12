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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { TextBlockProps } from '..';
import TinyMCEWPEditor from '@/components/editor';
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
						{/* Text Content */}
						<div className="flex flex-col gap-2">
							<div className="text-[#333333] text-sm mb-1">
								{__('Text Content', 'quillcrm')}
							</div>
							<TinyMCEWPEditor
								value={props.content}
								onChange={(content) => onChange({ content })}
								height={250}
								toolbar="bold italic underline | alignleft aligncenter alignright | bullist numlist | link | removeformat"
								plugins="lists link"
								showMergeTags={false}
							/>
						</div>

						{/* Layout Controls */}
						<LayoutControls.AlignmentControl
							value={
								props.textAlign as
									| 'left'
									| 'center'
									| 'right'
									| 'full'
							}
							onChange={(value) => onChange({ textAlign: value })}
							label={__('Text Alignment', 'quillcrm')}
							includeFull={true}
						/>

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

						{/* Style Controls - Colors */}
						<StyleControls.ColorPickerControl
							value={props.color}
							onChange={(color) => onChange({ color })}
							label={__('Text Color', 'quillcrm')}
							id="text-color"
						/>

						<StyleControls.ColorPickerControl
							value={props.backgroundColor}
							onChange={(backgroundColor) =>
								onChange({ backgroundColor })
							}
							label={__('Background Color', 'quillcrm')}
							id="bg-color"
						/>

						<StyleControls.ColorPickerControl
							value={props.linkColor}
							onChange={(linkColor) => onChange({ linkColor })}
							label={__('Link Color', 'quillcrm')}
							id="link-color"
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
