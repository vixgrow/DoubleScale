/**
 * Divider Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better organization
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DividerBlockProps } from '..';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as StyleControls from '../../shared/control-groups/style';

export interface DividerEditorProps {
	props: DividerBlockProps;
	onChange: (updates: Partial<DividerBlockProps>) => void;
}

export const DividerEditor: React.FC<DividerEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* Height and Width */}
						<LayoutControls.WidthHeightControl
							width={props.width}
							height={props.height}
							onWidthChange={(width) => onChange({ width })}
							onHeightChange={(height) => onChange({ height })}
							widthUnit="%"
							heightUnit="px"
							widthPlaceholder="100"
							heightPlaceholder="1"
						/>

						{/* Style */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<div>{__('Style', 'quillcrm')}</div>
							<Select
								value={props.style}
								onValueChange={(value) =>
									onChange({ style: value })
								}
							>
								<SelectTrigger className="w-full rounded-lg border-border h-10">
									<SelectValue
										placeholder={__(
											'Select style',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="solid">
										{__('Solid', 'quillcrm')}
									</SelectItem>
									<SelectItem value="dashed">
										{__('Dashed', 'quillcrm')}
									</SelectItem>
									<SelectItem value="dotted">
										{__('Dotted', 'quillcrm')}
									</SelectItem>
									<SelectItem value="double">
										{__('Double', 'quillcrm')}
									</SelectItem>
									<SelectItem value="groove">
										{__('Groove', 'quillcrm')}
									</SelectItem>
									<SelectItem value="ridge">
										{__('Ridge', 'quillcrm')}
									</SelectItem>
									<SelectItem value="inset">
										{__('Inset', 'quillcrm')}
									</SelectItem>
									<SelectItem value="outset">
										{__('Outset', 'quillcrm')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Shape and Border Radius */}
						<StyleControls.ShapeSelectorControl
							value={props.borderRadius}
							onChange={(borderRadius) =>
								onChange({ borderRadius })
							}
						/>

						{/* Alignment */}
						<LayoutControls.AlignmentControl
							value={props.align}
							onChange={(align) => onChange({ align })}
							includeFull={true}
						/>

						{/* Color */}
						<StyleControls.ColorPickerControl
							value={props.color}
							onChange={(color) => onChange({ color })}
							label={__('Color', 'quillcrm')}
							id="divider-color"
						/>

						{/* Background Color */}
						<StyleControls.ColorPickerControl
							value={props.backgroundColor}
							onChange={(backgroundColor) =>
								onChange({ backgroundColor })
							}
							label={__('Background Color', 'quillcrm')}
							id="bg-color"
						/>

						{/* Opacity */}
						<div className="flex flex-col gap-2">
							<div className="text-[#333333]">
								{__('Opacity', 'quillcrm')}
							</div>
							<Input
								type="number"
								min="0"
								max="1"
								step="0.1"
								value={props.opacity}
								onChange={(e) =>
									onChange({
										opacity: parseFloat(e.target.value),
									})
								}
								className="pr-8 h-10"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
								}}
								placeholder="1"
							/>
						</div>

						{/* Padding */}
						<LayoutControls.PaddingControl
							value={
								props.padding || {
									top: 0,
									right: 0,
									bottom: 0,
									left: 0,
								}
							}
							onChange={(padding) => onChange({ padding })}
						/>
					</>
				)}
			</BaseBlockEditor>
		</BlockEditorErrorBoundary>
	);
};
