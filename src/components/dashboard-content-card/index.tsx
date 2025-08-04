/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DashboardContentProps {
	title: string;
	children: React.ReactNode;
	headerContent?: React.ReactNode;
	className?: string;
}

const DashboardContentCard: React.FC<DashboardContentProps> = ({
	title,
	children,
	headerContent,
	className,
}) => {
	return (
		<Card className={`shadow-none rounded-lg ${className}`}>
			<CardHeader className="bg-gradient-to-r from-[#C6DFF3] to-[#4090CF] rounded-t-lg p-3 mb-3">
				<div className="flex items-center justify-between w-full">
					<CardTitle className="text-[#333333] font-semibold text-xl">
						{title}
					</CardTitle>
					{headerContent && <div>{headerContent}</div>}
				</div>
			</CardHeader>
			<CardContent className="p-3">{children}</CardContent>
		</Card>
	);
};

export default DashboardContentCard;
