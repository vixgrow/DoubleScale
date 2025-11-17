/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	CartIcon,
	DashboardSmallCard,
	MessageStatsCard,
	OrdersIcon,
	RevenueIcon,
	TotalContactsIcon,
	TotalOrdersIcon,
	TotalRevenueIcon,
} from '@quillcrm/components';
import type { CartAnalytics } from '@quillcrm/client';

interface CartStatsCardsProps {
	data: CartAnalytics;
	total_orders: number;
}

export const CartStatsCards: React.FC<CartStatsCardsProps> = ({
	data,
	total_orders,
}) => {
	return (
		<div className="flex gap-5">
			<MessageStatsCard
					icon={<CartIcon width={40} height={40}  />}
					value={data.total.carts}
					label={__('Total Carts', 'quillcrm')}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-[#1E3A8A]"
					iconColor="text-[#1E3A8A]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<TotalOrdersIcon/>}
					value={total_orders}
					label={__('Total Orders', 'quillcrm')}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-[#458DC7]"
					iconColor="text-[#458DC7]"
					className='py-5'
				/>
				<MessageStatsCard
					icon={<TotalRevenueIcon />}
					value={data.total.revenue}
					label={__('Total Revenue', 'quillcrm')}
					iconBgClass="bg-[#E4FAEC]"
					borderColorClass="border-l-[#16A34A]"
					iconColor="text-[#16A34A]"
					className='py-5'
				/>
		</div>
	);
};
