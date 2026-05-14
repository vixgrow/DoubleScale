/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import { useRef } from 'react';
import { MerageTagsIcon } from '@doublescale/components';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const defaultDarkInputClassName =
	'h-10 !text-white !border-none !ring-0 !ring-offset-0 !rounded-lg placeholder:!text-white/50';

const defaultInputStyle: React.CSSProperties = {
	backgroundColor: 'rgba(255, 255, 255, 0.05)',
};

/** Use with `rootClassName="text-foreground"` when `LinkInput` sits on a light popover/panel. */
export const linkInputLightPanelInputClassName =
	'h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm !text-foreground shadow-none ring-offset-background placeholder:!text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-brandPrimary';

export interface LinkInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	/** Merged onto the `<Input />`. Defaults to dark-panel (white) styling; override for light backgrounds. */
	className?: string;
	style?: React.CSSProperties;
	/** Merged onto the outer wrapper; default is `text-white`. Pass e.g. `text-foreground` on white popovers. */
	rootClassName?: string;
	/** Merged onto the `<label />`. */
	labelClassName?: string;
	/** Merged onto the merge-tags trigger wrapper. */
	mergeTriggerClassName?: string;
}

export const LinkInput: React.FC<LinkInputProps> = ({
	label,
	value,
	onChange,
	placeholder = 'https://example.com',
	className,
	style,
	rootClassName,
	labelClassName,
	mergeTriggerClassName,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const { setMergeTagsVisible, setMergeTagCallback } = useDispatch(
		'doublescale/core'
	);

	const inputClassName =
		className !== undefined ? className : defaultDarkInputClassName;
	const mergedInputStyle = { ...defaultInputStyle, ...style };

	const handleChange = (inputValue: string) => {
		if (!inputValue.trim()) {
			onChange(inputValue);
			return;
		}

		const hasProtocol = /^https?:\/\//i.test(inputValue);
		const isMergeTag =
			inputValue.startsWith('{{') && inputValue.endsWith('}}');

		const processedValue =
			hasProtocol || isMergeTag ? inputValue : `https://${inputValue}`;

		onChange(processedValue);
	};

	const handleMergeTagClick = () => {
		setMergeTagCallback((tagValue: string) => {
			const inputElement = inputRef.current;
			if (!inputElement) {
				onChange(tagValue);
				return;
			}

			const { value: currentValue } = inputElement;
			const selectionStart =
				inputElement.selectionStart ?? currentValue.length;
			const selectionEnd =
				inputElement.selectionEnd ?? currentValue.length;

			const newValue =
				currentValue.slice(0, selectionStart) +
				tagValue +
				currentValue.slice(selectionEnd);

			onChange(newValue);

			requestAnimationFrame(() => {
				inputElement.focus();
				const newPosition = selectionStart + tagValue.length;
				inputElement.setSelectionRange(newPosition, newPosition);
			});
		});

		setMergeTagsVisible(true);
	};

	return (
		<div
			className={cn(
				'flex flex-col gap-2',
				rootClassName === undefined ? 'text-white' : rootClassName
			)}
		>
			<div className="flex items-center justify-between">
				<label className={cn('text-sm', labelClassName)}>{label}</label>
				<div
					className={cn(
						'cursor-pointer hover:opacity-80',
						mergeTriggerClassName
					)}
					onClick={handleMergeTagClick}
					title={__('Insert Merge Tag', 'doublescale')}
				>
					<MerageTagsIcon />
				</div>
			</div>
			<Input
				type="text"
				ref={inputRef}
				value={value}
				onChange={(e) => handleChange(e.target.value)}
				className={inputClassName}
				style={mergedInputStyle}
				placeholder={placeholder}
			/>
		</div>
	);
};
