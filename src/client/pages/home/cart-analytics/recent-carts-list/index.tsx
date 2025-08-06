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
	ViewOutlinedIcon,
} from '@quillcrm/components';
import { NavLink } from '@quillcrm/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { AbandonedCart } from '@quillcrm/client';
import { EmptyState } from '../../no-data';

interface RecentCartsTableProps {
	carts?: AbandonedCart[];
}

const getStatusClasses = (status: string) => {
	switch (status) {
		case 'done':
			return 'text-[#50CD89] bg-[#E2FFEF]';
		case 'draft':
			return 'text-[#616161] bg-[#EBEBEB]';
		default:
			return 'text-[#616161] bg-[#EBEBEB]';
	}
};

export const RecentCartsTable: React.FC<RecentCartsTableProps> = ({
	carts,
}) => {
	return (
		<DashboardContentCard
			title={__('Cart Analytics', 'quillcrm')}
			className="w-2/3"
		>
			{isEmpty(carts) ? (
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
									{__('Status', 'quillcrm')}
								</TableHead>
								<TableHead className="text-[#3F4254] font-semibold">
									{__('Created At', 'quillcrm')}
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
							{Array.isArray(carts) &&
								carts.map((cart, index) => (
									<TableRow key={cart.id}>
										<TableCell className="text-[#A1A5B7] text-sm font-semibold">
											{index + 1}
										</TableCell>
										<TableCell className="text-[#2E2C2F] font-semibold text-sm">
											email
										</TableCell>
										<TableCell
											className={`text-xs font-semibold px-2 py-1 rounded-md w-fit ${getStatusClasses('done')}`}
										>
											cart.status
										</TableCell>
										<TableCell className="text-[#2E2C2F] font-semibold text-sm">
											{/* <TimeAgoCell
												value={cart.created_at}
											/> */}created_at
										</TableCell>
										<TableCell className="text-[#2E2C2F] font-semibold text-sm">
											{/* {Object.values(cart.items)
												.map(
													(item) =>
														(
															item as {
																key: string;
															}
														).key
												)
												.join(', ')} */}
												items...
										</TableCell>
										<TableCell className="text-[#50CD89] font-semibold text-sm">
											{/* {cart.total} */}total
										</TableCell>
										<TableCell className="text-[#3F3F46] font-semibold text-sm">
											<NavLink
												to={`abandoned-carts`}
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
