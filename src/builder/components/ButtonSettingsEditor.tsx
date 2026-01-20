/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useButtonSettings } from '../hooks/useButtonSettings';
import {
	FontControl,
	LetterSpacingControl,
	TextFormattingControl,
	ColorPickerControl,
	PaddingControl,
} from '../blocks/basic/shared';

type ButtonType = 'primary' | 'secondary' | 'tertiary';

interface ButtonEditorProps {
	buttonType: ButtonType;
	onBack: () => void;
}

const ButtonEditor: React.FC<ButtonEditorProps> = ({ buttonType, onBack }) => {
	const { getButtonSettings, updateButtonSettings } = useButtonSettings();
	const [settings, setSettings] = useState(getButtonSettings(buttonType));

	// Update local state when global settings change
	useEffect(() => {
		setSettings(getButtonSettings(buttonType));
	}, [buttonType, getButtonSettings]);

	// Update global settings when local state changes
	const updateSettings = (newSettings: Partial<typeof settings>) => {
		const updatedSettings = { ...settings, ...newSettings };
		setSettings(updatedSettings);
		updateButtonSettings(buttonType, updatedSettings);
	};

	const getButtonTitle = () => {
		switch (buttonType) {
			case 'primary':
				return __('Primary button', 'quillcrm');
			case 'secondary':
				return __('Secondary button', 'quillcrm');
			case 'tertiary':
				return __('Tertiary button', 'quillcrm');
			default:
				return __('Button', 'quillcrm');
		}
	};

	const getButtonStyle = () => {
		let style: React.CSSProperties = {
			fontFamily: settings.font,
			fontSize: `${settings.size}px`,
			letterSpacing: settings.letterSpacing,
			backgroundColor: settings.backgroundColor,
			color: settings.textColor,
			border: `${settings.borderWidth}px solid ${settings.borderColor}`,
			borderRadius: `${settings.borderRadius}px`,
			padding: `${settings.padding.top * 2}px ${settings.padding.right * 4}px ${settings.padding.bottom * 2}px ${settings.padding.left * 4}px`,
			fontWeight: settings.bold ? 'bold' : 'normal',
			fontStyle: settings.italic ? 'italic' : 'normal',
			textDecoration:
				[
					settings.underline ? 'underline' : '',
					settings.strikethrough ? 'line-through' : '',
				]
					.filter(Boolean)
					.join(' ') || 'none',
		};

		return style;
	};

	return (
		<div className='overflow-y-auto'>
			<div className="flex items-center justify-between border-b-2 px-4 pt-5 pb-4">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={onBack}
						className="p-1 h-auto"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h3 className="text-base text-[#333333]">
						{getButtonTitle()}
					</h3>
				</div>
			</div>
			<div className="space-y-4 p-4">
				{/* Preview Section */}
				<div>
					<div className="text-sm text-[#333333] mb-2">
						{__('Preview', 'quillcrm')}
					</div>
					<div className="bg-muted p-6 border rounded-lg flex justify-center">
						<div style={getButtonStyle()}>
							{__('Button', 'quillcrm')}
						</div>
					</div>
					<p className="text-xs text-[#616161] mt-2">
						{__(
							'Changes made to this button will be reflected throughout the whole email.',
							'quillcrm'
						)}
					</p>
				</div>

				{/* Font and Size */}
				<FontControl
					fontFamily={settings.font}
					fontSize={settings.size}
					onFontFamilyChange={(font) => updateSettings({ font })}
					onFontSizeChange={(size) => updateSettings({ size })}
				/>

				{/* Letter Spacing */}
				<LetterSpacingControl
					value={settings.letterSpacing}
					onChange={(value) =>
						updateSettings({ letterSpacing: value })
					}
				/>

				{/* Shape and Border */}
				<div className="flex gap-3 items-end w-full">
					<div className="flex flex-col gap-2 text-[#333333] w-2/3">
						<label className="text-sm">
							{__('Shape', 'quillcrm')}
						</label>
						<div className="flex items-center justify-between border rounded-lg">
							<div
								className={cn(
									'py-2 px-2 w-full text-center cursor-pointer',
									settings.borderRadius === 0 &&
									'bg-[#C6DFF366] border border-primary rounded-lg'
								)}
								onClick={() =>
									updateSettings({ borderRadius: 0 })
								}
							>
								<div className="bg-accent py-3 px-5"></div>
							</div>
							<div
								className={cn(
									'py-2 px-2 w-full text-center cursor-pointer',
									settings.borderRadius === 8 &&
									'bg-[#C6DFF366] border border-primary rounded-lg'
								)}
								onClick={() =>
									updateSettings({ borderRadius: 8 })
								}
							>
								<div className="bg-accent py-3 px-5 rounded-lg"></div>
							</div>
							<div
								className={cn(
									'py-2 px-2 w-full text-center cursor-pointer',
									settings.borderRadius === 9999 &&
									'bg-[#C6DFF366] border border-primary rounded-lg'
								)}
								onClick={() =>
									updateSettings({ borderRadius: 9999 })
								}
							>
								<div className="bg-accent py-3 px-5 rounded-full"></div>
							</div>
						</div>
					</div>
					<div className="w-1/3">
						<div className="relative flex items-center">
							<Input
								type="text"
								value={settings.borderRadius}
								onChange={(e) => {
									const val = e.target.value.replace(
										/\D/g,
										''
									);
									updateSettings({
										borderRadius:
											val === '' ? 0 : parseInt(val, 10),
									});
								}}
								className="pr-8 h-[43.2px]"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
								}}
							/>
							<span className="absolute right-3 text-gray-400">
								px
							</span>
						</div>
					</div>
				</div>

				{/* Decoration */}
				<TextFormattingControl
					value={{
						bold: settings.bold,
						italic: settings.italic,
						underline: settings.underline,
						strikethrough: settings.strikethrough,
					}}
					onChange={(updates) => updateSettings(updates)}
				/>

				{/* Text Color */}
				<ColorPickerControl
					label={__('Text color', 'quillcrm')}
					value={settings.textColor}
					onChange={(value) => updateSettings({ textColor: value })}
					id="text-color"
				/>

				{/* Background Color */}
				<ColorPickerControl
					label={__('Background color', 'quillcrm')}
					value={settings.backgroundColor}
					onChange={(value) =>
						updateSettings({ backgroundColor: value })
					}
					id="bg-color"
				/>

				{/* Border Width */}
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Border Width', 'quillcrm')}
					</label>
					<div className="relative flex items-center">
						<Input
							type="text"
							value={settings.borderWidth}
							onChange={(e) => {
								// Allow only digits
								const val = e.target.value.replace(/\D/g, '');
								updateSettings({
									borderWidth: val === '' ? 0 : Number(val),
								});
							}}
							className="pr-8 h-10"
							style={{
								borderColor: '#e5e5e5',
								borderRadius: '0.5rem',
							}}
						/>
						<span className="absolute right-3 text-gray-400">
							px
						</span>
					</div>
				</div>

				{/* Border Color */}
				<ColorPickerControl
					label={__('Border color', 'quillcrm')}
					value={settings.borderColor}
					onChange={(value) => updateSettings({ borderColor: value })}
					id="border-color"
				/>

				{/* Padding */}
				<PaddingControl
					value={settings.padding}
					onChange={(value) => updateSettings({ padding: value })}
				/>
			</div>
		</div>
	);
};

export default ButtonEditor;
