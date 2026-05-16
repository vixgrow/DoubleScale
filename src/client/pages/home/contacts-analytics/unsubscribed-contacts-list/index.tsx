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
import { DashboardContentCard, ManageIcon } from '@doublescale/components';
import { NavLink } from '@doublescale/navigation';
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

interface UnsubscribedContactsTableProps {
	contacts: DashboardData['recent_unsubscribed_contacts'];
}

export const UnsubscribedContactsTable: React.FC<
	UnsubscribedContactsTableProps
> = ({ contacts }) => {
	return (
		<DashboardContentCard
			title={__('Recent Unsubscribed Contacts', 'doublescale')}
			cardClassName='h-full'
		>
			{isEmpty(contacts) ? (
				<EmptyState />
			) : (
				<div className='h-full'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-primaryText font-semibold">
									{__('ID', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Title / Email', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Date', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Unsubscribe Reason', 'doublescale')}
								</TableHead>
								<TableHead className="text-primaryText font-semibold">
									{__('Action', 'doublescale')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contacts.map((contact, index) => (
								<TableRow key={contact.id}>
									<TableCell className="text-muted-foreground text-sm font-semibold">
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
												<div className="text-base text-primaryText">
													{contact.first_name || '-'}{' '}
													{contact.last_name || '-'}
												</div>
												<div className="text-sm text-muted-foreground">
													{contact.email}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										{format(
											new Date(contact.created_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-muted-foreground font-semibold text-sm">
										{__('No reason', 'doublescale')}
									</TableCell>
									<TableCell className="text-primaryText font-semibold text-sm">
										<NavLink to={`contacts/${contact.id}`}>
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
