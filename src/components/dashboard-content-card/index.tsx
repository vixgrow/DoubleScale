/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Link } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { getToLink } from '@doublescale/navigation';
import { cn } from '@/lib/utils';
import ArrowRight from '@doublescale/shared/icons/arrow-rightt';

interface DashboardContentProps {
	title: string;
	children: React.ReactNode;
	headerContent?: React.ReactNode;
	cardClassName?: string;
	/** Merged with CardContent (below header); use for `flex-1` when card should fill grid row height */
	contentClassName?: string;
	viewAllLink?: boolean;
	viewAllLinkUrl?: string;
	dateFilter?: boolean;
	dateFilterComponent?: React.ReactNode;
	cardHeaderClassName?: string;
	headerContentClassName?: string;
}

const DashboardContentCard: React.FC<DashboardContentProps> = ({
	title,
	children,
	headerContent,
	cardClassName,
	contentClassName,
	viewAllLink,
	viewAllLinkUrl,
	dateFilter,
	dateFilterComponent,
	cardHeaderClassName,
	headerContentClassName,
}) => {
	return (
		<Card
			className={cn(
				'rounded-2xl border border-border/50 bg-muted/50 p-6 shadow-none',
				cardClassName
			)}
		>
			<CardHeader className={cn('flex flex-row items-center justify-between gap-3 p-0', cardHeaderClassName)}>
				<CardTitle className="text-xl font-semibold tracking-tight text-[#29292E]">
					{title}
				</CardTitle>
				{headerContent && (
					<div className={cn('text-sm font-medium text-muted-foreground', headerContentClassName)}>
						{headerContent}
					</div>
				)}
				{viewAllLink && viewAllLinkUrl && (
					<div className="flex justify-end">
						<Link
							to={getToLink(viewAllLinkUrl)}
							className="text-[#6549CA] shadow-none text-base leading-7 font-medium bg-transparent hover:bg-transparent p-0 flex items-center gap-1 hover:text-primary/80 transition-colors"
						>
							{__('View All', 'doublescale')}
							<ArrowRight width={24} height={24}  />
						</Link>
					</div>
				)}
				{dateFilter && <div className="w-1/2 flex justify-end">{dateFilterComponent}</div>}
			</CardHeader>
			<CardContent className={cn('mt-6 p-0', contentClassName)}>
				{children}
			</CardContent>
		</Card>
	);
};

export default DashboardContentCard;
