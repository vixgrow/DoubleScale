/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
/**
 * external dependencies
 */
import React, { useState } from 'react';
/**
 * internal dependencies
 */
import {
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export interface TextBlockAiPopoverPanelProps {
	onApplyContent: (html: string) => void;
	onClose: () => void;
}

/** Must be rendered inside `<Popover>` (same tree as `TextBlockAiTrigger`). */
export const TextBlockAiPopoverPanel: React.FC<TextBlockAiPopoverPanelProps> = ({
	onApplyContent,
	onClose,
}) => {
	const [prompt, setPrompt] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGenerate = async () => {
		const trimmed = prompt.trim();
		if (trimmed.length < 3) {
			setError(__('Please enter at least 3 characters.', 'doublescale'));
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const response = await apiFetch<{
				success?: boolean;
				text?: string;
			}>({
				path: '/doublescale/v1/ai/generate-text',
				method: 'POST',
				data: {
					prompt: trimmed,
					context: __(
						'Output HTML suitable for an email text block (paragraphs, lists, links). Keep it concise and on-brand.',
						'doublescale'
					),
					tone: 'professional',
					include_subject: false,
					use_merge_tags: true,
				},
			});
			if (response?.text) {
				onApplyContent(response.text);
				onClose();
			} else {
				setError(
					__(
						'No text was returned. Try a different prompt.',
						'doublescale'
					)
				);
			}
		} catch (err: unknown) {
			const anyErr = err as {
				message?: string;
				data?: { message?: string };
			};
			const msg =
				anyErr?.data?.message ||
				anyErr?.message ||
				__(
					'Something went wrong. Check AI settings and try again.',
					'doublescale'
				);
			setError(
				typeof msg === 'string' ? msg : __('Generation failed.', 'doublescale')
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<PopoverContent
			className="w-96 max-w-none border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
			align="start"
			side="bottom"
			sideOffset={8}
			onClick={(e) => e.stopPropagation()}
			onCloseAutoFocus={(e) => e.preventDefault()}
		>
			<div className="flex flex-col gap-3">
				<div className="text-sm font-semibold text-slate-900">
					{__('AI Generate', 'doublescale')}
				</div>
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="ds-text-ai-prompt"
						className="text-xs font-medium text-slate-700"
					>
						{__('Describe the text you want', 'doublescale')}
						<span className="text-red-500" aria-hidden>
							{' '}
							*
						</span>
					</label>
					<textarea
						id="ds-text-ai-prompt"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						rows={4}
						disabled={loading}
						placeholder={__(
							'E.g., Write a welcome paragraph for new subscribers…',
							'doublescale'
						)}
						className="min-h-[96px] w-full resize-y rounded-lg border border-slate-200 px-2.5 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-60"
					/>
				</div>
				{error ? (
					<p className="text-xs text-red-600" role="alert">
						{error}
					</p>
				) : null}
				<div className="flex justify-end">
					<Button
						variant="default"
						size="sm"
						disabled={loading || prompt.trim().length < 3}
						className="disabled:opacity-50"
						onClick={handleGenerate}
					>
						{loading
							? __('Generating…', 'doublescale')
							: __('Generate', 'doublescale')}
					</Button>
				</div>
			</div>
		</PopoverContent>
	);
};

const TextBlockAiToolbarIcon: React.FC = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={24}
		height={24}
		viewBox="0 0 24 24"
		fill="none"
		className="h-6 w-6 shrink-0"
		aria-hidden
	>
		<path
			d="M16.1427 6.55569C16.079 6.39085 16.1597 6.20327 16.3265 6.13942L17.7197 5.59753L18.2597 4.20434C18.2934 4.12191 18.3591 4.05446 18.4434 4.02244C18.4827 4.00691 18.5247 3.9993 18.5669 4.00005C18.6091 4.0008 18.6507 4.00988 18.6894 4.02679C18.7281 4.04369 18.7631 4.06808 18.7923 4.09856C18.8215 4.12903 18.8444 4.16498 18.8597 4.20434L19.4016 5.59753L20.7946 6.13942C20.8791 6.17125 20.9447 6.23871 20.9784 6.32132C21.0423 6.48805 20.9596 6.67374 20.7946 6.73948L19.4016 7.28137L18.8597 8.67249C18.8442 8.71426 18.8199 8.75225 18.7885 8.78394C18.7572 8.81562 18.7194 8.84028 18.6778 8.85627C18.598 8.88728 18.5091 8.88535 18.4307 8.85089C18.3523 8.81643 18.2908 8.75227 18.2597 8.67249L17.7197 7.28137L16.3265 6.73948C16.2847 6.7233 16.2469 6.69859 16.2152 6.66695C16.1836 6.63531 16.1589 6.59741 16.1427 6.55569ZM11.3621 18.3261C11.4258 18.491 11.345 18.6785 11.1783 18.7424L9.787 19.2843L9.24511 20.6775C9.2286 20.7188 9.20377 20.7563 9.17215 20.7876C9.14053 20.8189 9.1028 20.8433 9.06132 20.8594C9.02206 20.8749 8.98011 20.8825 8.9379 20.8818C8.89568 20.881 8.85403 20.8719 8.81534 20.855C8.77665 20.8381 8.74169 20.8137 8.71247 20.7833C8.68324 20.7528 8.66033 20.7168 8.64505 20.6775L8.10316 19.2843L6.71015 18.7424C6.66843 18.7262 6.63054 18.7015 6.5989 18.6699C6.56725 18.6382 6.54255 18.6003 6.52636 18.5586C6.46251 18.3938 6.54512 18.2062 6.71015 18.1423L8.10316 17.6004L8.64505 16.2074C8.66094 16.1661 8.68534 16.1285 8.71668 16.0972C8.74801 16.0658 8.78558 16.0414 8.82694 16.0255C8.86634 16.01 8.90842 16.0024 8.95077 16.0031C8.99312 16.0038 9.03491 16.0129 9.07375 16.0298C9.1126 16.0467 9.14773 16.071 9.17713 16.1015C9.20653 16.132 9.22963 16.168 9.24511 16.2074L9.787 17.6004L11.1783 18.1423C11.2626 18.1744 11.3301 18.2418 11.3621 18.3261ZM16.8714 10.9985C16.8714 11.1716 16.7664 11.3255 16.6054 11.389L13.7955 12.4803L12.7017 15.2902C12.6819 15.3415 12.6521 15.3885 12.6141 15.4283C12.5762 15.4681 12.5307 15.5 12.4803 15.5222C12.43 15.5445 12.3758 15.5565 12.3208 15.5577C12.2658 15.5589 12.211 15.5493 12.1598 15.5293C12.1057 15.5079 12.0565 15.4756 12.0154 15.4344C11.9742 15.3933 11.9419 15.3441 11.9205 15.29L10.8291 12.4801L8.01922 11.389C7.91606 11.3483 7.83309 11.2686 7.78832 11.1671C7.74356 11.0657 7.74061 10.9507 7.78011 10.8471C7.80125 10.7928 7.83343 10.7435 7.87463 10.7023C7.91582 10.6611 7.96512 10.6289 8.01941 10.6078L10.8293 9.51412L11.9207 6.7067C11.9611 6.60281 12.0412 6.51925 12.1433 6.47437C12.2454 6.4295 12.3611 6.42699 12.465 6.4674C12.519 6.48862 12.5679 6.52087 12.6087 6.56208C12.6494 6.60328 12.6812 6.65254 12.7019 6.7067L13.7955 9.51412L16.6054 10.6078C16.6836 10.639 16.7507 10.6928 16.7981 10.7624C16.8455 10.832 16.871 10.9142 16.8714 10.9985ZM18.9336 15.8336L18.0626 16.1722L17.724 17.0432C17.7124 17.0727 17.6922 17.098 17.666 17.1158C17.6398 17.1336 17.6089 17.1432 17.5772 17.1432C17.5455 17.1432 17.5145 17.1336 17.4884 17.1158C17.4622 17.098 17.442 17.0727 17.4303 17.0432L17.0916 16.1722L16.2215 15.8336C16.192 15.822 16.1667 15.8018 16.1489 15.7756C16.1311 15.7494 16.1215 15.7185 16.1215 15.6868C16.1215 15.6551 16.1311 15.6241 16.1489 15.598C16.1667 15.5718 16.192 15.5515 16.2215 15.5399L17.0916 15.2013L17.4303 14.3303C17.4384 14.3101 17.4506 14.2918 17.4661 14.2765C17.4816 14.2612 17.5 14.2492 17.5203 14.2413C17.5395 14.2337 17.5601 14.2299 17.5807 14.2303C17.6014 14.2306 17.6218 14.2351 17.6407 14.2434C17.6597 14.2516 17.6768 14.2636 17.6911 14.2785C17.7054 14.2934 17.7166 14.3111 17.724 14.3303L18.0626 15.2013L18.9336 15.5399C18.9632 15.5515 18.9886 15.5717 19.0064 15.5979C19.0243 15.6241 19.0339 15.655 19.0339 15.6868C19.0339 15.7185 19.0243 15.7495 19.0064 15.7757C18.9886 15.8019 18.9632 15.8221 18.9336 15.8336ZM5.40108 9.83376C5.36182 9.84929 5.31988 9.8569 5.27766 9.85616C5.23545 9.85541 5.1938 9.84632 5.15511 9.82942C5.11642 9.81251 5.08145 9.78812 5.05223 9.75765C5.023 9.72718 5.00009 9.69123 4.98481 9.65187L4.48612 8.36952L3.20528 7.87272C3.16374 7.85623 3.126 7.83143 3.09439 7.79982C3.06279 7.76821 3.03798 7.73048 3.02149 7.68893C2.95783 7.5239 3.04044 7.33651 3.20528 7.27266L4.48612 6.77378L4.98481 5.49332C5.00069 5.45142 5.02528 5.41337 5.05696 5.38168C5.08865 5.35 5.1267 5.32541 5.1686 5.30953C5.33344 5.24568 5.51912 5.32829 5.58487 5.49332L6.08167 6.77378L7.36421 7.27266C7.42452 7.29632 7.47629 7.3376 7.51278 7.39112C7.54928 7.44464 7.5688 7.50791 7.5688 7.57269C7.5688 7.63747 7.54928 7.70074 7.51278 7.75426C7.47629 7.80778 7.42452 7.84906 7.36421 7.87272L6.08167 8.36952L5.58487 9.65206C5.56837 9.69337 5.54353 9.73084 5.51191 9.76214C5.48029 9.79343 5.44256 9.81769 5.40108 9.83376Z"
			fill="#0D9DFC"
		/>
	</svg>
);

/** Toolbar AI control; must sit inside `<Popover>`. */
export const TextBlockAiTrigger: React.FC = () => (
	<PopoverTrigger asChild>
		<button
			type="button"
			className="flex cursor-default items-center border-r border-border pr-2"
			aria-label={__('AI Generate', 'doublescale')}
			title={__('AI Generate', 'doublescale')}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<TextBlockAiToolbarIcon />
		</button>
	</PopoverTrigger>
);
