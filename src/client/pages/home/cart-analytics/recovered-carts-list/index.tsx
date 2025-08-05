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
import { DashboardContentCard, ViewOutlinedIcon } from '@quillcrm/components';
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

interface RecoveredCartsTableProps {
	recovered_carts: DashboardData['recent_recoverd_carts'];
}

export const RecoveredCartsTable: React.FC<RecoveredCartsTableProps> = ({
	recovered_carts,
}) => {
	return (
		<DashboardContentCard title={__('Recent Recovered Carts', 'quillcrm')}>
			{isEmpty(recovered_carts) ? (
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
									{__('Contact', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Last Active', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Created On', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Status', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Items', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Total', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Action', 'quillcrm')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{recovered_carts.map((cart, index) => (
								<TableRow key={cart.id}>
									<TableCell className="text-[#A1A5B7] text-sm font-semibold">
										{index + 1}
									</TableCell>
									<TableCell>
										<div className="flex items-start gap-3">
											{/* <div className="bg-[#E1E3EA] text-gray-700 font-semibold text-base rounded-full p-2 flex items-center justify-center uppercase">
												{(cart..first_name?.[0] ||
													'') +
													(contact.last_name?.[0] ||
														'') || <User />}
											</div> */}
											<div className="font-semibold">
												{/* <div className="text-base text-[#3F4254]">
													{contact.first_name || '-'}{' '}
													{contact.last_name || '-'}
												</div> */}
												<div className="text-sm text-[#A1A5B7]">
													{cart.email}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{format(
											new Date(cart.updated_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{format(
											new Date(cart.created_at),
											'yyyy-MM-dd HH:mm'
										)}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{cart.status}
										{cart.status == 'pending' && (
											<div className="text-secondary-foreground text-xs font-semibold underline">
												{__('Retry Cart', 'quillcrm')}
											</div>
										)}
									</TableCell>
									<TableCell className="text-[#2E2C2F] font-semibold text-sm">
										{Object.values(cart.items)
											.map((item) => item.key)
											.join(', ')}
									</TableCell>
									<TableCell className="text-[#50CD89] font-bold text-sm">
										{cart.total}
									</TableCell>
									<TableCell className="text-[#3F3F46] font-semibold text-sm">
										<NavLink
											to={`abandoned-carts/${cart.id}`}
										>
											<div className="flex items-center gap-2">
												<ViewOutlinedIcon
													width={14}
													height={10}
												/>
												{__('View', 'quillcrm')}
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
