/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { getToLink, useNavigate } from '@quillcrm/navigation';

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
	const navigate = useNavigate();
	return (
		<Card className={`shadow-none rounded-lg bg-[#F8F8F8] ${cardClassName}`}>
			<CardHeader className={`flex flex-row justify-between items-center p-4`}>
				<div className="flex items-center justify-start gap-2">
					<CardTitle className="text-[#333333] font-medium text-2xl bg-gradient-to-b from-transparent from-50% to-[#458DC7] px-1">
						{title}
					</CardTitle>
					{headerContent && <div className="text-[#7E8299] text-lg font-medium">{headerContent}</div>}
				</div>
				{viewAllLink && (
					<div className="flex justify-end">
						<Button className="text-primary shadow-none text-base bg-transparent hover:bg-transparent p-0" onClick={() => navigate(getToLink(viewAllLinkUrl ?? ''))}>
							{__('View All', 'quillcrm')}
							<ArrowRight className="size-4" />
						</Button>
					</div>
				)}
				{dateFilter && <div className="w-1/2 flex justify-end">{dateFilterComponent}</div>}
			</CardHeader>
			<CardContent className="p-3">{children}</CardContent>
		</Card>
	);
};

export default DashboardContentCard;
