/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MenuItem } from '../..';

interface BulkEditorProps {
	item: MenuItem;
	onUpdate: (updates: Partial<MenuItem>) => void;
}

export const BulkEditor: React.FC<BulkEditorProps> = ({ item, onUpdate }) => {
	return (
		<div className="border-t pt-5">
			<h3 className="text-[#333333] text-sm font-semibold mb-4">
				{__('Edit All Menu Items', 'quillcrm')}
			</h3>

			<div className="space-y-4">
				{/* Font and Size */}
				<div className="flex gap-3 items-end w-full">
					<div className="flex flex-col gap-2 text-[#333333] w-2/3">
						<label className="text-sm">
							{__('Font', 'quillcrm')}
						</label>
						<Select
							value={item.fontFamily}
							onValueChange={(value) =>
								onUpdate({ fontFamily: value })
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
					<div className="flex flex-col gap-2 text-[#333333] w-1/3">
						<label className="text-sm">
							{__('Size', 'quillcrm')}
						</label>
						<Input
							type="number"
							value={item.fontSize}
							onChange={(e) =>
								onUpdate({
									fontSize: parseInt(e.target.value) || 16,
								})
							}
							className="pr-8 h-10"
							style={{
								borderColor: '#e5e5e5',
								borderRadius: '0.5rem',
							}}
						/>
					</div>
				</div>

				{/* Letter Spacing */}
				<div className="flex flex-col gap-2 text-[#333333]">
					<label className="text-sm">
						{__('Letter Spacing', 'quillcrm')}
					</label>
					<Select
						value={item.letterSpacing}
						onValueChange={(value) =>
							onUpdate({ letterSpacing: value })
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

				{/* Text Formatting */}
				<div className="flex flex-col gap-2 text-[#333333]">
					<label className="text-sm">
						{__('Decoration', 'quillcrm')}
					</label>
					<div className="flex items-center justify-between border rounded-lg">
						<Bold
							className={cn(
								'size-12 py-3 px-5 w-full cursor-pointer',
								item.bold &&
									'bg-[#C6DFF366] border border-primary rounded-l-lg'
							)}
							onClick={() => onUpdate({ bold: !item.bold })}
						/>
						<Italic
							className={cn(
								'size-12 py-3 px-5 w-full cursor-pointer',
								item.italic &&
									'bg-[#C6DFF366] border border-primary'
							)}
							onClick={() => onUpdate({ italic: !item.italic })}
						/>
						<Strikethrough
							className={cn(
								'size-12 py-3 px-5 w-full cursor-pointer',
								item.strikethrough &&
									'bg-[#C6DFF366] border border-primary'
							)}
							onClick={() =>
								onUpdate({ strikethrough: !item.strikethrough })
							}
						/>
						<Underline
							className={cn(
								'size-12 py-3 px-5 w-full cursor-pointer',
								item.underline &&
									'bg-[#C6DFF366] border border-primary rounded-r-lg'
							)}
							onClick={() =>
								onUpdate({ underline: !item.underline })
							}
						/>
					</div>
				</div>

				{/* Color and Background */}
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Text Color', 'quillcrm')}
					</label>
					<div className="flex items-center gap-2 border rounded-lg px-2">
						<Input
							type="text"
							value={item.color}
							onChange={(e) =>
								onUpdate({ color: e.target.value })
							}
							className="rounded-lg"
							style={{ border: 0 }}
						/>
						<Input
							type="color"
							value={item.color}
							onChange={(e) =>
								onUpdate({ color: e.target.value })
							}
							className="w-10 h-10 p-1 rounded-lg"
							style={{ border: 0 }}
						/>
					</div>
				</div>
				<div>
					<label className="text-sm text-[#333333] mb-2 block">
						{__('Background Color', 'quillcrm')}
					</label>
					<div className="flex items-center gap-2 border rounded-lg px-2">
						<Input
							type="text"
							value={item.backgroundColor}
							onChange={(e) =>
								onUpdate({ backgroundColor: e.target.value })
							}
							className="rounded-lg"
							style={{ border: 0 }}
						/>
						<Input
							type="color"
							value={item.backgroundColor}
							onChange={(e) =>
								onUpdate({ backgroundColor: e.target.value })
							}
							className="w-10 h-10 p-1 rounded-lg"
							style={{ border: 0 }}
						/>
					</div>
				</div>

				{/* Shape and Border Radius */}
				<div className="flex gap-3 items-end w-full">
					<div className="flex flex-col gap-2 text-[#333333] w-2/3">
						<label className="text-sm">
							{__('Shape', 'quillcrm')}
						</label>
						<div className="flex items-center justify-between border rounded-lg">
							<div
								className={cn(
									'py-2 px-2 w-full text-center cursor-pointer',
									item.borderRadius === '0' &&
										'bg-[#C6DFF366] border border-primary rounded-lg'
								)}
								onClick={() => onUpdate({ borderRadius: '0' })}
							>
								<div className="bg-accent py-3 px-5"></div>
							</div>
							<div
								className={cn(
									'py-2 px-2 w-full text-center cursor-pointer',
									item.borderRadius === '8' &&
										'bg-[#C6DFF366] border border-primary rounded-lg'
								)}
								onClick={() => onUpdate({ borderRadius: '8' })}
							>
								<div className="bg-accent py-3 px-5 rounded-lg"></div>
							</div>
							<div
								className={cn(
									'py-2 px-2 w-full text-center cursor-pointer',
									item.borderRadius === '9999' &&
										'bg-[#C6DFF366] border border-primary rounded-lg'
								)}
								onClick={() =>
									onUpdate({ borderRadius: '9999' })
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
								value={item.borderRadius}
								onChange={(e) =>
									onUpdate({ borderRadius: e.target.value })
								}
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
			</div>
		</div>
	);
};
