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
import { DashboardContentCard, ManageIcon } from '@doublescale/components';
import { NavLink } from '@doublescale/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { DashboardData } from '@doublescale/client';
import { EmptyState } from '../../no-data';

interface RecentEmailsTableProps {
	emails: DashboardData['recent_emails'];
}

export const RecentEmailsTable: React.FC<RecentEmailsTableProps> = ({
	emails,
}) => {
	return (
		<DashboardContentCard title={__('Recent Emails', 'doublescale')} cardClassName='h-full'>
			{isEmpty(emails) ? (
				<EmptyState />
			) : (
				<div className='h-full'>
					<Table >
						<TableHeader>
							<TableRow>
								<TableHead className="text-primaryText font-semibold">
									{__('ID', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Name', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Created On', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Execution Date', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Contacts', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Sent', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Status', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Action', 'doublescale')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{emails.map((email, index) => (
								<TableRow key={email.id}>
									<TableCell className="text-muted-foreground text-sm font-semibold">
										{index + 1}
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										{email.template?.subject || email.activity?.data?.subject || __('No Subject', 'doublescale')}
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										{format(
											new Date(email.created_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										{format(
											new Date(email.sent_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										1024
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										1024
									</TableCell>
									<TableCell>
										<div
											className={`text-sm w-fit capitalize rounded-lg py-1 px-3 ${
												String(email.status) === 'sent'
													? 'text-[#50CD89] bg-[#E2FFEF]'
													: 'bg-[#EBEBEB] text-[#616161]'
											}`}
										>
											{email.status}
										</div>
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										<NavLink
											to={`contacts/${email.contact_id}`}
										>
											<div className="flex items-center gap-2">
												<ManageIcon />
												{__('Manage', 'doublescale')}
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
