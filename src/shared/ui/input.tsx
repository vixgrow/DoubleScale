import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				{...props}
				type={type}
				ref={ref}
				className={cn(
					// Match SelectTrigger layout exactly so inputs and selects look identical.
					'flex h-10 w-full items-center rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground transition-colors',
					// Placeholder
					'placeholder:text-muted-foreground',
					// Focus — use focus: (not focus-visible:) to match SelectTrigger and avoid WP admin overrides.
					'focus:outline-none focus:ring-2 focus:ring-brandPrimary/20 focus:border-brandPrimary',
					// Disabled
					'disabled:cursor-not-allowed disabled:opacity-50',
					// File input internals
					'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
					// Kill WordPress admin's inset box-shadow on <input> elements.
					'shadow-none',
					// Neutralise browser UA chrome for ALL input types (spinners, calendar icons, etc.)
					// so styles always apply uniformly regardless of `type`.
					'appearance-none',
					'[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
					'[&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
					className
				)}
			/>
		);
	}
);
Input.displayName = 'Input';

export { Input };
