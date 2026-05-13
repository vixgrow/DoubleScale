import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@doublescale/components';

interface NoDataProps {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	onClick?: () => void;
	buttonLabel?: string;
	buttonIcon?: React.ReactNode;
	className?: string;
}

export const NoData: React.FC<NoDataProps> = ({
	icon,
	title,
	subtitle,
	onClick,
	buttonLabel,
	buttonIcon,
	className,
}) => {
	return (
		<div className="flex flex-col items-center justify-center py-20 px-4">
			<div className="flex flex-col items-center max-w-sm text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 mb-5">
					{icon}
				</div>
				<h3 className="text-lg font-semibold text-foreground mb-1.5">
					{title}
				</h3>
				<p className="text-sm text-muted-foreground leading-relaxed mb-6">
					{subtitle}
				</p>
				{onClick && buttonLabel && (
					<Button onClick={onClick} size="default" className={className}>
						{buttonIcon || <PlusIcon />}
						{buttonLabel}
					</Button>
				)}
			</div>
		</div>
	);
};
