import React from 'react';

import { cn } from '@/lib/utils';

interface MessageStatsCardProps {
	icon: React.ReactNode;
	value: string | number;
	label: string;
	percentage?: number;
	iconBgClass?: string;
	borderColorClass?: string;
	className?: string;
	iconColor?: string;
	/** Vertical analytics layout: icon on top, label, then value */
	layout?: 'default' | 'centered';
}

export const MessageStatsCard: React.FC<MessageStatsCardProps> = ({
	icon,
	value,
	label,
	percentage,
	iconBgClass = 'bg-primary/10',
	borderColorClass = '',
	className = '',
	iconColor = 'text-primary',
	layout = 'default',
}) => {
	if (layout === 'centered') {
		return (
			<div
				className={cn(
					'flex flex-1 flex-col gap-3 items-center rounded-xl border border-[#D0D0D0] bg-card p-3.5 text-center transition-all',
					borderColorClass,
					className
				)}
			>
				<div
					className={cn(
						iconBgClass,
						'flex p-1.5 shrink-0 items-center justify-center rounded-full',
						iconColor
					)}
				>
					{icon}
				</div>
				<span className="whitespace-nowrap text-[16px] leading-5 text-[#6B6C76]">
					{label}
				</span>
				<div className="flex items-baseline justify-center gap-2">
					<span className="text-xl leading-7 font-bold tabular-nums text-[#29292E]">
						{value}
					</span>
					{percentage !== undefined && (
						<span className="text-xs font-medium text-muted-foreground">
							{percentage}%
						</span>
					)}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'flex-1 rounded-xl border border-border/60 bg-card p-5 transition-all hover:shadow-sm',
				borderColorClass,
				className
			)}
		>
			<div className="flex items-start justify-between">
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium text-muted-foreground">
						{label}
					</span>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-bold text-foreground">
							{value}
						</span>
						{percentage !== undefined && (
							<span className="text-xs font-medium text-muted-foreground">
								{percentage}%
							</span>
						)}
					</div>
				</div>
				<div
					className={cn(
						iconBgClass,
						'flex h-10 w-10 items-center justify-center rounded-lg',
						iconColor
					)}
				>
					{icon}
				</div>
			</div>
		</div>
	);
};
