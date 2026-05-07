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

interface RecentAutomationsTableProps {
	automations: DashboardData['top_automations'];
}

export const RecentAutomationsTable: React.FC<RecentAutomationsTableProps> = ({
	automations,
}) => {
	const navigate = useNavigate();

	return (
		<DashboardContentCard
			title={__('Recent Automations', 'doublescale')}
			cardClassName="w-3/5 h-[420px] overflow-y-auto"
			viewAllLink={true}
			viewAllLinkUrl="automations"
		>
			{isEmpty(automations) ? (
				<EmptyState />
			) : (
				<div>
					<Table className="border">
						<TableHeader className="bg-[#DEE1E666]">
							<TableRow>
								<TableHead>{__('ID', 'doublescale')}</TableHead>
								<TableHead>{__('Title', 'doublescale')}</TableHead>
								<TableHead>
									{__('Trigger', 'doublescale')}
								</TableHead>
								<TableHead>
									{__('Status', 'doublescale')}
								</TableHead>
								<TableHead>
									{__('Action', 'doublescale')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="bg-white">
							{automations.map((automation, index) => (
								<TableRow key={automation.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell>{automation.name}</TableCell>
									<TableCell>{automation.trigger}</TableCell>
									<TableCell>
										<span
											className={`px-3 py-1 border rounded text-sm font-normal ${
												automation.status === 'active'
													? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
													: 'bg-[#F8F8F8] text-gray-500 border-gray-500'
											}`}
										>
											{automation.status === 'active'
												? 'Published'
												: 'Draft'}
										</span>
									</TableCell>
									<TableCell>
										<Button
											onClick={() =>
												navigate(
													getToLink(
														`automations/${automation.id}`
													)
												)
											}
											className="h-6 w-6 bg-accent text-[#1E2125] rounded-lg p-0 hover:bg-accent focus-visible:border-none focus-visible:outline-none focus-visible:box-shadow-none focus-visible:ring-0"
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
