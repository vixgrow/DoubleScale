/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { isEmpty } from 'lodash';
import { User } from 'lucide-react';
/**
 * internal dependencies
 */
import { DashboardContentCard } from '@quillcrm/components';
import { NavLink } from '@quillcrm/navigation';
import type { DashboardData } from '@quillcrm/client';
import { EmptyState } from '../../no-data';

interface RecentContactsListProps {
	contacts: DashboardData['recent_contacts'];
}

export const RecentContactsList: React.FC<RecentContactsListProps> = ({
	contacts,
}) => {
	return (
		<DashboardContentCard
			title={__('Recent Contacts', 'quillcrm')}
			className="w-2/5"
		>
			{isEmpty(contacts) ? (
				<EmptyState />
			) : (
				<div className="space-y-4">
					{contacts?.map((record) => {
						const initials =
							`${record.first_name?.[0] || ''}${record.last_name?.[0] || ''}`.toUpperCase();
						return (
							<div
								key={record.id}
								className="flex justify-between items-center hover:bg-gray-50"
							>
								<div className="flex items-center gap-4">
									<div className="p-2 bg-[#ECF3FC] text-[#7E8299] flex items-center justify-center rounded-lg text-lg font-extrabold">
										{initials || <User />}
									</div>
									<NavLink to={`contacts/${record.id}`}>
										<div className="text-base font-normal text-[#3F4254]">
											{record.first_name || '-'}{' '}
											{record.last_name || '-'}
										</div>
										<div className="text-sm text-[#A1A5B7] font-semibold">
											{record.email || '-'}
										</div>
									</NavLink>
								</div>
								<div className="text-base text-[#7E8299] font-semibold">
									{record.created_at
										? new Date(
												record.created_at
											).toLocaleDateString()
										: '-'}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</DashboardContentCard>
	);
};
