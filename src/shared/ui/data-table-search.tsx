/**
 * external dependencies
 */
import { Search } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableSearchProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function DataTableSearch({
	value,
	onChange,
	placeholder = 'Search...',
	className,
}: DataTableSearchProps) {
	return (
		<div
			className={cn(
				'data-table-search relative w-full min-w-0 sm:flex-1 sm:max-w-xs xl:max-w-sm',
				className
			)}
		>
			<Input
				placeholder={placeholder}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="rounded-lg border-[#E4E4E7]"
			/>
			<Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
		</div>
	);
}
