/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * external dependencies
 */
import { AlignLeft, AlignCenter, AlignRight, ExternalLink } from 'lucide-react';

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
import { DatePicker } from '@/components/ui/date-picker';
import { TimerBlockProps } from '..';

export interface TimerBlockEditorProps {
	props: TimerBlockProps;
	onChange: (updates: Partial<TimerBlockProps>) => void;
}

export const TimerBlockEditor: React.FC<TimerBlockEditorProps> = ({
	props,
	onChange,
}) => {
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('quillcrm/core');

	const handleMergeTagClick = (field: 'link' | 'altText') => {
		setMergeTagCallback((tagValue: string) => {
			onChange({ [field]: props[field] + tagValue });
		});
		setMergeTagsVisible(true);
	};

	// Timezone options
	const timezones = [
		{ value: 'UTC', label: 'UTC' },
		{ value: 'America/New_York', label: 'Eastern Time' },
		{ value: 'America/Chicago', label: 'Central Time' },
		{ value: 'America/Denver', label: 'Mountain Time' },
		{ value: 'America/Los_Angeles', label: 'Pacific Time' },
		{ value: 'Europe/London', label: 'London' },
		{ value: 'Europe/Paris', label: 'Paris' },
		{ value: 'Asia/Tokyo', label: 'Tokyo' },
		{ value: 'Asia/Shanghai', label: 'Shanghai' },
		{ value: 'Australia/Sydney', label: 'Sydney' },
	];

	// Font family options
	const fontFamilies = [
		{ value: 'Arial, sans-serif', label: 'Arial' },
		{ value: 'Helvetica, sans-serif', label: 'Helvetica' },
		{ value: 'Times New Roman, serif', label: 'Times New Roman' },
		{ value: 'Georgia, serif', label: 'Georgia' },
		{ value: 'Verdana, sans-serif', label: 'Verdana' },
		{ value: 'Courier New, monospace', label: 'Courier New' },
		{ value: 'Impact, sans-serif', label: 'Impact' },
		{ value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
	];

	return (
		<div className="grid gap-5">
			{/* Target Date */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Choose a date', 'quillcrm')}
				</label>
				<DatePicker
					value={props.targetDate}
					onChange={(value) => onChange({ targetDate: value })}
					placeholder={__('Select target date', 'quillcrm')}
					className="w-full"
					buttonClassName="w-full justify-between bg-white rounded-lg shadow-none border border-border"
				/>
			</div>

			{/* Time Selection */}
			<div className="flex gap-3 w-full">
				<div className="flex flex-col gap-1 text-[#333333] w-1/2">
					<label className="text-sm">{__('Hours', 'quillcrm')}</label>
					<Select
						value={props.targetHour.toString()}
						onValueChange={(value) =>
							onChange({ targetHour: parseInt(value) })
						}
					>
						<SelectTrigger className="w-full rounded-lg border-border h-10">
							<SelectValue placeholder={__('Hour', 'quillcrm')} />
						</SelectTrigger>
						<SelectContent>
							{Array.from({ length: 24 }, (_, i) => (
								<SelectItem key={i} value={i.toString()}>
									{i.toString().padStart(2, '0')}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1 text-[#333333] w-1/2">
					<label className="text-sm">
						{__('Minutes', 'quillcrm')}
					</label>
					<Select
						value={props.targetMinute.toString()}
						onValueChange={(value) =>
							onChange({ targetMinute: parseInt(value) })
						}
					>
						<SelectTrigger className="w-full rounded-lg border-border h-10">
							<SelectValue
								placeholder={__('Minute', 'quillcrm')}
							/>
						</SelectTrigger>
						<SelectContent>
							{Array.from({ length: 60 }, (_, i) => (
								<SelectItem key={i} value={i.toString()}>
									{i.toString().padStart(2, '0')}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Timezone */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Timezone', 'quillcrm')}</label>
				<Select
					value={props.timezone}
					onValueChange={(value) => onChange({ timezone: value })}
				>
					<SelectTrigger className="w-full rounded-lg border-border h-10">
						<SelectValue
							placeholder={__('Select timezone', 'quillcrm')}
						/>
					</SelectTrigger>
					<SelectContent>
						{timezones.map((tz) => (
							<SelectItem key={tz.value} value={tz.value}>
								{tz.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Width */}
			<div className="flex flex-col gap-1 text-[#333333]">
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

			{/* Link with Merge Tags */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<div className="flex justify-between items-center text-[#333333]">
					<label className="text-sm">
						{__('Link URL', 'quillcrm')}
					</label>
					<ExternalLink className="size-4" />
				</div>
				<Input
					type="text"
					value={props.link}
					onChange={(e) => onChange({ link: e.target.value })}
					className="pr-8 h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
					placeholder="https://example.com"
				/>
			</div>

			{/* Alt Text with Merge Tags */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Alt Text', 'quillcrm')}</label>
				<Input
					type="text"
					value={props.altText}
					onChange={(e) => onChange({ altText: e.target.value })}
					className="pr-8 h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
					placeholder={__('Timer description', 'quillcrm')}
				/>
			</div>

			{/* Timer Background Color */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Timer Background Color', 'quillcrm')}
				</label>
				<div className="flex items-center gap-2 border rounded-lg px-2">
					<Input
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

			{/* Digits Font Family and Size */}
			<div className="flex gap-3 items-center w-full">
				<div className="flex flex-col gap-1 text-[#333333] w-2/3">
					<label className="text-sm">
						{__('Digits Font', 'quillcrm')}
					</label>
					<Select
						value={props.digitsFontFamily}
						onValueChange={(value) =>
							onChange({ digitsFontFamily: value })
						}
					>
						<SelectTrigger className="w-full rounded-lg border-border h-10">
							<SelectValue
								placeholder={__('Select font', 'quillcrm')}
							/>
						</SelectTrigger>
						<SelectContent>
							{fontFamilies.map((font) => (
								<SelectItem key={font.value} value={font.value}>
									{font.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1 text-[#333333] w-1/3">
					<label className="text-sm">{__('Size', 'quillcrm')}</label>
					<Input
						type="number"
						value={props.digitsFontSize}
						onChange={(e) =>
							onChange({
								digitsFontSize: parseInt(e.target.value),
							})
						}
						className="h-10"
						style={{
							borderColor: '#e5e5e5',
							borderRadius: '0.5rem',
						}}
						min="8"
						max="72"
					/>
				</div>
			</div>

			{/* Digits Color */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Digits Color', 'quillcrm')}
				</label>
				<div className="flex items-center gap-2 border rounded-lg px-2">
					<Input
						type="text"
						value={props.digitsColor}
						onChange={(e) =>
							onChange({ digitsColor: e.target.value })
						}
						className="rounded-lg"
						style={{ border: 0 }}
					/>
					<Input
						type="color"
						value={props.digitsColor}
						onChange={(e) =>
							onChange({ digitsColor: e.target.value })
						}
						className="w-10 h-10 p-1 rounded-lg"
						style={{ border: 0 }}
					/>
				</div>
			</div>

			{/* Separator Font Family and Size */}
			<div className="flex gap-3 items-center w-full">
				<div className="flex flex-col gap-1 text-[#333333] w-2/3">
					<label className="text-sm">
						{__('Separator Font', 'quillcrm')}
					</label>
					<Select
						value={props.separatorFontFamily}
						onValueChange={(value) =>
							onChange({ separatorFontFamily: value })
						}
					>
						<SelectTrigger className="w-full rounded-lg border-border h-10">
							<SelectValue
								placeholder={__('Select font', 'quillcrm')}
							/>
						</SelectTrigger>
						<SelectContent>
							{fontFamilies.map((font) => (
								<SelectItem key={font.value} value={font.value}>
									{font.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1 text-[#333333] w-1/3">
					<label className="text-sm">{__('Size', 'quillcrm')}</label>
					<Input
						type="number"
						value={props.separatorFontSize}
						onChange={(e) =>
							onChange({
								separatorFontSize: parseInt(e.target.value),
							})
						}
						className="h-10"
						style={{
							borderColor: '#e5e5e5',
							borderRadius: '0.5rem',
						}}
						min="8"
						max="72"
					/>
				</div>
			</div>

			{/* Separator Color */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Separator Color', 'quillcrm')}
				</label>
				<div className="flex items-center gap-2 border rounded-lg px-2">
					<Input
						type="text"
						value={props.separatorColor}
						onChange={(e) =>
							onChange({ separatorColor: e.target.value })
						}
						className="rounded-lg"
						style={{ border: 0 }}
					/>
					<Input
						type="color"
						value={props.separatorColor}
						onChange={(e) =>
							onChange({ separatorColor: e.target.value })
						}
						className="w-10 h-10 p-1 rounded-lg"
						style={{ border: 0 }}
					/>
				</div>
			</div>

			{/* Alignment */}
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Alignment', 'quillcrm')}</label>
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
								'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ align: 'right' })}
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
