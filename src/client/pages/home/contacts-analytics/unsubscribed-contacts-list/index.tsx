/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { isEmpty } from 'lodash';
import { User } from 'lucide-react';
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
} from '@quillcrm/components/ui/table';
import type { DashboardData } from '@quillcrm/client';
import { EmptyState } from '../../no-data';

interface UnsubscribedContactsTableProps {
	contacts: DashboardData['recent_unsubscribed_contacts'];
}

export const UnsubscribedContactsTable: React.FC<
	UnsubscribedContactsTableProps
> = ({ contacts }) => {
	return (
		<DashboardContentCard
			title={__('Recent Unsubscribed Contacts', 'quillcrm')}
		>
			{isEmpty(contacts) ? (
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
									{__('Title / Email', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Date', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Unsubscribe Reason', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Action', 'quillcrm')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contacts.map((contact, index) => (
								<TableRow key={contact.id}>
									<TableCell className="text-[#A1A5B7] text-sm font-semibold">
										{index + 1}
									</TableCell>
									<TableCell>
										<div className="flex items-start gap-3">
											<div className="bg-[#E1E3EA] text-gray-700 font-semibold text-base rounded-full p-2 flex items-center justify-center uppercase">
												{(contact.first_name?.[0] ||
													'') +
													(contact.last_name?.[0] ||
														'') || <User />}
											</div>
											<div className="font-semibold">
												<div className="text-base text-[#3F4254]">
													{contact.first_name || '-'}{' '}
													{contact.last_name || '-'}
												</div>
												<div className="text-sm text-[#A1A5B7]">
													{contact.email}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{format(
											new Date(contact.created_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-[#A1A5B7] font-semibold text-sm">
										{__('No reason', 'quillcrm')}
									</TableCell>
									<TableCell className="text-[#3F3F46] font-semibold text-sm">
										<NavLink to={`contacts/${contact.id}`}>
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
