/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useLayoutEffect, useRef, useState } from 'react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useButtonSettings } from '../hooks/useButtonSettings';
import type { ButtonType } from '../../stores/email-builder/types';
import {
	FontControl,
	LetterSpacingControl,
	TextFormattingControl,
	ColorPickerControl,
	PaddingControl,
	ShapeSelectorControl,
} from '../blocks/basic/shared';

const BUTTON_TYPES: { value: ButtonType; label: string }[] = [
	{ value: 'primary', label: __('Primary', 'doublescale') },
	{ value: 'secondary', label: __('Secondary', 'doublescale') },
	{ value: 'tertiary', label: __('Tertiary', 'doublescale') },
];

const ButtonSettings: React.FC = () => {
	const { getButtonSettings, updateButtonSettings } = useButtonSettings();
	const [activeType, setActiveType] = useState<ButtonType>('primary');
	const settings = getButtonSettings(activeType);
	const previewRef = useRef<HTMLSpanElement>(null);

	const updateSettings = (patch: Partial<typeof settings>) => {
		updateButtonSettings(activeType, { ...settings, ...patch });
	};

	useLayoutEffect(() => {
		const el = previewRef.current;
		if (!el) {
			return;
		}
		const s = settings;
		el.style.display = 'inline-block';
		el.style.fontFamily = s.font;
		el.style.fontSize = `${s.size}px`;
		el.style.letterSpacing = s.letterSpacing;
		el.style.borderRadius = `${s.borderRadius}px`;
		el.style.fontWeight = s.bold ? 'bold' : 'normal';
		el.style.fontStyle = s.italic ? 'italic' : 'normal';
		el.style.textDecoration =
			[s.underline ? 'underline' : '', s.strikethrough ? 'line-through' : '']
				.filter(Boolean)
				.join(' ') || 'none';
		el.style.color = s.textColor;
		el.style.backgroundColor = s.backgroundColor;
		el.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
		el.style.padding = `${s.padding.top}px ${s.padding.right}px ${s.padding.bottom}px ${s.padding.left}px`;
	}, [settings]);

	return (
		<div className="flex flex-col gap-6 text-slate-200">
			<div className="space-y-3">
				<div className="text-sm font-medium text-slate-200">
					{__('Type', 'doublescale')}
				</div>
				<RadioGroup
					value={activeType}
					onValueChange={(v) => setActiveType(v as ButtonType)}
					className="flex flex-wrap justify-between gap-x-4 gap-y-2"
				>
					{BUTTON_TYPES.map(({ value, label }) => (
						<div key={value} className="flex items-center gap-2">
							<RadioGroupItem
								value={value}
								id={`btn-type-${value}`}
								className="border-white text-white data-[state=checked]:border-white data-[state=checked]:text-white"
							/>
							<Label
								htmlFor={`btn-type-${value}`}
								className="cursor-pointer text-sm font-normal text-white"
							>
								{label}
							</Label>
						</div>
					))}
				</RadioGroup>
			</div>

			<div className="space-y-2">
				<div className="text-sm font-medium text-slate-200">
					{__('Preview', 'doublescale')}
				</div>
				<div className="relative min-h-[120px] w-full min-w-0 overflow-hidden rounded-xl bg-white">
					<svg
						className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.38]"
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="none"
						aria-hidden
					>
						<rect
							x="0.75"
							y="0.75"
							width="calc(100% - 1.5px)"
							height="calc(100% - 1.5px)"
							rx="12"
							ry="12"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeDasharray="18 12"
							vectorEffect="nonScalingStroke"
						/>
					</svg>
					<div className="relative flex min-h-[120px] items-center justify-center px-6 py-10">
						<span ref={previewRef}>{__('Button', 'doublescale')}</span>
					</div>
				</div>
				<p className="text-sm text-white">
					{__(
						'Changes made to this button will be reflected throughout the whole email.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="space-y-4">
				<FontControl
					fontFamily={settings.font}
					fontSize={settings.size}
					onFontFamilyChange={(font) => updateSettings({ font })}
					onFontSizeChange={(size) => updateSettings({ size })}
				/>
				<LetterSpacingControl
					value={settings.letterSpacing}
					onChange={(letterSpacing) => updateSettings({ letterSpacing })}
				/>
			</div>

			<div className="space-y-3">
				<div className="text-sm font-medium text-slate-200">
					{__('Shape', 'doublescale')}
				</div>
				<ShapeSelectorControl
					showLabel={false}
					value={settings.borderRadius}
					onChange={(borderRadius) => {
						if (borderRadius === '') {
							updateSettings({ borderRadius: 0 });
							return;
						}
						const num = parseInt(borderRadius, 10);
						updateSettings({
							borderRadius: Number.isNaN(num)
								? 0
								: Math.min(9999, Math.max(0, num)),
						});
					}}
				/>
			</div>

			<TextFormattingControl
				value={{
					bold: settings.bold,
					italic: settings.italic,
					underline: settings.underline,
					strikethrough: settings.strikethrough,
				}}
				onChange={(updates) => updateSettings(updates)}
			/>

			<div className="space-y-4">
				<ColorPickerControl
					label={__('Text color', 'doublescale')}
					value={settings.textColor}
					onChange={(textColor) => updateSettings({ textColor })}
					id="btn-text-color"
				/>
				<ColorPickerControl
					label={__('Background color', 'doublescale')}
					value={settings.backgroundColor}
					onChange={(backgroundColor) => updateSettings({ backgroundColor })}
					id="btn-bg-color"
				/>
				<ColorPickerControl
					label={__('Border color', 'doublescale')}
					value={settings.borderColor}
					onChange={(borderColor) => updateSettings({ borderColor })}
					id="btn-border-color"
				/>
				<div>
					<label className="mb-2 block text-sm text-white">
						{__('Border Width', 'doublescale')}
					</label>
					<div className="relative rounded-lg h-10"
					style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
					>
						<Input
							type="text"
							inputMode="numeric"
							value={settings.borderWidth}
							onChange={(e) => {
								const val = e.target.value.replace(/\D/g, '');
								updateSettings({
									borderWidth: val === '' ? 0 : Number(val),
								});
							}}
							className="h-10 !rounded-lg !border-none !ring-0 !ring-offset-0 !bg-transparent pr-10 !text-white shadow-none focus-visible:ring-1 focus-visible:ring-white/30"
						/>
						<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
							px
						</span>
					</div>
				</div>
			</div>

			<PaddingControl
				value={settings.padding}
				onChange={(padding) => updateSettings({ padding })}
			/>
		</div>
	);
};

export default ButtonSettings;
