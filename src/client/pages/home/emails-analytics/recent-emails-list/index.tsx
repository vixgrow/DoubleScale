/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { isEmpty } from 'lodash';
import { format } from 'date-fns';
/**
 * internal dependencies
 */
import { DashboardContentCard, ManageIcon } from '@quillcrm/components';
import { NavLink } from '@quillcrm/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { DashboardData } from '@quillcrm/client';
import { EmptyState } from '../../no-data';

interface RecentEmailsTableProps {
	emails: DashboardData['recent_emails'];
}

const getStatusClasses = (status: string) => {
	switch (status.toLowerCase()) {
		case 'sent':
			return 'text-[#50CD89] bg-[#E2FFEF]';
		case 'draft':
			return 'text-[#616161] bg-[#EBEBEB]';
		default:
			return 'text-[#616161] bg-[#EBEBEB]';
	}
};

export const RecentEmailsTable: React.FC<RecentEmailsTableProps> = ({
	emails,
}) => {
	return (
		<DashboardContentCard title={__('Recent Emails', 'quillcrm')}>
			{isEmpty(emails) ? (
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
									{__('Name', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Created On', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Execution Date', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Contacts', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Sent', 'quillcrm')}
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
							{emails.map((email, index) => (
								<TableRow key={email.id}>
									<TableCell className="text-[#A1A5B7] text-sm font-semibold">
										{index + 1}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{email.email}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{format(
											new Date(email.created_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{format(
											new Date(email.sent_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										1024
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										1024
									</TableCell>
									<TableCell
										className={`text-xs font-semibold px-2 py-1 rounded-md w-fit ${getStatusClasses(email.status)}`}
									>
										{email.status}
									</TableCell>
									<TableCell className="text-[#3F3F46] font-semibold text-sm">
										<NavLink
											to={`contacts/${email.contact_id}`}
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
