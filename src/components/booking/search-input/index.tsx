import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { SearchIcon } from '../icons';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	prefix?: React.ReactNode;
}

const SearchInput: React.FC<SearchInputProps> = ({
	placeholder = 'Search...',
	onChange,
	className = '',
	...rest
}) => {
	return (
		<div className={cn('relative', className)}>
			<span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
				<SearchIcon />
			</span>
			<Input
				className="pl-10 rounded-lg"
				placeholder={placeholder}
				onChange={onChange}
				{...rest}
			/>
		</div>
	);
};

export default SearchInput;
