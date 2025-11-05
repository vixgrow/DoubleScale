/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { useState } from 'react';

/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';

export interface HtmlDialogProps {
	content: string;
	customCss: string;
	onSave: (content: string, customCss: string) => void;
	triggerText?: string;
}

export const HtmlDialog: React.FC<HtmlDialogProps> = ({
	content,
	customCss,
	onSave,
	triggerText,
}) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [tempHtml, setTempHtml] = useState(content);
	const [tempCss, setTempCss] = useState(customCss);

	const handleSaveDialog = () => {
		onSave(tempHtml, tempCss);
		setIsDialogOpen(false);
	};

	const handleOpenChange = (open: boolean) => {
		if (open) {
			// Reset temp values when opening
			setTempHtml(content);
			setTempCss(customCss);
		}
		setIsDialogOpen(open);
	};


	return (
		<Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className="w-full h-10">
					{triggerText ||
						(content === ''
							? __('Click to edit HTML content', 'quillcrm')
							: __('Edit HTML content', 'quillcrm'))}
				</Button>
			</DialogTrigger>
			<DialogOverlay />
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
								onChange={(e) => setTempHtml(e.target.value)}
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
							{__('Custom CSS', 'quillcrm')}
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
								onChange={(e) => setTempCss(e.target.value)}
								placeholder=".my-class { color: #333; font-size: 16px; }"
								className="min-h-[200px] font-mono text-sm leading-5 rounded-l-none"
								style={{
									border: 'none',
									outline: 'none',
								}}
							/>
						</div>
						<p className="text-xs text-gray-500">
							{__(
								'Enter CSS with selectors and properties. Example: .my-class { color: #333; font-size: 16px; }',
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
	);
};
