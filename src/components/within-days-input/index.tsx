/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WithinDaysInputProps {
	value: unknown;
	onChange: (value: string) => void;
	className?: string;
}

/**
 * Keep only a positive integer so leftover calendar dates are not shown
 * when the operator switches to Within.
 */
export const toDaysInputValue = (value: unknown): string => {
	if (value === null || value === undefined || value === '') {
		return '';
	}
	if (Array.isArray(value)) {
		return '';
	}
	const raw = String(value).trim();
	if (!/^\d+$/.test(raw)) {
		return '';
	}
	const days = Number(raw);
	if (!Number.isFinite(days) || days < 1) {
		return '';
	}
	return raw;
};

const WithinDaysInput = ({
	value,
	onChange,
	className,
}: WithinDaysInputProps) => {
	return (
		<div className="flex min-w-0 w-full items-center gap-2">
			<Input
				type="number"
				min={1}
				max={3650}
				value={toDaysInputValue(value)}
				onChange={(event) => onChange(event.target.value)}
				placeholder={__('e.g. 14', 'doublescale')}
				className={cn(
					'!rounded-lg !border-border h-12 min-w-0 flex-1',
					className
				)}
				aria-label={__('Number of days', 'doublescale')}
			/>
			<span className="shrink-0 text-sm text-muted-foreground">
				{__('days', 'doublescale')}
			</span>
		</div>
	);
};

export default WithinDaysInput;
