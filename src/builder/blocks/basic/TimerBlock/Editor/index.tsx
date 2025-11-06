/**
 * Timer Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better organization and type safety
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimerBlockProps } from '..';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as TypographyControls from '../../shared/control-groups/typography';
import * as StyleControls from '../../shared/control-groups/style';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as MediaControls from '../../shared/control-groups/media';

export interface TimerBlockEditorProps {
	props: TimerBlockProps;
	onChange: (updates: Partial<TimerBlockProps>) => void;
}

export const TimerBlockEditor: React.FC<TimerBlockEditorProps> = ({
	props,
	onChange,
}) => {
	// Timezone options
	const timezones = [
		{ value: 'UTC', label: 'UTC' },
		{ value: 'America/New_York', label: 'Eastern Time' },
		{ value: 'America/Chicago', label: 'Central Time' },
		{ value: 'America/Denver', label: 'Mountain Time' },
		{ value: 'America/Los_Angeles', label: 'Pacific Time' },
		{ value: 'Europe/London', label: 'London' },
		{ value: 'Europe/Paris', label: 'Paris' },
		{ value: 'Asia/Tokyo', label: 'Tokyo' },
		{ value: 'Asia/Shanghai', label: 'Shanghai' },
		{ value: 'Australia/Sydney', label: 'Sydney' },
	];

	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* Target Date */}
						<div className="flex flex-col gap-1 text-[#333333]">
							<label className="text-sm">
								{__('Choose a date', 'quillcrm')}
							</label>
							<DatePicker
								value={props.targetDate}
								onChange={(value) =>
									onChange({ targetDate: value })
								}
								placeholder={__(
									'Select target date',
									'quillcrm'
								)}
								className="w-full"
								buttonClassName="w-full justify-between bg-white rounded-lg shadow-none border border-border"
							/>
						</div>

						{/* Time Selection */}
						<div className="flex gap-3 w-full">
							<div className="flex flex-col gap-1 text-[#333333] w-1/2">
								<label className="text-sm">
									{__('Hours', 'quillcrm')}
								</label>
								<Select
									value={props.targetHour.toString()}
									onValueChange={(value) =>
										onChange({
											targetHour: parseInt(value),
										})
									}
								>
									<SelectTrigger className="w-full rounded-lg border-border h-10">
										<SelectValue
											placeholder={__('Hour', 'quillcrm')}
										/>
									</SelectTrigger>
									<SelectContent>
										{Array.from({ length: 24 }, (_, i) => (
											<SelectItem
												key={i}
												value={i.toString()}
											>
												{i.toString().padStart(2, '0')}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-1 text-[#333333] w-1/2">
								<label className="text-sm">
									{__('Minutes', 'quillcrm')}
								</label>
								<Select
									value={props.targetMinute.toString()}
									onValueChange={(value) =>
										onChange({
											targetMinute: parseInt(value),
										})
									}
								>
									<SelectTrigger className="w-full rounded-lg border-border h-10">
										<SelectValue
											placeholder={__(
												'Minute',
												'quillcrm'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{Array.from({ length: 60 }, (_, i) => (
											<SelectItem
												key={i}
												value={i.toString()}
											>
												{i.toString().padStart(2, '0')}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Timezone */}
						<div className="flex flex-col gap-1 text-[#333333]">
							<label className="text-sm">
								{__('Timezone', 'quillcrm')}
							</label>
							<Select
								value={props.timezone}
								onValueChange={(value) =>
									onChange({ timezone: value })
								}
							>
								<SelectTrigger className="w-full rounded-lg border-border h-10">
									<SelectValue
										placeholder={__(
											'Select timezone',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{timezones.map((tz) => (
										<SelectItem
											key={tz.value}
											value={tz.value}
										>
											{tz.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Width */}
						<LayoutControls.WidthHeightControl
							width={props.width}
							onWidthChange={(width) => onChange({ width })}
							widthLabel={__('Width', 'quillcrm')}
							widthUnit="%"
							widthPlaceholder="100"
							showHeight={false}
						/>

						{/* Link with Merge Tags */}
						<MediaControls.LinkInput
							label={__('Link URL', 'quillcrm')}
							value={props.link}
							onChange={(link) => onChange({ link })}
							placeholder="https://example.com"
						/>

						{/* Alt Text with Merge Tags */}
						<MediaControls.AltTextInput
							value={props.altText}
							onChange={(altText) => onChange({ altText })}
							placeholder={__('Timer description', 'quillcrm')}
						/>

						{/* Timer Background Color */}
						<StyleControls.ColorPickerControl
							value={props.backgroundColor}
							onChange={(backgroundColor) =>
								onChange({ backgroundColor })
							}
							label={__('Timer Background Color', 'quillcrm')}
							placeholder="#000000"
						/>

						{/* Digits Font Family and Size */}
						<TypographyControls.FontControl
							fontFamily={props.digitsFontFamily}
							fontSize={props.digitsFontSize}
							onFontFamilyChange={(digitsFontFamily) =>
								onChange({ digitsFontFamily })
							}
							onFontSizeChange={(digitsFontSize) =>
								onChange({ digitsFontSize })
							}
							className="w-full"
						/>

						{/* Digits Color */}
						<StyleControls.ColorPickerControl
							value={props.digitsColor}
							onChange={(digitsColor) =>
								onChange({ digitsColor })
							}
							label={__('Digits Color', 'quillcrm')}
							placeholder="#000000"
						/>

						{/* Separator Font Family and Size */}
						<TypographyControls.FontControl
							fontFamily={props.separatorFontFamily}
							fontSize={props.separatorFontSize}
							onFontFamilyChange={(separatorFontFamily) =>
								onChange({ separatorFontFamily })
							}
							onFontSizeChange={(separatorFontSize) =>
								onChange({ separatorFontSize })
							}
							className="w-full"
						/>

						{/* Separator Color */}
						<StyleControls.ColorPickerControl
							value={props.separatorColor}
							onChange={(separatorColor) =>
								onChange({ separatorColor })
							}
							label={__('Separator Color', 'quillcrm')}
							placeholder="#000000"
						/>

						{/* Alignment */}
						<LayoutControls.AlignmentControl
							value={
								props.align as
									| 'left'
									| 'center'
									| 'right'
									| 'full'
							}
							onChange={(align) => onChange({ align })}
							label={__('Alignment', 'quillcrm')}
						/>

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
							label={__('Padding', 'quillcrm')}
						/>
					</>
				)}
			</BaseBlockEditor>
		</BlockEditorErrorBoundary>
	);
};
