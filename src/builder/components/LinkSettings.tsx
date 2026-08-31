/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useLayoutEffect, useRef } from 'react';
/**
 * internal dependencies
 */
import { useLinkSettings } from '../hooks/useLinkSettings';
import {
	FontControl,
	LetterSpacingControl,
	TextFormattingControl,
	ColorPickerControl,
} from '../blocks/basic/shared';
import { getLinkTextDecoration } from '../utils/linkSettings';

const LinkSettings: React.FC = () => {
	const { getLinkSettings, updateLinkSettings } = useLinkSettings();
	const settings = getLinkSettings();
	const previewRef = useRef<HTMLAnchorElement>(null);

	useLayoutEffect(() => {
		const el = previewRef.current;
		if (!el) {
			return;
		}
		el.style.fontFamily = settings.font;
		el.style.fontSize = `${settings.size}px`;
		el.style.letterSpacing = settings.letterSpacing;
		el.style.fontWeight = settings.bold ? 'bold' : 'normal';
		el.style.fontStyle = settings.italic ? 'italic' : 'normal';
		el.style.textDecoration = getLinkTextDecoration(settings);
		el.style.color = settings.color;
	}, [settings]);

	return (
		<div className="flex flex-col gap-6 text-slate-200">
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
						<a
							ref={previewRef}
							href="#preview"
							onClick={(e) => e.preventDefault()}
						>
							{__('Sample link', 'doublescale')}
						</a>
					</div>
				</div>
				<p className="text-sm text-white">
					{__(
						'Changes made to this link style will be reflected throughout the whole email.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="space-y-4">
				<FontControl
					fontFamily={settings.font}
					fontSize={settings.size}
					onFontFamilyChange={(font) => updateLinkSettings({ font })}
					onFontSizeChange={(size) => updateLinkSettings({ size })}
				/>
				<LetterSpacingControl
					value={settings.letterSpacing}
					onChange={(letterSpacing) =>
						updateLinkSettings({ letterSpacing })
					}
				/>
			</div>

			<TextFormattingControl
				value={{
					bold: settings.bold,
					italic: settings.italic,
					underline: settings.underline,
					strikethrough: settings.strikethrough,
				}}
				onChange={(updates) => updateLinkSettings(updates)}
			/>

			<ColorPickerControl
				label={__('Link color', 'doublescale')}
				value={settings.color}
				onChange={(color) => updateLinkSettings({ color })}
				id="theme-link-color"
			/>
		</div>
	);
};

export default LinkSettings;
