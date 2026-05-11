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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tableHeadClass =
	'whitespace-nowrap capitalize text-sm leading-6 tracking-wide text-[#29292E]';

function campaignIsPublished(status: string): boolean {
	const s = (status || '').toLowerCase();
	return ['completed', 'published', 'active', 'running'].includes(s);
}

interface RecentCampaignsTableProps {
	campaigns: DashboardData['top_campaigns'];
	cardClassName?: string;
	contentClassName?: string;
}

export const RecentCampaignsTable: React.FC<RecentCampaignsTableProps> = ({
	campaigns,
	cardClassName,
	contentClassName,
}) => {
	const navigate = useNavigate();

	return (
		<DashboardContentCard
			title={__('Recent Campaigns', 'doublescale')}
			cardClassName={cn(
				'flex h-full min-h-0 w-full flex-col bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]',
				cardClassName
			)}
			contentClassName={cn(
				'flex min-h-0 flex-1 flex-col overflow-hidden',
				contentClassName
			)}
			viewAllLink={true}
			viewAllLinkUrl="campaigns"
		>
			{isEmpty(campaigns) ? (
				<EmptyState />
			) : (
				<div className="min-h-0 flex-1 overflow-auto">
					<div className="overflow-hidden rounded-xl border border-[#D0D0D0]">
						<Table className="border-0">
							<TableHeader className="border-b border-[#E1E3EA] bg-[#DEE1E666]">
								<TableRow className="border-0 hover:bg-transparent">
									<TableHead className={tableHeadClass}>
										{__('ID', 'doublescale')}
									</TableHead>
									<TableHead className={tableHeadClass}>
										{__('Title', 'doublescale')}
									</TableHead>
									<TableHead className={tableHeadClass}>
										{__('Created At', 'doublescale')}
									</TableHead>
									<TableHead className={tableHeadClass}>
										{__('Recipients', 'doublescale')}
									</TableHead>
									<TableHead className={tableHeadClass}>
										{__('Status', 'doublescale')}
									</TableHead>
									<TableHead
										className={cn(tableHeadClass, 'text-right')}
									>
										{__('Action', 'doublescale')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{campaigns.map((campaign, index) => {
									const published = campaignIsPublished(
										campaign.status
									);
									return (
										<TableRow
											key={campaign.id}
											className={cn(
												'border-b border-[#E1E3EA] last:border-0',
												index % 2 === 0
													? 'bg-white hover:bg-[#F2F3F5]'
													: 'bg-[#F7F8FA] hover:bg-[#EFF1F4]'
											)}
										>
											<TableCell className="whitespace-nowrap text-sm font-medium text-[#3F4254]">
												{index + 1}
											</TableCell>
											<TableCell className="max-w-[8rem] truncate text-sm font-semibold text-[#29292E] sm:max-w-[12rem]">
												{campaign.name}
											</TableCell>
											<TableCell className="whitespace-nowrap text-sm font-medium text-[#A1A5B7]">
												<TimeAgoCell
													value={campaign.created_at}
												/>
											</TableCell>
											<TableCell className="whitespace-nowrap text-sm font-medium text-[#3F4254]">
												{campaign.contacts_count || 0}
											</TableCell>
											<TableCell className="whitespace-nowrap">
												<span
													className={cn(
														'inline-flex rounded-lg  px-2 py-1 text-xs font-medium',
														published
															? ' bg-[#E4FAEC] text-[#16A34A]'
															: ' bg-[#ECECEC] text-[#6B6C76]'
													)}
												>
													{published
														? __(
																'Published',
																'doublescale'
															)
														: __(
																'Draft',
																'doublescale'
															)}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="outline"
													size="icon"
													aria-label={__(
														'Open campaign menu',
														'doublescale'
													)}
													onClick={() =>
														navigate(
															getToLink(
																`campaigns/${campaign.id}/overview`
															)
														)
													}
													className="h-8 w-8 shrink-0 border-[#6549CA] text-[#6549CA] hover:bg-[#6549CA]/10 hover:text-[#6549CA]"
												>
													<ThreeDotsIcon />
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</DashboardContentCard>
	);
};
