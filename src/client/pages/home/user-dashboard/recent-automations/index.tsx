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

interface RecentAutomationsTableProps {
	automations: DashboardData['top_automations'];
}

export const RecentAutomationsTable: React.FC<RecentAutomationsTableProps> = ({
	automations,
}) => {
	return (
		<DashboardContentCard
			title={__('Recent Automations', 'quillcrm')}
			className="w-2/3"
		>
			{isEmpty(automations) ? (
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
									{__('Trigger', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Labels', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Status', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Action', 'quillcrm')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{automations.map((automation, index) => (
								<TableRow key={automation.id}>
									<TableCell className="text-[#A1A5B7] text-sm font-semibold">
										{index + 1}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{automation.name}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{automation.trigger}
									</TableCell>
									<TableCell className="text-[#A1A5B7] font-semibold text-sm">
										Labels
									</TableCell>
									<TableCell>
										<div
											className={`text-sm w-fit capitalize rounded-lg py-1 px-3 ${automation.status == 'active' ? 'text-[#50CD89] bg-[#E2FFEF]' : 'bg-[#EF44444A] text-destructive'}`}
										>
											{automation.status}
										</div>
									</TableCell>
									<TableCell className="text-[#3F3F46] font-semibold text-sm flex items-center gap-2">
										<NavLink
											to={`automations/${automation.id}`}
										>
											<div className="flex items-center gap-2">
												<ManageIcon />
												{__('Manage', 'quillcrm')}
											</div>
										</NavLink>
										<NavLink
											to={`automations/${automation.id}`}
										>
											<div className="flex items-center gap-2">
												<OutlineReportsIcon />
												{__('Report', 'quillcrm')}
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
