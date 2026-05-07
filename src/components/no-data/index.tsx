/**
 * External dependencies
 */
import React from 'react';
/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@doublescale/components';

interface NoDataProps {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	onClick?: () => void;
	buttonLabel?: string;
	buttonIcon?: React.ReactNode;
}

export const NoData: React.FC<NoDataProps> = ({
	icon,
	title,
	subtitle,
	onClick,
	buttonLabel,
	buttonIcon,
}) => {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<div className="flex flex-col items-center space-y-4">
				{icon}
				<div className="text-center space-y-2">
					<h3 className="text-xl font-semibold text-[#09090B]">
						{title}
					</h3>
					<p className="text-base text-gray-500 font-medium">
						{subtitle}
					</p>
				</div>
				{onClick && buttonLabel && (
					<Button onClick={onClick} className="mt-4">
						{buttonIcon || <PlusIcon />}
						{buttonLabel}
					</Button>
				)}
			</div>
		</div>
	);
};
