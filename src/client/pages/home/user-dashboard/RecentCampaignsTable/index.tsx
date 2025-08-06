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
	ManageIcon,
	OutlineReportsIcon,
	TimeAgoCell,
} from '@quillcrm/components';
import { NavLink } from '@quillcrm/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@quillcrm/components/ui/table';
import type { DashboardData } from '@quillcrm/client';
import { EmptyState } from '../../no-data';

interface RecentCampaignsTableProps {
	campaigns: DashboardData['top_campaigns'];
}

export const RecentCampaignsTable: React.FC<RecentCampaignsTableProps> = ({
	campaigns,
}) => {
	return (
		<DashboardContentCard
			title={__('Recent Automations', 'quillcrm')}
			className="w-2/3"
		>
			{isEmpty(campaigns) ? (
				<EmptyState />
			) : (
				<div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('ID', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Title', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Status', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Labels', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Created At', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Recipients', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Action', 'quillcrm')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{campaigns.map((campaign, index) => (
								<TableRow key={campaign.id}>
									<TableCell className="text-[#A1A5B7] text-sm font-semibold">
										{index + 1}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{campaign.name}
									</TableCell>
									<TableCell>
										<div
											className={`text-sm w-fit capitalize rounded-lg py-1 px-3 ${campaign.status == 'archived' ? 'text-[#50CD89] bg-[#E2FFEF]' : 'bg-[#EBEBEB] text-[#616161]'}`}
										>
											{campaign.status}
										</div>
									</TableCell>
									<TableCell className="text-[#A1A5B7] font-semibold text-sm">
										Labels
									</TableCell>
									<TableCell className="text-[#A1A5B7] font-semibold text-sm">
										<TimeAgoCell
											value={campaign.created_at}
										/>
									</TableCell>
									<TableCell className="text-[#A1A5B7] font-semibold text-sm">
										{campaign.sent_count}
									</TableCell>
									<TableCell className="text-[#3F3F46] font-semibold text-sm flex items-center gap-2">
										<NavLink
											to={`campaigns/${campaign.id}`}
										>
											<div className="flex items-center gap-2">
												<ManageIcon />
												{__('Manage', 'quillcrm')}
											</div>
										</NavLink>
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
