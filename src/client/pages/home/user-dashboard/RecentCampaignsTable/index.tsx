/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { isEmpty } from 'lodash';
/**
 * internal dependencies
 */
import {
	DashboardContentCard,
	ThreeDotsIcon,
	TimeAgoCell,
} from '@doublescale/components';
import { getToLink, useNavigate } from '@doublescale/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@doublescale/components/ui/table';
import type { DashboardData } from '@doublescale/client';
import { EmptyState } from '../../no-data';
import { Button } from '@doublescale/components/ui/button';

interface RecentCampaignsTableProps {
	campaigns: DashboardData['top_campaigns'];
}

export const RecentCampaignsTable: React.FC<RecentCampaignsTableProps> = ({
	campaigns,
}) => {
	const navigate = useNavigate();
	return (
		<DashboardContentCard
			title={__('Recent Campaigns', 'doublescale')}
			cardClassName="w-full max-h-[420px] overflow-y-auto"
			viewAllLink={true}
			viewAllLinkUrl="campaigns"
		>
			{isEmpty(campaigns) ? (
				<EmptyState />
			) : (
				<div>
					<Table className="border">
						<TableHeader className="bg-[#DEE1E666]">
							<TableRow>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('ID', 'doublescale')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Title', 'doublescale')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Status', 'doublescale')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Created At', 'doublescale')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Recipients', 'doublescale')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Action', 'doublescale')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="bg-white">
							{campaigns.map((campaign, index) => (
								<TableRow key={campaign.id}>
									<TableCell className="text-[#A1A5B7] text-sm font-semibold">
										{index + 1}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{campaign.name}
									</TableCell>
									<TableCell>
										<span
											className={`px-3 py-1 border rounded text-sm font-normal ${
												campaign.status === 'completed'
													? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
													: 'bg-[#F8F8F8] text-gray-500 border-gray-500'
											}`}
										>
											{campaign.status === 'completed'
												? 'Completed'
												: 'Draft'}
										</span>
									</TableCell>
									<TableCell className="text-[#A1A5B7] font-semibold text-sm">
										<TimeAgoCell
											value={campaign.created_at}
										/>
									</TableCell>
									<TableCell className="text-[#A1A5B7] font-semibold text-sm">
										{campaign.contacts_count || 0}
									</TableCell>
									<TableCell>
										<Button
											className="h-6 w-6 bg-accent text-[#1E2125] rounded-lg p-0 hover:bg-accent focus-visible:border-none focus-visible:outline-none focus-visible:box-shadow-none focus-visible:ring-0"
											onClick={() =>
												navigate(
													getToLink(
														`campaigns/${campaign.id}/overview`
													)
												)
											}
										>
											<ThreeDotsIcon />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</DashboardContentCard>
	);
};
