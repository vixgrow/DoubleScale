/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
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
import { DividerBlockProps } from '..';

export interface DividerEditorProps {
	props: DividerBlockProps;
	onChange: (updates: Partial<DividerBlockProps>) => void;
}

export const DividerEditor = ({ props, onChange }: DividerEditorProps) => (
	<div className="grid gap-5">
		{/* Height and Width */}
		<div className="flex gap-3 items-center w-full">
			<div className="flex flex-col gap-1 text-[#333333] w-1/2">
				<label className="text-sm">{__('Height', 'quillcrm')}</label>
				<div className="relative flex items-center">
					<Input
						type="text"
						value={props.height}
						onChange={(e) => onChange({ height: e.target.value })}
						className="pr-8 h-10"
						style={{
							borderColor: '#e5e5e5',
							borderRadius: '0.5rem',
						}}
						placeholder="1"
					/>
					<span className="absolute right-3 text-gray-400">px</span>
				</div>
			</div>
			<div className="flex flex-col gap-1 text-[#333333] w-1/2">
				<label className="text-sm">{__('Width', 'quillcrm')}</label>
				<div className="relative flex items-center">
					<Input
						type="text"
						value={props.width}
						onChange={(e) => onChange({ width: e.target.value })}
						className="pr-8 h-10"
						style={{
							borderColor: '#e5e5e5',
							borderRadius: '0.5rem',
						}}
						placeholder="100"
					/>
					<span className="absolute right-3 text-gray-400">%</span>
				</div>
			</div>
		</div>

		{/* Style */}
		<div className="flex flex-col gap-2 text-[#333333]">
			<div>{__('Style', 'quillcrm')}</div>
			<Select
				value={props.style}
				onValueChange={(value) => onChange({ style: value })}
			>
				<SelectTrigger className="w-full rounded-lg border-border h-10">
					<SelectValue placeholder={__('Select style', 'quillcrm')} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="solid">{__('Solid', 'quillcrm')}</SelectItem>
					<SelectItem value="dashed">{__('Dashed', 'quillcrm')}</SelectItem>
					<SelectItem value="dotted">{__('Dotted', 'quillcrm')}</SelectItem>
					<SelectItem value="double">{__('Double', 'quillcrm')}</SelectItem>
					<SelectItem value="groove">{__('Groove', 'quillcrm')}</SelectItem>
					<SelectItem value="ridge">{__('Ridge', 'quillcrm')}</SelectItem>
					<SelectItem value="inset">{__('Inset', 'quillcrm')}</SelectItem>
					<SelectItem value="outset">{__('Outset', 'quillcrm')}</SelectItem>
				</SelectContent>
			</Select>
		</div>

		{/* Shape and Border Radius */}
		<div className="flex gap-3 items-end w-full">
			<div className="flex flex-col gap-2 text-[#333333] w-2/3">
				<label className="text-sm">{__('Shape', 'quillcrm')}</label>
				<div className="flex items-center justify-between border rounded-lg">
					<div
						className={cn(
							'py-2 px-2 w-full text-center cursor-pointer',
							props.borderRadius === '0' &&
							'bg-[#C6DFF366] border border-primary rounded-lg'
						)}
						onClick={() => onChange({ borderRadius: '0' })}
					>
						<div className="bg-accent py-3 px-5"></div>
					</div>
					<div
						className={cn(
							'py-2 px-2 w-full text-center cursor-pointer',
							props.borderRadius === '8' &&
							'bg-[#C6DFF366] border border-primary rounded-lg'
						)}
						onClick={() => onChange({ borderRadius: '8' })}
					>
						<div className="bg-accent py-3 px-5 rounded-lg"></div>
					</div>
					<div
						className={cn(
							'py-2 px-2 w-full text-center cursor-pointer',
							props.borderRadius === '9999' &&
							'bg-[#C6DFF366] border border-primary rounded-lg'
						)}
						onClick={() => onChange({ borderRadius: '9999' })}
					>
						<div className="bg-accent py-3 px-5 rounded-full"></div>
					</div>
				</div>
			</div>
			<div className="w-1/3">
				<div className="relative flex items-center">
					<Input
						type="text"
						value={props.borderRadius}
						onChange={(e) => onChange({ borderRadius: e.target.value })}
						className="pr-8 h-[43.2px]"
						style={{
							borderColor: '#e5e5e5',
							borderRadius: '0.5rem',
						}}
					/>
					<span className="absolute right-3 text-gray-400">px</span>
				</div>
			</div>
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

		{/* Color */}
		<div className="flex flex-col gap-2 text-[#333333]">
			<div>{__('Color', 'quillcrm')}</div>
			<div className="flex items-center gap-2 border rounded-lg px-2">
				<Input
					id="divider-color"
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

		{/* Background Color */}
		<div className="flex flex-col gap-2 text-[#333333]">
			<div>{__('Background Color', 'quillcrm')}</div>
			<div className="flex items-center gap-2 border rounded-lg px-2">
				<Input
					id="bg-color"
					type="text"
					value={props.backgroundColor}
					onChange={(e) => onChange({ backgroundColor: e.target.value })}
					className="rounded-lg"
					style={{ border: 0 }}
				/>
				<Input
					type="color"
					value={props.backgroundColor}
					onChange={(e) => onChange({ backgroundColor: e.target.value })}
					className="w-10 h-10 p-1 rounded-lg"
					style={{ border: 0 }}
				/>
			</div>
		</div>

		{/* Opacity */}
		<div className="flex flex-col gap-2">
			<div className="text-[#333333]">{__('Opacity', 'quillcrm')}</div>
			<Input
				type="number"
				min="0"
				max="1"
				step="0.1"
				value={props.opacity}
				onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
				className="pr-8 h-10"
				style={{
					borderColor: '#e5e5e5',
					borderRadius: '0.5rem',
				}}
				placeholder="1"
			/>
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
