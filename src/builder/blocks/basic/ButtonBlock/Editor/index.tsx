/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import {
	AlignLeft,
	AlignCenter,
	AlignRight,
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
import { ButtonBlockProps } from '..';

export interface ButtonEditorProps {
	props: ButtonBlockProps;
	onChange: (updates: Partial<ButtonBlockProps>) => void;
}

export const ButtonEditor = ({ props, onChange }: ButtonEditorProps) => {
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('quillcrm/core');

	const handleMergeTagClick = (field: 'text' | 'url') => {
		setMergeTagCallback((tagValue: string) => {
			onChange({ [field]: props[field] + tagValue });
		});
		setMergeTagsVisible(true);
	};

	return (
		<div className="grid gap-5">
			{/* Button Text with Merge Tags */}
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center text-[#333333]">
					<div>{__('Button Text', 'quillcrm')}</div>
					<div
						className="cursor-pointer hover:opacity-80"
						onClick={() => handleMergeTagClick('text')}
					>
						<MergeTagsIcon />
					</div>
				</div>
				<Input
					type="text"
					value={props.text}
					onChange={(e) => onChange({ text: e.target.value })}
					className="pr-8 h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
					placeholder="Click Here"
				/>
			</div>

			{/* Link URL with Merge Tags */}
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center text-[#333333]">
					<div>{__('Link URL', 'quillcrm')}</div>
					<div
						className="cursor-pointer hover:opacity-80"
						onClick={() => handleMergeTagClick('url')}
					>
						<MergeTagsIcon />
					</div>
				</div>
				<Input
					type="text"
					value={props.url}
					onChange={(e) => onChange({ url: e.target.value })}
					className="pr-8 h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
					placeholder="https://example.com"
				/>
			</div>

			{/* Button Style */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Button Style', 'quillcrm')}</div>
				<Select
					value={props.buttonStyle}
					onValueChange={(value) =>
						onChange({
							buttonStyle: value as
								| 'primary'
								| 'secondary'
								| 'tertiary',
						})
					}
				>
					<SelectTrigger className="w-full rounded-lg border-border h-10">
						<SelectValue
							placeholder={__('Select button style', 'quillcrm')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="primary">
							{__('Primary Button', 'quillcrm')}
						</SelectItem>
						<SelectItem value="secondary">
							{__('Secondary Button', 'quillcrm')}
						</SelectItem>
						<SelectItem value="tertiary">
							{__('Tertiary Button', 'quillcrm')}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Alignment */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Alignment on desktop', 'quillcrm')}</div>
				<div className="flex items-center justify-between border rounded-lg">
					<AlignLeft
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.align === 'left' &&
								'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() => onChange({ align: 'left' })}
					/>
					<AlignCenter
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.align === 'center' &&
								'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ align: 'center' })}
					/>
					<AlignRight
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer',
							props.align === 'right' &&
								'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ align: 'right' })}
					/>
					<div
						className={cn(
							'size-12 py-3 px-5 w-full cursor-pointer flex items-center justify-center',
							props.align === 'full' &&
								'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ align: 'full' })}
					>
						<span className="text-sm font-medium">Full</span>
					</div>
				</div>
			</div>

			{/* Colors */}
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
