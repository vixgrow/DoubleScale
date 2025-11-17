/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	Chart as ChartJS,
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	Title,
	CategoryScale,
	Tooltip,
	BarElement,
} from 'chart.js';

ChartJS.register(
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	Title,
	CategoryScale,
	Tooltip,
	BarElement
);

/**
 * Internal dependencies
 */
import './style.scss';
import type { DashboardData } from '@quillcrm/client';
import { CartStatsCards } from './cart-stats-card';
import { RecoveredCartsTable } from './recovered-carts-list';
import { RecentCartsTable } from './recent-carts-list';
import { CartsChart } from '../cart-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartAnalytics } from '../use-analytics';
import { DashboardContentCard, PageHeader } from '@quillcrm/components';
import CartAnalyticsSkeleton from './cart-analytics-skeleton';

interface CartAnalyticsProps {
	dashboardData: DashboardData;
}

const CartAnalytics: React.FC<CartAnalyticsProps> = ({ dashboardData }) => {
	const {
		data,
		loading,
		interval,
		startDate,
		endDate,
		setInterval,
		setStartDate,
		setEndDate,
		refetch,
	} = useCartAnalytics();

	if (!data || loading) {
		return (
			 <CartAnalyticsSkeleton />
		);
	}

	return (
		<>
			<PageHeader
				title={__('Cart Analytics', 'quillcrm')}
				subtitle={__('Cart Analytics', 'quillcrm')}
				actions={[]}
			/>
			<div className="flex flex-col gap-5">
				<DashboardContentCard
					title={__('Cart Analytics Overview', 'quillcrm')}
				>
					<CartStatsCards
						data={data}
						total_orders={dashboardData.total_orders ?? 0}
					/>
				</DashboardContentCard>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 ">
					<div className=" h-full md:col-span-2">
						<RecentCartsTable
							carts={dashboardData.recent_abandoned_carts}
						/>
					</div>
					<div className=" h-full md:col-span-1">
						<CartsChart
							data={data}
							interval={interval}
							startDate={startDate}
							endDate={endDate}
							onIntervalChange={setInterval}
							onChangeFromDate={setStartDate}
							onChangeToDate={setEndDate}
							onSubmit={refetch}
						/>
					</div>
				</div>
				<RecoveredCartsTable
					recovered_carts={dashboardData.recent_recoverd_carts}
				/>
			</div>
		</>
	);
};

export default CartAnalytics;
