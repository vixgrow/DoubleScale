/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import {  Mail } from 'lucide-react';
import { isEmpty } from 'lodash';
/**
 * internal dependencies
 */
import {
	CalendarIcon,
	ContactTotalEmailsIcon,
	DashboardContentCard,
	FormattedDateCell,
} from '@doublescale/components';
import { NavLink } from '@doublescale/navigation';
import type { DashboardData } from '@doublescale/client';
import { EmptyState } from '../no-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import ArrowRight from '@doublescale/shared/icons/arrow-rightt';

interface RecentContactsListProps {
	contacts: DashboardData['recent_contacts'];
	/** Merged with default dashboard card styles */
	cardClassName?: string;
	contentClassName?: string;
}

export const RecentContactsList: React.FC<RecentContactsListProps> = ({
	contacts,
	cardClassName,
	contentClassName,
}) => {
	return (
		<DashboardContentCard
			title={__('Recent Contacts', 'doublescale')}
			cardClassName={cn(
				'flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]',
				cardClassName
			)}
			contentClassName={cn(
				'flex min-h-0 flex-1 flex-col',
				contentClassName
			)}
			viewAllLink={true}
			viewAllLinkUrl="contacts"
		>
			{isEmpty(contacts) ? (
				<EmptyState />
			) : (
				<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto ">
					{contacts?.map((record) => {
						const initials =
							`${record.first_name?.[0] || ''}${record.last_name?.[0] || ''}`.toUpperCase();
						const avatarUrl = (record as { avatar_url?: string }).avatar_url;
						const fullName =
							`${record.first_name || ''} ${record.last_name || ''}`.trim();

						return (
							<div
								key={record.id}
								className="rounded-xl border border-border bg-[#F7F8FA] p-4 transition-colors hover:bg-[#F0F2F5]"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<Avatar className="h-11 w-11 shrink-0 rounded-full">
											{avatarUrl ? (
												<AvatarImage
													src={avatarUrl}
													alt={fullName || record.email}
													className="rounded-full"
												/>
											) : null}
											<AvatarFallback className="rounded-full bg-[#E3EEFF99] text-base font-extrabold text-primary">
												{initials || '?'}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 truncate text-base font-semibold capitalize text-primaryText">
											{record.first_name || '-'} {record.last_name || '-'}
										</div>
									</div>
									<NavLink to={`contacts/${record.id}`}>
										<span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium leading-6 text-brandPrimary transition-colors hover:text-brandPrimary/80">
											{__('View Profile', 'doublescale')}
											<ArrowRight width={24} height={24} />
										</span>
									</NavLink>
								</div>
								<div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
									<div className="flex min-w-0 max-w-[65%] items-center text-[#16A34A] gap-2 text-sm leading-6 font-medium">
										<ContactTotalEmailsIcon width={24} height={24} color="#16A34A" />
										<span className="truncate font-medium text-[#16A34A]">
											{record.email || '-'}
										</span>
									</div>
									{record.created_at ? (
										<div className="flex shrink-0 items-center gap-2 text-sm leading-6 font-medium text-[#CB5301]">
											<CalendarIcon width={24} height={24} color="#CB5301" />
											<span className="whitespace-nowrap [&_*]:text-[#CB5301]">
												<FormattedDateCell value={record.created_at} />
											</span>
										</div>
									) : (
										<span className="text-sm text-muted-foreground">—</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</DashboardContentCard>
	);
};
