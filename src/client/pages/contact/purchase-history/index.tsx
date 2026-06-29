/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import type { ReactNode } from 'react';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import type { PurchaseHistory as PurchaseHistoryType } from '../state/types';
import { useContactContext } from '../state/context';
import ConfigAPI from '@doublescale/config';
import {
	TotalOrdersIcon,
	TotalRevenueIcon,
	NoPurchaseHistoryIcon,
	AnalyticsReportsIcon,
	MessageStatsCard,
	NoData,
} from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { getWooColumns, getEddColumns, getSurecartColumns } from './columns';

interface PurchaseHistoryProps {
	contact_id: number;
}

interface PurchaseStatsCardItem {
	key: string;
	icon: ReactNode;
	value: string | number;
	label: string;
	iconBgClass: string;
	iconColor: string;
}

const formatRevenueByCurrency = (
	revenueByCurrency: Record<string, number> | undefined,
	fallbackRevenue: number,
	fallbackCurrency: string
): string => {
	if (revenueByCurrency && Object.keys(revenueByCurrency).length > 1) {
		return Object.entries(revenueByCurrency)
			.map(([currency, amount]) => `${Number(amount).toFixed(2)} ${currency}`)
			.join(' · ');
	}

	return `${Number(fallbackRevenue || 0).toFixed(2)} ${fallbackCurrency}`;
};

const formatAverageOrderValue = (
	revenueByCurrency: Record<string, number> | undefined,
	average: number,
	currency: string
): string => {
	const value = `${Number(average || 0).toFixed(2)} ${currency}`;
	if (revenueByCurrency && Object.keys(revenueByCurrency).length > 1) {
		return `${value} (${currency})`;
	}
	return value;
};

const PurchaseStatsCards = ({ cards }: { cards: PurchaseStatsCardItem[] }) => {
	if (cards.length === 0) {
		return null;
	}

	return (
		<>
			<div className="flex flex-col gap-4 sm:hidden">
				{cards.map((card) => (
					<MessageStatsCard
						key={card.key}
						icon={card.icon}
						value={card.value}
						label={card.label}
						iconBgClass={card.iconBgClass}
						iconColor={card.iconColor}
						layout="centered"
					/>
				))}
			</div>
			<div className="hidden gap-5 sm:flex">
				{cards.map((card) => (
					<MessageStatsCard
						key={card.key}
						icon={card.icon}
						value={card.value}
						label={card.label}
						iconBgClass={card.iconBgClass}
						iconColor={card.iconColor}
					/>
				))}
			</div>
		</>
	);
};

