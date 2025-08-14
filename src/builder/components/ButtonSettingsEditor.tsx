/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { Bold, ChevronLeft, Italic, Underline } from 'lucide-react';
import { useState } from 'react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	PaddingBottomIcon,
	PaddingLeftIcon,
	PaddingRightIcon,
	PaddingTopIcon,
} from '@quillcrm/components';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';

type ButtonType = 'primary' | 'secondary' | 'tertiary';

interface ButtonEditorProps {
	buttonType: ButtonType;
	onBack: () => void;
}

const ButtonEditor: React.FC<ButtonEditorProps> = ({ buttonType, onBack }) => {
	const [settings, setSettings] = useState({
		font: 'Arial',
		size: 14,
		letterSpacing: '0px',
		borderRadius: 0,
		textColor: '#FFFFFF',
		backgroundColor: '#1E3A8A',
		borderWidth: 1,
		borderColor: '#1E3A8A',
		padding: {
			top: 4,
			right: 8,
			bottom: 4,
			left: 8,
		},
		bold: false,
		italic: false,
		underline: false,
	});

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
			backgroundColor:
				buttonType === 'primary'
					? settings.backgroundColor
					: buttonType === 'tertiary'
						? 'white'
						: 'transparent',
			color:
				buttonType === 'primary'
					? settings.textColor
					: settings.backgroundColor,
			border:
				buttonType === 'tertiary'
					? 'none'
					: `${settings.borderWidth}px solid ${
							buttonType === 'secondary'
								? settings.backgroundColor
								: settings.borderColor
						}`,
			borderRadius: `${settings.borderRadius}px`,
			padding: `${settings.padding.top * 2}px ${settings.padding.right * 4}px ${settings.padding.bottom * 2}px ${settings.padding.left * 4}px`,
			fontWeight: settings.bold ? 'bold' : 'normal',
			fontStyle: settings.italic ? 'italic' : 'normal',
			textDecoration: settings.underline ? 'underline' : 'none',
		};

		return style;
	};

	return (
		<div>
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
				<div className="flex gap-3 items-center w-full">
					<div className="flex flex-col gap-1 text-[#333333] w-1/2">
						<label className="text-sm">
							{__('Font', 'quillcrm')}
						</label>
						<Select
							value={settings.font}
							onValueChange={(value) =>
								setSettings((prev) => ({
									...prev,
									font: value,
								}))
							}
						>
							<SelectTrigger className="w-full rounded-lg border-border h-10">
								<SelectValue
									placeholder={__('Select font', 'quillcrm')}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Arial">Arial</SelectItem>
								<SelectItem value="'Times New Roman', serif">
									Times New Roman
								</SelectItem>
								<SelectItem value="'Courier New', monospace">
									Courier New
								</SelectItem>
								<SelectItem value="Georgia, serif">
									Georgia
								</SelectItem>
								<SelectItem value="'Helvetica Neue', Helvetica, sans-serif">
									Helvetica
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1 text-[#333333] w-1/2">
						<label className="text-sm">
							{__('Size', 'quillcrm')}
						</label>
						<div className="relative flex items-center">
							<Input
								type="text"
								value={settings.size}
								onChange={(e) => {
									// Allow only digits
									const val = e.target.value.replace(
										/\D/g,
										''
									);
									setSettings((prev) => ({
										...prev,
										size: val === '' ? 0 : Number(val),
									}));
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
				</div>

				{/* Letter Spacing */}
				<div>
					<label className="text-sm text-[#333333] mb-1 block">
						{__('Letter Spacing', 'quillcrm')}
					</label>
					<Select
						value={settings.letterSpacing}
						onValueChange={(value) =>
							setSettings((prev) => ({
								...prev,
								letterSpacing: value,
							}))
						}
					>
						<SelectTrigger className="w-full border-border h-10">
							<SelectValue
								placeholder={__('Select spacing', 'quillcrm')}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="-1px">-1px</SelectItem>
							<SelectItem value="0px">Normal</SelectItem>
							<SelectItem value="1px">1px</SelectItem>
							<SelectItem value="2px">2px</SelectItem>
							<SelectItem value="3px">3px</SelectItem>
							<SelectItem value="4px">4px</SelectItem>
							<SelectItem value="5px">5px</SelectItem>
							<SelectItem value="6px">6px</SelectItem>
							<SelectItem value="7px">7px</SelectItem>
							<SelectItem value="8px">8px</SelectItem>
							<SelectItem value="9px">9px</SelectItem>
							<SelectItem value="10px">10px</SelectItem>
							<SelectItem value="11px">11px</SelectItem>
							<SelectItem value="12px">12px</SelectItem>
							<SelectItem value="13px">13px</SelectItem>
							<SelectItem value="14px">14px</SelectItem>
							<SelectItem value="15px">15px</SelectItem>
							<SelectItem value="16px">16px</SelectItem>
							<SelectItem value="17px">17px</SelectItem>
							<SelectItem value="18px">18px</SelectItem>
							<SelectItem value="19px">19px</SelectItem>
							<SelectItem value="20px">20px</SelectItem>
							<SelectItem value="21px">21px</SelectItem>
							<SelectItem value="22px">22px</SelectItem>
							<SelectItem value="23px">23px</SelectItem>
							<SelectItem value="24px">24px</SelectItem>
							<SelectItem value="25px">25px</SelectItem>
							<SelectItem value="26px">26px</SelectItem>
							<SelectItem value="27px">27px</SelectItem>
							<SelectItem value="28px">28px</SelectItem>
							<SelectItem value="29px">29px</SelectItem>
							<SelectItem value="30px">30px</SelectItem>
							<SelectItem value="31px">31px</SelectItem>
							<SelectItem value="32px">32px</SelectItem>
							<SelectItem value="33px">33px</SelectItem>
							<SelectItem value="34px">34px</SelectItem>
							<SelectItem value="35px">35px</SelectItem>
							<SelectItem value="36px">36px</SelectItem>
							<SelectItem value="37px">37px</SelectItem>
							<SelectItem value="38px">38px</SelectItem>
							<SelectItem value="39px">39px</SelectItem>
							<SelectItem value="40px">40px</SelectItem>
							<SelectItem value="41px">41px</SelectItem>
							<SelectItem value="42px">42px</SelectItem>
							<SelectItem value="43px">43px</SelectItem>
							<SelectItem value="44px">44px</SelectItem>
							<SelectItem value="45px">45px</SelectItem>
							<SelectItem value="46px">46px</SelectItem>
						</SelectContent>
					</Select>
				</div>

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
									setSettings((prev) => ({
										...prev,
										borderRadius: 0,
									}))
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
									setSettings((prev) => ({
										...prev,
										borderRadius: 8,
									}))
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
									setSettings((prev) => ({
										...prev,
										borderRadius: 9999,
									}))
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
									setSettings((prev) => ({
										...prev,
										borderRadius:
											val === '' ? 0 : parseInt(val, 10),
									}));
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
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Decoration', 'quillcrm')}
					</label>
					<div className="flex items-center justify-between border rounded-lg">
						<Bold
							className={cn(
								'size-12 py-3 px-5 w-full cursor-pointer text-[#141B34]',
								settings.bold &&
									'bg-[#C6DFF366] border border-primary rounded-l-lg'
							)}
							onClick={() =>
								setSettings((prev) => ({
									...prev,
									bold: !prev.bold,
								}))
							}
						/>
						<Italic
							className={cn(
								'size-12 py-3 px-5 w-full cursor-pointer text-[#141B34]',
								settings.italic &&
									'bg-[#C6DFF366] border border-primary'
							)}
							onClick={() =>
								setSettings((prev) => ({
									...prev,
									italic: !prev.italic,
								}))
							}
						/>
						<Underline
							className={cn(
								'size-12 py-3 px-5 w-full cursor-pointer text-[#141B34]',
								settings.underline &&
									'bg-[#C6DFF366] border border-primary rounded-r-lg'
							)}
							onClick={() =>
								setSettings((prev) => ({
									...prev,
									underline: !prev.underline,
								}))
							}
						/>
					</div>
				</div>

				{/* Text Color */}
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Text color', 'quillcrm')}
					</label>
					<div className="flex items-center gap-2 border rounded-lg px-2">
						<Input
							id="text-color"
							type="text"
							value={settings.textColor}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									textColor: e.target.value,
								}))
							}
							className="rounded-lg"
							style={{ border: 0 }}
						/>
						<Input
							type="color"
							value={settings.textColor}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									textColor: e.target.value,
								}))
							}
							className="w-10 h-10 p-1 rounded-lg"
							style={{ border: 0 }}
						/>
					</div>
				</div>

				{/* Background Color */}
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Background color', 'quillcrm')}
					</label>
					<div className="flex items-center gap-2 border rounded-lg px-2">
						<Input
							id="bg-color"
							type="text"
							value={settings.backgroundColor}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									backgroundColor: e.target.value,
								}))
							}
							className="rounded-lg"
							style={{ border: 0 }}
						/>
						<Input
							type="color"
							value={settings.backgroundColor}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									backgroundColor: e.target.value,
								}))
							}
							className="w-10 h-10 p-1 rounded-lg"
							style={{ border: 0 }}
						/>
					</div>
				</div>

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
								setSettings((prev) => ({
									...prev,
									borderWidth: val === '' ? 0 : Number(val),
								}));
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
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Border color', 'quillcrm')}
					</label>
					<div className="flex items-center gap-2 border rounded-lg px-2">
						<Input
							id="border-color"
							type="text"
							value={settings.borderColor}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									borderColor: e.target.value,
								}))
							}
							className="rounded-lg"
							style={{ border: 0 }}
						/>
						<Input
							type="color"
							value={settings.borderColor}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									borderColor: e.target.value,
								}))
							}
							className="w-10 h-10 p-1 rounded-lg"
							style={{ border: 0 }}
						/>
					</div>
				</div>

				{/* Padding */}
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Padding', 'quillcrm')}
					</label>
					<div className="flex gap-2">
						<div className="relative flex items-center">
							<div className="absolute left-2 text-[#333333]">
								<PaddingLeftIcon />
							</div>
							<Input
								type="number"
								value={settings.padding.left}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										padding: {
											...prev.padding,
											left: parseInt(e.target.value),
										},
									}))
								}
								className="h-10"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
									paddingLeft: '32px',
								}}
							/>
						</div>
						<div className="relative flex items-center">
							<div className="absolute left-2 text-[#333333]">
								<PaddingRightIcon />
							</div>
							<Input
								type="number"
								value={settings.padding.right}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										padding: {
											...prev.padding,
											right: parseInt(e.target.value),
										},
									}))
								}
								className="h-10"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
									paddingLeft: '32px',
								}}
							/>
						</div>
						<div className="relative flex items-center">
							<div className="absolute left-2 text-[#333333]">
								<PaddingTopIcon />
							</div>
							<Input
								type="number"
								value={settings.padding.top}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										padding: {
											...prev.padding,
											top: parseInt(e.target.value),
										},
									}))
								}
								className="h-10"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
									paddingLeft: '32px',
								}}
							/>
						</div>
						<div className="relative flex items-center">
							<div className="absolute left-2 text-[#333333]">
								<PaddingBottomIcon />
							</div>
							<Input
								type="number"
								value={settings.padding.bottom}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										padding: {
											...prev.padding,
											bottom: parseInt(e.target.value),
										},
									}))
								}
								className="h-10"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
									paddingLeft: '32px',
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ButtonEditor;
