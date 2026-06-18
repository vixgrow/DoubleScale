import React from 'react';
import { IoSearchOutline } from 'react-icons/io5';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SearchInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
	prefix?: React.ReactNode;
	iconSize?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
	placeholder = 'Search...',
	onChange,
	className = '',
	prefix,
	iconSize = 20,
	...rest
}) => {
	return (
		<div
			className={cn(
				'flex h-10 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-brandPrimary/20 focus-within:border-brandPrimary',
				className
			)}
		>
			<span className="pointer-events-none shrink-0 text-muted-foreground">
				{prefix ?? <IoSearchOutline size={iconSize} />}
			</span>
			<Input
				className="h-full min-w-0 flex-1 !border-0 !bg-transparent px-0 shadow-none focus:border-transparent focus:ring-0"
				placeholder={placeholder}
				onChange={onChange}
				{...rest}
			/>
		</div>
	);
};

export default SearchInput;
