import * as React from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

export interface MultiSelectOption {
	label: string;
	value: string;
}

interface MultiSelectProps {
	options: MultiSelectOption[];
	selected: MultiSelectOption[];
	onChange: (selected: MultiSelectOption[]) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	isLoading?: boolean;
	onSearchChange?: (search: string) => void;
	searchPlaceholder?: string;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
	(
		{
			options,
			selected,
			onChange,
			placeholder = 'Select options...',
			className,
			disabled = false,
			isLoading = false,
			onSearchChange,
			searchPlaceholder = 'Search...',
		},
		ref
	) => {
		const [open, setOpen] = React.useState(false);

		const handleUnselect = (option: MultiSelectOption) => {
			onChange(selected.filter((s) => s.value !== option.value));
		};

		const handleSelect = (option: MultiSelectOption) => {
			const isSelected = selected.some((s) => s.value === option.value);
			if (isSelected) {
				onChange(selected.filter((s) => s.value !== option.value));
			} else {
				onChange([...selected, option]);
			}
		};

		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						ref={ref}
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className={cn(
							'w-full justify-between text-left font-normal h-12 bg-white',
							!selected.length && 'text-muted-foreground',
							className
						)}
						disabled={disabled}
					>
						<div className="flex flex-wrap gap-1 max-w-full">
							{selected.length > 0 ? (
								selected.length <= 2 ? (
									selected.map((option) => (
										<Badge
											variant="secondary"
											key={option.value}
											className="mr-1 mb-1"
											onClick={(e) => {
												e.stopPropagation();
												handleUnselect(option);
											}}
										>
											{option.label}
											<X className="ml-1 h-3 w-3 cursor-pointer" />
										</Badge>
									))
								) : (
									<>
										<Badge
											variant="secondary"
											className="mr-1 mb-1"
										>
											{selected[0].label}
											<X
												className="ml-1 h-3 w-3 cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													handleUnselect(selected[0]);
												}}
											/>
										</Badge>
										<Badge
											variant="secondary"
											className="mr-1 mb-1"
										>
											+{selected.length - 1} more
										</Badge>
									</>
								)
							) : (
								placeholder
							)}
						</div>
						<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command>
						{onSearchChange && (
							<CommandInput
								placeholder={searchPlaceholder}
								onValueChange={onSearchChange}
							/>
						)}
						<CommandList>
							{isLoading ? (
								<CommandEmpty>Loading...</CommandEmpty>
							) : options.length === 0 ? (
								<CommandEmpty>No options found.</CommandEmpty>
							) : (
								<CommandGroup>
									{options.map((option) => {
										const isSelected = selected.some(
											(s) => s.value === option.value
										);
										return (
											<CommandItem
												key={option.value}
												onSelect={() =>
													handleSelect(option)
												}
											>
												<Check
													className={cn(
														'mr-2 h-4 w-4',
														isSelected
															? 'opacity-100'
															: 'opacity-0'
													)}
												/>
												{option.label}
											</CommandItem>
										);
									})}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		);
	}
);

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
