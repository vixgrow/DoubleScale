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
import { CalendarIcon, DashboardContentCard, FormattedDateCell } from '@quillcrm/components';
import { NavLink } from '@quillcrm/navigation';
import type { DashboardData } from '@quillcrm/client';
import { EmptyState } from '../no-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentContactsListProps {
	contacts: DashboardData['recent_contacts'];
}

export const RecentContactsList: React.FC<RecentContactsListProps> = ({
	contacts,
}) => {
	return (
		<DashboardContentCard
			title={__('Recent Contacts', 'quillcrm')}
			cardClassName="w-1/2"
			viewAllLink={true}
			viewAllLinkUrl="contacts"
		>
			{isEmpty(contacts) ? (
				<EmptyState />
			) : (
				<div>
					{contacts?.map((record, index) => {
						const initials =
							`${record.first_name?.[0] || ''}${record.last_name?.[0] || ''}`.toUpperCase();
						const hasImage = (record as any).img;
						const fullName = `${record.first_name || ''} ${record.last_name || ''}`.trim();
						const isLast = index === contacts.length - 1;

						return (
							<div
								key={record.id}
								className={`flex justify-between items-center hover:bg-gray-50 py-4 ${!isLast ? 'border-b border-dashed border-gray-200' : ''}`}
							>
								<div className="flex items-center gap-4">
									{hasImage ? (
										<Avatar className="w-12 h-12 rounded-lg">
											<AvatarImage src={(record as any).img} alt={fullName || record.email} className="rounded-full" />
										</Avatar>
									) : (
										<Avatar className="w-12 h-12 rounded-lg">
											<AvatarFallback className="rounded-lg bg-[#E3EEFF99] text-secondary font-extrabold text-lg">
												{initials || '?'}
											</AvatarFallback>
										</Avatar>
									)}
									<NavLink to={`contacts/${record.id}`}>
										<div className="text-base font-normal text-[#09090B]">
											{record.first_name || '-'}{' '}
											{record.last_name || '-'}
										</div>
										<div className="text-base text-gray-500">
											{record.email || '-'}
										</div>
									</NavLink>
								</div>
								<div className="text-base text-gray-500 flex items-center gap-2">
									{record.created_at
										? <>
											<CalendarIcon/>
											<FormattedDateCell value={record.created_at} />
										</>
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
