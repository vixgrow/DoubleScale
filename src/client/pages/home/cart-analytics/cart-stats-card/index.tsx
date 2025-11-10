/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	DashboardSmallCard,
	OrdersIcon,
	RevenueIcon,
	TotalContactsIcon,
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
			<DashboardSmallCard
				title={__('Total Carts', 'quillcrm')}
				subtitle={data.total.carts}
				icon={<TotalContactsIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Orders', 'quillcrm')}
				subtitle={total_orders}
				icon={<OrdersIcon />}
			/>
			<DashboardSmallCard
				title={__('Total Revenue', 'quillcrm')}
				subtitle={data.total.revenue}
				icon={<RevenueIcon />}
			/>
		</div>
	);
};
