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
import { DashboardContentCard, ThreeDotsIcon } from '@doublescale/components';
import { getToLink, useNavigate } from '@doublescale/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@doublescale/components/ui/table';
import { Button } from '@/components/ui/button';
import type { DashboardData } from '@doublescale/client';
import { EmptyState } from '../../no-data';
import { cn } from '@/lib/utils';

const tableHeadClass =
	'whitespace-nowrap text-sm leading-6 capitalize tracking-wide text-[#29292E]';

interface RecentAutomationsTableProps {
	automations: DashboardData['top_automations'];
	cardClassName?: string;
	contentClassName?: string;
}

export const RecentAutomationsTable: React.FC<RecentAutomationsTableProps> = ({
	automations,
	cardClassName,
	contentClassName,
}) => {
	const navigate = useNavigate();

	return (
		<DashboardContentCard
			title={__('Recent Automations', 'doublescale')}
			cardClassName={cn(
				'flex h-full min-h-0 w-full flex-col bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]',
				cardClassName
			)}
			contentClassName={cn(
				'flex min-h-0 flex-1 flex-col overflow-hidden',
				contentClassName
			)}
			viewAllLink={true}
			viewAllLinkUrl="automations"
		>
			{isEmpty(automations) ? (
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
										{__('Trigger', 'doublescale')}
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
								{automations.map((automation, index) => (
									<TableRow
										key={automation.id}
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
										<TableCell className="max-w-[10rem] truncate text-sm font-medium text-[#29292E] sm:max-w-[14rem]">
											{automation.name}
										</TableCell>
										<TableCell className="whitespace-nowrap text-sm text-[#3F4254]">
											{automation.trigger}
										</TableCell>
										<TableCell className="whitespace-nowrap">
											<span
												className={cn(
													'inline-flex rounded-lg px-2 py-1 text-xs font-medium',
													automation.status === 'active'
														? ' bg-[#E4FAEC] text-[#16A34A]'
														: ' bg-[#ECECEC] text-[#6B6C76]'
												)}
											>
												{automation.status === 'active'
													? __('Published', 'doublescale')
													: __('Draft', 'doublescale')}
											</span>
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="outline"
												size="icon"
												aria-label={__('Open automation menu', 'doublescale')}
												onClick={() =>
													navigate(
														getToLink(
															`automations/${automation.id}`
														)
													)
												}
												className="h-8 w-8 shrink-0 border-[#6549CA] text-[#6549CA] hover:bg-[#6549CA]/10 hover:text-[#6549CA]"
											>
												<ThreeDotsIcon />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</DashboardContentCard>
	);
};
