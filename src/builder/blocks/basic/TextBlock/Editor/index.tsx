/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import {
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	List,
	ListOrdered,
	Bold,
	ExternalLink,
	Italic,
	Strikethrough,
	Underline,
} from 'lucide-react';
/**
 * internal dependencies
 */
import {
	MergeTagsIcon,
	PaddingBottomIcon,
	PaddingLeftIcon,
	PaddingRightIcon,
	PaddingTopIcon,
} from '@quillcrm/components';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { TextBlockProps } from '..';
import { useDispatch } from '@wordpress/data';

export interface TextEditorProps {
	props: TextBlockProps;
	onChange: (updates: Partial<TextBlockProps>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ props, onChange }) => {
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('quillcrm/core');

	const handleMergeTagClick = () => {
		// Set the callback to insert the merge tag into the content field
		setMergeTagCallback((tagValue: string) => {
			onChange({ content: props.content + tagValue });
		});
		setMergeTagsVisible(true);
	};

	return (
		<div className="grid gap-5">
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center text-[#333333]">
					<div>{__('Insert Tag', 'quillcrm')}</div>
					<div
						className="cursor-pointer hover:opacity-80"
						onClick={handleMergeTagClick}
					>
						<MergeTagsIcon />
					</div>
				</div>
				<Input
					type="text"
					value={props.content}
					onChange={(e) => onChange({ content: e.target.value })}
					className="pr-8 h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center text-[#333333]">
					<div>{__('Link URL', 'quillcrm')}</div>
					<ExternalLink className="size-5" />
				</div>
				<Input
					type="text"
					value={props.hyperlink}
					onChange={(e) => onChange({ hyperlink: e.target.value })}
					className="pr-8 h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
				/>
			</div>

			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Decoration', 'quillcrm')}</div>
				<div className="flex items-center justify-between border rounded-lg">
					<Bold
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.bold &&
							'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() => onChange({ bold: !props.bold })}
					/>
					<Italic
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.italic &&
							'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ italic: !props.italic })}
					/>
					<Strikethrough
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props['line-through'] &&
							'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() =>
							onChange({ 'line-through': !props['line-through'] })
						}
					/>
					<Underline
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.underline &&
							'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() =>
							onChange({ underline: !props.underline })
						}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Text Alignment', 'quillcrm')}</div>
				<div className="flex items-center justify-between border rounded-lg">
					<AlignLeft
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.textAlign === 'left' &&
							'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() => onChange({ textAlign: 'left' })}
					/>
					<AlignCenter
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.textAlign === 'center' &&
							'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ textAlign: 'center' })}
					/>
					<AlignRight
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.textAlign === 'right' &&
							'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ textAlign: 'right' })}
					/>
					<AlignJustify
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.textAlign === 'justify' &&
							'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ textAlign: 'justify' })}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('List Style', 'quillcrm')}</div>
				<div className="flex items-center justify-between border rounded-lg">
					<div
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer flex items-center justify-center',
							props.listType === 'none' &&
							'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() => onChange({ listType: 'none' })}
					>
						<span className="text-sm font-medium">None</span>
					</div>
					<List
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.listType === 'ul' &&
							'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ listType: 'ul' })}
					/>
					<ListOrdered
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.listType === 'ol' &&
							'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ listType: 'ol' })}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Text Style', 'quillcrm')}</div>
				<Select
					value={props.headingStyle}
					onValueChange={(value) =>
						onChange({ headingStyle: value })
					}
				>
					<SelectTrigger className="w-full rounded-lg border-border h-10">
						<SelectValue
							placeholder={__('Select heading style', 'quillcrm')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="h1">H1 Style</SelectItem>
						<SelectItem value="h2">H2 Style</SelectItem>
						<SelectItem value="h3">H3 Style</SelectItem>
						<SelectItem value="p">Paragraph Style</SelectItem>
						<SelectItem value="small">Footnote Style</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex gap-3 items-center w-full">
				<div className="flex flex-col gap-2 text-[#333333] w-2/3">
					<div>{__('Font', 'quillcrm')}</div>
					<Select
						value={props.fontFamily}
						onValueChange={(value) =>
							onChange({ fontFamily: value })
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
					<div>{__('Size', 'quillcrm')}</div>
					<Input
						type="number"
						value={props.fontSize}
						onChange={(e) =>
							onChange({ fontSize: parseInt(e.target.value) })
						}
						className="pr-8 h-10"
						style={{
							borderColor: '#e5e5e5',
							borderRadius: '0.5rem',
						}}
					/>
				</div>
			</div>
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
							<SelectItem value="1">Single</SelectItem>
							<SelectItem value="1.15">1.15</SelectItem>
							<SelectItem value="1.25">1.25</SelectItem>
							<SelectItem value="1.5">1.5</SelectItem>
							<SelectItem value="2">Double</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 w-1/2">
					<div className="text-[#333333]">
						{__('Letter Spacing', 'quillcrm')}
					</div>
					<Select
						value={props.letterSpacing}
						onValueChange={(value) =>
							onChange({ letterSpacing: value })
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
			</div>

			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Text Color', 'quillcrm')}</div>
				<div className="flex items-center gap-2 border rounded-lg px-2">
					<Input
						id="text-color"
						type="text"
						value={props.color}
						onChange={(e) => onChange({ color: e.target.value })}
						className="rounded-lg"
						style={{ border: 0 }}
					/>
					<Input
						type="color"
						value={props.color}
						onChange={(e) => onChange({ color: e.target.value })}
						className="w-10 h-10 p-1 rounded-lg"
						style={{ border: 0 }}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Background Color', 'quillcrm')}</div>
				<div className="flex items-center gap-2 border rounded-lg px-2">
					<Input
						id="bg-color"
						type="text"
						value={props.backgroundColor}
						onChange={(e) =>
							onChange({ backgroundColor: e.target.value })
						}
						className="rounded-lg"
						style={{ border: 0 }}
					/>
					<Input
						type="color"
						value={props.backgroundColor}
						onChange={(e) =>
							onChange({ backgroundColor: e.target.value })
						}
						className="w-10 h-10 p-1 rounded-lg"
						style={{ border: 0 }}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Link Color', 'quillcrm')}</div>
				<div className="flex items-center gap-2 border rounded-lg px-2">
					<Input
						id="link-color"
						type="text"
						value={props.linkColor}
						onChange={(e) =>
							onChange({ linkColor: e.target.value })
						}
						className="rounded-lg"
						style={{ border: 0 }}
					/>
					<Input
						type="color"
						value={props.linkColor}
						onChange={(e) =>
							onChange({ linkColor: e.target.value })
						}
						className="w-10 h-10 p-1 rounded-lg"
						style={{ border: 0 }}
					/>
				</div>
			</div>
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
							value={props.padding?.left || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...(props.padding || {}),
										left: parseInt(e.target.value),
									},
								})
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
							value={props.padding?.right || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...(props.padding || {}),
										right: parseInt(e.target.value),
									},
								})
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
							value={props.padding?.top || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...(props.padding || {}),
										top: parseInt(e.target.value),
									},
								})
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
							value={props.padding?.bottom || 0}
							onChange={(e) =>
								onChange({
									padding: {
										...(props.padding || {}),
										bottom: parseInt(e.target.value),
									},
								})
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
	);
};
