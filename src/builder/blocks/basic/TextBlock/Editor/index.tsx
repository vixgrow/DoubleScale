/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { Bold, ExternalLink, Italic, Underline } from 'lucide-react';
/**
 * internal dependencies
 */
import { MergeTagsIcon } from '@quillcrm/components';
import { Textarea } from '@/components/ui/textarea';
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

export interface TextEditorProps {
	props: TextBlockProps;
	onChange: (updates: Partial<TextBlockProps>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ props, onChange }) => (
	<div className="grid gap-5">
		<div className="flex flex-col gap-2">
			<div className="flex justify-between items-center text-[#333333]">
				<div>{__('Text Area', 'quillcrm')}</div>
				<MergeTagsIcon />
			</div>
			<Textarea
				value={props.content}
				onChange={(e) => onChange({ content: e.target.value })}
				className="rounded-lg"
			/>
		</div>

		<div className="flex flex-col gap-2">
			<div className="flex justify-between items-center text-[#333333]">
				<div>{__('Button Hyper Link', 'quillcrm')}</div>
				<ExternalLink className="size-5" />
			</div>
			<Input
				type="text"
				value={props.hyperlink}
				onChange={(e) => onChange({ hyperlink: e.target.value })}
				className="rounded-lg"
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
						props.italic && 'bg-[#C6DFF366] border border-primary'
					)}
					onClick={() => onChange({ italic: !props.italic })}
				/>
				<Underline
					className={cn(
						'size-12 py-3 px-5 w-full cursor-pointer',
						props.underline &&
							'bg-[#C6DFF366] border border-primary rounded-r-lg'
					)}
					onClick={() => onChange({ underline: !props.underline })}
				/>
			</div>
		</div>

		<div className="flex gap-3 items-center w-full">
			<div className="flex flex-col gap-2 text-[#333333] w-1/2">
				<div>{__('Font', 'quillcrm')}</div>
				<Select
					value={props.fontFamily}
					onValueChange={(value) => onChange({ fontFamily: value })}
				>
					<SelectTrigger className="w-full rounded-lg">
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
						<SelectItem value="Georgia, serif">Georgia</SelectItem>
						<SelectItem value="'Helvetica Neue', Helvetica, sans-serif">
							Helvetica
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex flex-col gap-2 text-[#333333] w-1/2">
				<div>{__('Size', 'quillcrm')}</div>
				<Input
					type="number"
					value={props.fontSize}
					onChange={(e) =>
						onChange({ fontSize: parseInt(e.target.value) })
					}
					className="rounded-lg"
				/>
			</div>
		</div>

		<div className="flex flex-col gap-2">
			<div className="text-[#333333]">
				{__('Letter Spacing', 'quillcrm')}
			</div>
			<Select
				value={props.letterSpacing}
				onValueChange={(value) => onChange({ letterSpacing: value })}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={__('Select spacing', 'quillcrm')}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="0px">Normal</SelectItem>
					<SelectItem value="0.5px">0.5px</SelectItem>
					<SelectItem value="1px">1px</SelectItem>
					<SelectItem value="1.5px">1.5px</SelectItem>
					<SelectItem value="2px">2px</SelectItem>
					<SelectItem value="3px">3px</SelectItem>
				</SelectContent>
			</Select>
		</div>

		<div className="flex gap-3 items-center w-full">
			<div className="flex flex-col gap-2 text-[#333333] w-2/3">
				<div>{__('Shape', 'quillcrm')}</div>
				<div className="flex items-center justify-between border rounded-lg">
					<div
						className={cn(
							'py-2 px-2 w-full text-center cursor-pointer',
							props.borderRadius === '0px' &&
								'bg-[#C6DFF366] border border-primary rounded-lg'
						)}
						onClick={() => onChange({ borderRadius: '0px' })}
					>
						<div className="bg-accent py-3 px-5"></div>
					</div>
					<div
						className={cn(
							'py-2 px-2 w-full text-center cursor-pointer',
							props.borderRadius === '8px' &&
								'bg-[#C6DFF366] border border-primary rounded-lg'
						)}
						onClick={() => onChange({ borderRadius: '8px' })}
					>
						<div className="bg-accent py-3 px-5 rounded-lg"></div>
					</div>
					<div
						className={cn(
							'py-2 px-2 w-full text-center cursor-pointer',
							props.borderRadius === '9999px' &&
								'bg-[#C6DFF366] border border-primary rounded-lg'
						)}
						onClick={() => onChange({ borderRadius: '9999px' })}
					>
						<div className="bg-accent py-3 px-5 rounded-full"></div>
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-2 text-[#333333] w-1/3">
				<div>{__('Border', 'quillcrm')}</div>
				<div className="relative flex items-center">
					<Input
						type="text"
						value={props.borderWidth}
						onChange={(e) => {
							const val = e.target.value;
							onChange({
								borderWidth:
									val === '' ? '' : parseInt(val, 10),
							});
						}}
						className="pr-8 rounded-lg"
					/>
					<span className="absolute right-3 text-gray-400">px</span>
				</div>
			</div>
		</div>

		<div className="flex flex-col gap-2 text-[#333333]">
			<div>{__('Text Color', 'quillcrm')}</div>
			<Input
				type="color"
				value={props.color}
				onChange={(e) => onChange({ color: e.target.value })}
				className="rounded-lg"
			/>
		</div>

		<div className="flex flex-col gap-2 text-[#333333]">
			<div>{__('Background Color', 'quillcrm')}</div>
			<Input
				type="color"
				value={props.backgroundColor}
				onChange={(e) => onChange({ backgroundColor: e.target.value })}
				className="rounded-lg"
			/>
		</div>

		<div className="flex flex-col gap-2 text-[#333333]">
			<div>{__('Border Color', 'quillcrm')}</div>
			<Input
				type="color"
				value={props.borderColor}
				onChange={(e) => onChange({ borderColor: e.target.value })}
				className="rounded-lg"
			/>
		</div>
	</div>
);
