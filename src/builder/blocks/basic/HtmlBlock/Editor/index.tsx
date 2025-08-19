/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { HtmlBlockProps } from '..';

export interface HtmlBlockEditorProps {
	props: HtmlBlockProps;
	onChange: (updates: Partial<HtmlBlockProps>) => void;
}

export const HtmlBlockEditor: React.FC<HtmlBlockEditorProps> = ({
	props,
	onChange,
}) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [tempHtml, setTempHtml] = useState(props.content);
	const [tempCss, setTempCss] = useState(props.customCss);

	const handleSaveDialog = () => {
		onChange({ content: tempHtml, customCss: tempCss });
		setIsDialogOpen(false);
	};

	const handleCancelDialog = () => {
		setTempHtml(props.content);
		setTempCss(props.customCss);
		setIsDialogOpen(false);
	};

	return (
		<div className="grid gap-5">
			{/* HTML Content Dialog */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('HTML Content', 'quillcrm')}</div>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button className="w-full h-10">
							{props.content === ''
								? __('Click to edit HTML content', 'quillcrm')
								: __('Edit HTML content', 'quillcrm')}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-3xl font-bold">
								{__('HTML Editor', 'quillcrm')}
							</DialogTitle>
							<div className="text-sm text-[#333333]">
								{__(
									'Insert here your own html that you want to preview.',
									'quillcrm'
								)}
							</div>
						</DialogHeader>
						<div className="grid gap-4">
							<div className="flex flex-col gap-2 text-[#333333]">
								<label className="text-sm font-medium">
									{__('HTML Content', 'quillcrm')}
								</label>
								<div className="relative flex w-full bg-[#C6DFF3] rounded-lg">
									{/* Line numbers */}
									<pre
										className="select-none text-gray-500 text-xs text-right pr-3 rounded-l-lg pt-2 font-mono leading-5"
										style={{ minWidth: '2rem' }}
									>
										{tempHtml
											.split('\n')
											.map((_, i) => i + 1)
											.join('\n')}
									</pre>

									{/* Textarea */}
									<Textarea
										value={tempHtml}
										onChange={(e) =>
											setTempHtml(e.target.value)
										}
										placeholder="<p>Your HTML content here</p>"
										className="min-h-[200px] font-mono text-sm leading-5 rounded-l-none"
										style={{
											border: 'none',
											outline: 'none',
										}}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2 text-[#333333]">
								<label className="text-sm font-medium">
									{__('Custom CSS (JSON format)', 'quillcrm')}
								</label>
								<div className="relative flex w-full bg-[#C6DFF3] rounded-lg">
									{/* Line numbers */}
									<pre
										className="select-none text-gray-500 text-xs text-right pr-3 rounded-l-lg pt-2 font-mono leading-5"
										style={{ minWidth: '2rem' }}
									>
										{tempCss
											.split('\n')
											.map((_, i) => i + 1)
											.join('\n')}
									</pre>
									<Textarea
										value={tempCss}
										onChange={(e) =>
											setTempCss(e.target.value)
										}
										placeholder='{"color": "#333", "fontSize": "16px"}'
										className="min-h-[200px] font-mono text-sm leading-5 rounded-l-none"
										style={{
											border: 'none',
											outline: 'none',
										}}
									/>
								</div>
								<p className="text-xs text-gray-500">
									{__(
										'Enter CSS properties as JSON object. Example: {"color": "#333", "fontSize": "16px"}',
										'quillcrm'
									)}
								</p>
							</div>
							<div className="flex gap-2 justify-end">
								<Button
									variant="gradient"
									className="w-full"
									onClick={handleSaveDialog}
								>
									{__('Apply The Code', 'quillcrm')}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
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
										top: props.padding?.top || 0,
										right: props.padding?.right || 0,
										bottom: props.padding?.bottom || 0,
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
										top: props.padding?.top || 0,
										right: parseInt(e.target.value),
										bottom: props.padding?.bottom || 0,
										left: props.padding?.left || 0,
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
										top: parseInt(e.target.value),
										right: props.padding?.right || 0,
										bottom: props.padding?.bottom || 0,
										left: props.padding?.left || 0,
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
										top: props.padding?.top || 0,
										right: props.padding?.right || 0,
										bottom: parseInt(e.target.value),
										left: props.padding?.left || 0,
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
