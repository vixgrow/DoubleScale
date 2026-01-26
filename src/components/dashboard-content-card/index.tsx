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
import { ArrowRight } from 'lucide-react';
import { getToLink } from '@quillcrm/navigation';

interface DashboardContentProps {
	title: string;
	children: React.ReactNode;
	headerContent?: React.ReactNode;
	cardClassName?: string;
	viewAllLink?: boolean;
	viewAllLinkUrl?: string;
	dateFilter?: boolean;
	dateFilterComponent?: React.ReactNode;
}

const DashboardContentCard: React.FC<DashboardContentProps> = ({
	title,
	children,
	headerContent,
	cardClassName,
	viewAllLink,
	viewAllLinkUrl,
	dateFilter,
	dateFilterComponent,
}) => {
	return (
		<Card className={`shadow-none rounded-lg bg-[#F8F8F8] ${cardClassName}`}>
			<CardHeader className={`flex flex-row justify-between items-center px-5 pt-5 pb-0`}>
				{/* <div className="flex items-center justify-between gap-2"> */}
				<CardTitle className="text-[#333333] font-medium text-2xl">
					{title}
				</CardTitle>
				{headerContent && <div className="text-[#7E8299] text-lg font-medium">{headerContent}</div>}
				{/* </div> */}
				{viewAllLink && viewAllLinkUrl && (
					<div className="flex justify-end">
						<Link
							to={getToLink(viewAllLinkUrl)}
							className="text-primary shadow-none text-base bg-transparent hover:bg-transparent p-0 flex items-center gap-1 hover:text-primary/80 transition-colors"
						>
							{__('View All', 'quillcrm')}
							<ArrowRight className="size-4" />
						</Link>
					</div>
				)}
				{dateFilter && <div className="w-1/2 flex justify-end">{dateFilterComponent}</div>}
			</CardHeader>
			<CardContent className="p-5">{children}</CardContent>
		</Card>
	);
};

export default DashboardContentCard;
