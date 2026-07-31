/**
 * Edit Style color picker for document templates.
 */

import React, { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Ban, Pipette, X } from 'lucide-react';

import {
	TEMPLATE_COLOR_PRESETS,
	getCustomColorValue,
	isPresetColor,
	normalizeTemplateColor,
} from './color-presets';

interface TemplateStyleEditorProps {
	value: string | null;
	onChange: (color: string | null) => void;
	onClose?: () => void;
	compact?: boolean;
}

export const TemplateStyleEditor: React.FC<TemplateStyleEditorProps> = ({
	value,
	onChange,
	onClose,
	compact = false,
}) => {
	const colorInputId = useId();
	const hexInputId = useId();
	const colorInputRef = useRef<HTMLInputElement>(null);
	const normalized = normalizeTemplateColor(value);
	const customValue = getCustomColorValue(normalized);
	const isCustom = Boolean(normalized && !isPresetColor(normalized));

	// Local draft so partially typed hex codes ("#4c6") don't reset the color.
	const [hexDraft, setHexDraft] = useState(normalized ?? '');
	const [hexInvalid, setHexInvalid] = useState(false);

	useEffect(() => {
		setHexDraft(normalized ?? '');
		setHexInvalid(false);
	}, [normalized]);

	const commitHex = (raw: string) => {
		const trimmed = raw.trim();
		if (trimmed === '') {
			setHexInvalid(false);
			onChange(null);
			return;
		}
		const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
		const expanded = /^#[0-9a-fA-F]{3}$/.test(withHash)
			? `#${withHash
					.slice(1)
					.split('')
					.map((c) => c + c)
					.join('')}`
			: withHash;
		const parsed = normalizeTemplateColor(expanded);
		if (parsed === null) {
			setHexInvalid(true);
			setHexDraft(normalized ?? '');
			return;
		}
		setHexInvalid(false);
		onChange(parsed);
	};

	return (
		<div
			className={`rounded-xl border border-border bg-white shadow-sm ${
				compact ? 'p-4' : 'p-5'
			}`}
		>
			<div className="mb-4 flex items-center justify-between gap-2">
				<h3 className="text-base font-semibold text-foreground">
					{__('Edit Style', 'doublescale')}
				</h3>
				{onClose ? (
					<button
						type="button"
						className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
						onClick={onClose}
						aria-label={__('Close', 'doublescale')}
					>
						<X className="h-4 w-4" />
					</button>
				) : null}
			</div>

			<div className="space-y-3">
				<p className="text-sm font-medium text-foreground">
					{__('Edit Color', 'doublescale')}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					{TEMPLATE_COLOR_PRESETS.map((preset) => {
						const isActive =
							preset.value === normalized ||
							(preset.value === null && normalized === null);
						return (
							<button
								key={preset.id}
								type="button"
								title={preset.label}
								onClick={() => onChange(preset.value)}
								className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
									isActive
										? 'border-primary ring-2 ring-primary/30'
										: 'border-border hover:border-primary/40'
								}`}
								style={
									preset.value
										? { backgroundColor: preset.value }
										: { backgroundColor: '#f8fafc' }
								}
							>
								{preset.value === null ? (
									<Ban className="h-4 w-4 text-muted-foreground" />
								) : null}
							</button>
						);
					})}

					<button
						type="button"
						title={__('Custom color', 'doublescale')}
						onClick={() => colorInputRef.current?.click()}
						className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border transition ${
							isCustom
								? 'border-primary ring-2 ring-primary/30'
								: 'border-border hover:border-primary/40'
						}`}
						style={{ backgroundColor: customValue }}
					>
						<Pipette className="h-4 w-4 text-white drop-shadow" />
					</button>

					<input
						ref={colorInputRef}
						id={colorInputId}
						type="color"
						className="sr-only"
						value={customValue}
						onChange={(e) =>
							onChange(normalizeTemplateColor(e.target.value))
						}
					/>
				</div>

				<div className="space-y-1">
					<label
						htmlFor={hexInputId}
						className="block text-xs font-medium text-muted-foreground"
					>
						{__('Hex code', 'doublescale')}
					</label>
					<div className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className="h-9 w-9 shrink-0 rounded-lg border border-border"
							style={{
								backgroundColor: normalized ?? '#f8fafc',
							}}
						/>
						<input
							id={hexInputId}
							type="text"
							inputMode="text"
							spellCheck={false}
							autoComplete="off"
							maxLength={7}
							placeholder={__('#4C6FFF', 'doublescale')}
							value={hexDraft}
							aria-invalid={hexInvalid}
							onChange={(e) => {
								setHexDraft(e.target.value);
								setHexInvalid(false);
							}}
							onBlur={(e) => commitHex(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									commitHex(
										(e.target as HTMLInputElement).value
									);
								}
							}}
							className={`h-9 w-full rounded-lg border bg-white px-3 font-mono text-sm uppercase text-foreground outline-none transition focus:ring-2 ${
								hexInvalid
									? 'border-destructive focus:border-destructive focus:ring-destructive/30'
									: 'border-border focus:border-primary focus:ring-primary/30'
							}`}
						/>
					</div>
					<p
						className={`text-xs ${
							hexInvalid
								? 'text-destructive'
								: 'text-muted-foreground'
						}`}
						role={hexInvalid ? 'alert' : undefined}
					>
						{hexInvalid
							? __(
									'Enter a valid hex code, e.g. #4C6FFF.',
									'doublescale'
								)
							: __(
									'Leave empty to use the template default.',
									'doublescale'
								)}
					</p>
				</div>
			</div>
		</div>
	);
};
