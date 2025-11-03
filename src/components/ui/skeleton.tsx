import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 relative overflow-hidden',
				className
			)}
			{...props}
		>
			<div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
		</div>
	);
}

export { Skeleton };
