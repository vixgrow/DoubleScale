/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Textarea } from '@/components/ui/textarea';
import { HtmlBlockIcon } from '@doublescale/components';

export interface HtmlCodeSectionsProps {
	content: string;
	customCss: string;
	onContentChange: (content: string) => void;
	onCustomCssChange: (customCss: string) => void;
}

const sectionLabelClass =
	'text-sm font-medium uppercase tracking-wide text-white';

/** One vertical scrollbar on the shell; textarea does not scroll on Y. */
const scrollShellClass =
	'custom-scrollbar flex max-h-[min(40vh,280px)] min-h-[140px] items-start overflow-x-hidden overflow-y-auto rounded-lg font-mono text-sm leading-6 shadow-inner';

function LineNumbers({ lineCount }: { lineCount: number }) {
	const text = Array.from({ length: lineCount }, (_, i) =>
		String(i + 1)
	).join('\n');
	return (
		<pre
			className="w-9 shrink-0 select-none bg-transparent py-2 pl-1 pr-2 text-right text-xs leading-6 text-white"
			aria-hidden
		>
			{text}
		</pre>
	);
}

function CodeField({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) {
	const rawLines = value === '' ? 1 : value.split('\n').length;
	const rows = Math.max(8, rawLines);

	return (
		<div className="flex flex-col gap-2 text-white">
			<label className={sectionLabelClass}>{label}</label>
			<div className={scrollShellClass}
			style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
			>
				<LineNumbers lineCount={rows} />
				<Textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					spellCheck={false}
					rows={rows}
					className="!min-h-0 min-w-0 flex-1 resize-none overflow-x-auto overflow-y-hidden whitespace-pre border-0 bg-transparent px-2 py-2 leading-6 text-white shadow-none outline-none ring-0 placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0 [scrollbar-width:thin]"
				/>
			</div>
		</div>
	);
}

export const HtmlCodeSections: React.FC<HtmlCodeSectionsProps> = ({
	content,
	customCss,
	onContentChange,
	onCustomCssChange,
}) => {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center gap-2 border-b border-white/10 pb-3">
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
					<HtmlBlockIcon width={20} height={20} />
				</span>
				<h3 className="text-base font-semibold text-white">
					{__('HTML Settings', 'doublescale')}
				</h3>
			</div>

			<CodeField
				label={__('HTML Content', 'doublescale')}
				value={content}
				onChange={onContentChange}
				placeholder={__('<p>Your HTML here</p>', 'doublescale')}
			/>

			<CodeField
				label={__('CSS', 'doublescale')}
				value={customCss}
				onChange={onCustomCssChange}
				placeholder={__('.my-class { color: #333; }', 'doublescale')}
			/>
		</div>
	);
};