const PurchaseHistory = ({ contact_id }: PurchaseHistoryProps) => {
	const { purchaseHistory, setPurchaseHistory } = useContactContext();
	const [loading, setLoading] = useState<boolean>(false);
	const [wooPerPage, setWooPerPage] = useState<number>(10);
	const [wooPage, setWooPage] = useState<number>(1);
	const [wooTotalRecords, setWooTotalRecords] = useState<number>(0);
	const [eddPerPage, setEddPerPage] = useState<number>(10);
	const [eddPage, setEddPage] = useState<number>(1);
	const [eddTotalRecords, setEddTotalRecords] = useState<number>(0);
	const [surecartPerPage, setSurecartPerPage] = useState<number>(10);
	const [surecartPage, setSurecartPage] = useState<number>(1);
	const [surecartTotalRecords, setSurecartTotalRecords] = useState<number>(0);
	const isEddActive = ConfigAPI.isEddActive();
	const isWooActive = ConfigAPI.isWoocommerceActive();
	const isSurecartActive = ConfigAPI.isSurecartActive();
	const { createNotice } = useDispatch('doublescale/core');

	const wooServerSideTable = useServerSideTable({
		page: wooPage,
		perPage: wooPerPage,
		totalRecords: wooTotalRecords,
		setPage: setWooPage,
		setPerPage: setWooPerPage,
	});

	const eddServerSideTable = useServerSideTable({
		page: eddPage,
		perPage: eddPerPage,
		totalRecords: eddTotalRecords,
		setPage: setEddPage,
		setPerPage: setEddPerPage,
	});

	const surecartServerSideTable = useServerSideTable({
		page: surecartPage,
		perPage: surecartPerPage,
		totalRecords: surecartTotalRecords,
		setPage: setSurecartPage,
		setPerPage: setSurecartPerPage,
	});

	const fetchPurchaseHistory = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(
					`/doublescale/v1/contacts/${contact_id}/purchase-history`,
					{
						woo_page: wooPage,
						woo_per_page: wooPerPage,
						edd_page: eddPage,
						edd_per_page: eddPerPage,
						surecart_page: surecartPage,
						surecart_per_page: surecartPerPage,
					}
				),
			})) as PurchaseHistoryType;

			if (response) {
				setPurchaseHistory(response);
				setWooTotalRecords(response.wc?.total || 0);
				setEddTotalRecords(response.edd?.total || 0);
				setSurecartTotalRecords(response.surecart?.total || 0);
			}
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPurchaseHistory();
	}, [wooPage, wooPerPage, eddPage, eddPerPage, surecartPage, surecartPerPage]);

	const wooColumns = getWooColumns();
	const eddColumns = getEddColumns();
	const surecartColumns = getSurecartColumns();

	const wooStatsCards: PurchaseStatsCardItem[] = purchaseHistory
		? [
				{
					key: 'woo-total-orders',
					icon: <TotalOrdersIcon />,
					value: purchaseHistory.wc.total,
					label: __('Total Orders', 'doublescale'),
					iconBgClass: 'bg-primary/10',
					iconColor: 'text-primary',
				},
				{
					key: 'woo-total-revenue',
					icon: <TotalRevenueIcon />,
					value: formatRevenueByCurrency(
						purchaseHistory.wc.revenue_by_currency,
						purchaseHistory.wc.revenue,
						purchaseHistory.wc.currency
					),
					label: __('Total Revenue', 'doublescale'),
					iconBgClass: 'bg-emerald-50',
					iconColor: 'text-emerald-600',
				},
				{
					key: 'woo-average-order',
					icon: <AnalyticsReportsIcon width={40} height={40} />,
					value: formatAverageOrderValue(
						purchaseHistory.wc.revenue_by_currency,
						purchaseHistory.wc.average,
						purchaseHistory.wc.currency
					),
					label: __('Average Order Value', 'doublescale'),
					iconBgClass: 'bg-violet-50',
					iconColor: 'text-violet-600',
				},
			]
		: [];

	const eddStatsCards: PurchaseStatsCardItem[] = purchaseHistory
		? [
				{
					key: 'edd-total-orders',
					icon: <TotalOrdersIcon />,
					value: purchaseHistory.edd.total,
					label: __('Total Orders', 'doublescale'),
					iconBgClass: 'bg-primary/10',
					iconColor: 'text-primary',
				},
				{
					key: 'edd-total-revenue',
					icon: <TotalRevenueIcon />,
					value: formatRevenueByCurrency(
						purchaseHistory.edd.revenue_by_currency,
						purchaseHistory.edd.revenue,
						purchaseHistory.edd.currency
					),
					label: __('Total Revenue', 'doublescale'),
					iconBgClass: 'bg-emerald-50',
					iconColor: 'text-emerald-600',
				},
				{
					key: 'edd-average-order',
					icon: <AnalyticsReportsIcon width={40} height={40} />,
					value: formatAverageOrderValue(
						purchaseHistory.edd.revenue_by_currency,
						purchaseHistory.edd.average,
						purchaseHistory.edd.currency
					),
					label: __('Average Order Value', 'doublescale'),
					iconBgClass: 'bg-violet-50',
					iconColor: 'text-violet-600',
				},
			]
		: [];

	const surecartStatsCards: PurchaseStatsCardItem[] = purchaseHistory
		? [
				{
					key: 'surecart-total-orders',
					icon: <TotalOrdersIcon />,
					value: purchaseHistory.surecart.total,
					label: __('Total Orders', 'doublescale'),
					iconBgClass: 'bg-primary/10',
					iconColor: 'text-primary',
				},
				{
					key: 'surecart-total-revenue',
					icon: <TotalRevenueIcon />,
					value: `${purchaseHistory.surecart.revenue?.toFixed(2) || '0'} ${purchaseHistory.surecart.currency}`,
					label: __('Total Revenue', 'doublescale'),
					iconBgClass: 'bg-emerald-50',
					iconColor: 'text-emerald-600',
				},
				{
					key: 'surecart-average-order',
					icon: <AnalyticsReportsIcon width={40} height={40} />,
					value: `${purchaseHistory.surecart.average?.toFixed(2) || '0'} ${purchaseHistory.surecart.currency}`,
					label: __('Average Order Value', 'doublescale'),
					iconBgClass: 'bg-violet-50',
					iconColor: 'text-violet-600',
				},
			]
		: [];

	return (
		<div className="doublescale-purchase-history flex flex-col gap-5">
			{/* WooCommerce Section */}
			{isWooActive && (
				<div className="flex flex-col gap-5">
					<h3 className="text-2xl font-semibold">
						{__('WooCommerce Purchase History', 'doublescale')}
					</h3>
					{purchaseHistory && (
						<PurchaseStatsCards cards={wooStatsCards} />
					)}
					<div>
						{!loading &&
							purchaseHistory &&
							purchaseHistory.wc.orders.length === 0 ? (
							<NoData
								icon={<NoPurchaseHistoryIcon width={120} height={120} />}
								title={__('No purchase history', 'doublescale')}
								subtitle={__('No WooCommerce purchase history found for this contact.', 'doublescale')}
							/>
						) : (
							purchaseHistory &&
							purchaseHistory.wc.orders.length > 0 && (
								<>
									<DataTable
										columns={wooColumns}
										data={purchaseHistory.wc.orders}
										loading={loading}
										showPagination={false}
										showMainActions={false}
										initialPageSize={wooPerPage}
										setPage={setWooPage}
										config={{}}
									/>
									<DataTablePagination
										table={wooServerSideTable}
									/>
								</>
							)
						)}
					</div>
				</div>
			)}

			{/* EDD Section */}
			{isEddActive && (
				<div className="flex flex-col gap-5 border-t border-gray-200 pt-5">
					<h3 className="text-2xl font-semibold">
						{__('Easy Digital Downloads', 'doublescale')}
					</h3>
					{purchaseHistory && (
						<PurchaseStatsCards cards={eddStatsCards} />
					)}
					<div>
						{!loading &&
							purchaseHistory &&
							purchaseHistory.edd.orders.length === 0 ? (
							<NoData
								icon={<NoPurchaseHistoryIcon width={120} height={120} />}
								title={__('No purchase history', 'doublescale')}
								subtitle={__('No Easy Digital Downloads purchase history found for this contact.', 'doublescale')}
							/>
						) : (
							purchaseHistory &&
							purchaseHistory.edd.orders.length > 0 && (
								<>
									<DataTable
										columns={eddColumns}
										data={purchaseHistory.edd.orders}
										loading={loading}
										showPagination={false}
										showMainActions={false}
										initialPageSize={eddPerPage}
										setPage={setEddPage}
										config={{}}
									/>
									<DataTablePagination
										table={eddServerSideTable}
									/>
								</>
							)
						)}
					</div>
				</div>
			)}

			{/* SureCart Section */}
			{isSurecartActive && (
				<div className="flex flex-col gap-5 border-t border-gray-200 pt-5">
					<h3 className="text-2xl font-semibold">
						{__('SureCart', 'doublescale')}
					</h3>
					{purchaseHistory && (
						<PurchaseStatsCards cards={surecartStatsCards} />
					)}
					<div>
						{!loading &&
							purchaseHistory &&
							purchaseHistory.surecart.orders.length === 0 ? (
							<NoData
								icon={<NoPurchaseHistoryIcon width={120} height={120} />}
								title={__('No purchase history', 'doublescale')}
								subtitle={__('No SureCart purchase history found for this contact.', 'doublescale')}
							/>
						) : (
							purchaseHistory &&
							purchaseHistory.surecart.orders.length > 0 && (
								<>
									<DataTable
										columns={surecartColumns}
										data={purchaseHistory.surecart.orders}
										loading={loading}
										showPagination={false}
										showMainActions={false}
										initialPageSize={surecartPerPage}
										setPage={setSurecartPage}
										config={{}}
									/>
									<DataTablePagination
										table={surecartServerSideTable}
									/>
								</>
							)
						)}
					</div>
				</div>
			)}

			{/* No Data State - when no eCommerce platform is active */}
			{!loading && !isWooActive && !isEddActive && !isSurecartActive && (
				<NoData
					icon={<NoPurchaseHistoryIcon width={120} height={120} />}
					title={__('No eCommerce platform active', 'doublescale')}
					subtitle={__('Activate WooCommerce, Easy Digital Downloads, or SureCart to track purchase history.', 'doublescale')}
				/>
			)}
		</div>
	);
};

export default PurchaseHistory;
