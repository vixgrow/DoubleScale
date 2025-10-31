/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import type { PurchaseHistory as PurchaseHistoryType } from '../state/types';
import { useContactContext } from '../state/context';
import ConfigAPI from '@quillcrm/config';
import {
	TotalOrdersIcon,
	TotalRevenueIcon,
	AverageOrderValueIcon,
	NoPurchaseHistoryIcon,
} from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getWooColumns, getEddColumns } from './columns';
import { MessageStatsCard } from '../components/message-stats-card';
import { NoData } from '@quillcrm/components/no-data';

interface PurchaseHistoryProps {
	contact_id: number;
}

const PurchaseHistory = ({ contact_id }: PurchaseHistoryProps) => {
	const { purchaseHistory, setPurchaseHistory } = useContactContext();
	const [loading, setLoading] = useState<boolean>(false);
	const [wooPerPage, setWooPerPage] = useState<number>(10);
	const [wooPage, setWooPage] = useState<number>(1);
	const [wooTotalRecords, setWooTotalRecords] = useState<number>(0);
	const [eddPerPage, setEddPerPage] = useState<number>(10);
	const [eddPage, setEddPage] = useState<number>(1);
	const [eddTotalRecords, setEddTotalRecords] = useState<number>(0);
	const isEddActive = ConfigAPI.isEddActive();
	const isWooActive = ConfigAPI.isWoocommerceActive();
	const { createNotice } = useDispatch('quillcrm/core');

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

	const fetchPurchaseHistory = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(
					`/qc/v1/contacts/${contact_id}/purchase-history`,
					{
						woo_page: wooPage,
						woo_per_page: wooPerPage,
						edd_page: eddPage,
						edd_per_page: eddPerPage,
					}
				),
			})) as PurchaseHistoryType;

			if (response) {
				setPurchaseHistory(response);
				setWooTotalRecords(response.wc?.total || 0);
				setEddTotalRecords(response.edd?.total || 0);
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
	}, [wooPage, wooPerPage, eddPage, eddPerPage]);

	const wooColumns = getWooColumns();
	const eddColumns = getEddColumns();

	return (
		<div className="qcrm-purchase-history flex flex-col gap-5">
			{/* WooCommerce Section */}
			{isWooActive && (
				<div className="flex flex-col gap-5">
					<h3 className="text-2xl font-semibold">
						{__('WooCommerce Purchase History', 'quillcrm')}
					</h3>
					{purchaseHistory && (
						<div className="flex gap-5">
							<MessageStatsCard
								icon={<TotalOrdersIcon />}
								value={purchaseHistory.wc.total}
								label={__('Total Orders', 'quillcrm')}
								iconBgClass="bg-[#E4EEFD]"
								borderColorClass="border-l-secondary"
								iconColor="text-[#458DC7]"
							/>
							<MessageStatsCard
								icon={<TotalRevenueIcon />}
								value={`${purchaseHistory.wc.revenue} ${purchaseHistory.wc.currency}`}
								label={__('Total Revenue', 'quillcrm')}
								iconBgClass="bg-[#D1F6DF]"
								borderColorClass="border-l-[#16A34A]"
								iconColor="text-[#16A34A]"
							/>
							<MessageStatsCard
								icon={<AverageOrderValueIcon />}
								value={`${purchaseHistory.wc.average || '0'} ${purchaseHistory.wc.currency}`}
								label={__('Average Order Value', 'quillcrm')}
								iconBgClass="bg-[#EEE4FF]"
								borderColorClass="border-l-[#660FF1]"
								iconColor="text-[#660FF1]"
							/>
						</div>
					)}
					<div>
						{!loading &&
							purchaseHistory &&
							purchaseHistory.wc.orders.length === 0 ? (
							<NoData
								icon={<NoPurchaseHistoryIcon width={120} height={120} />}
								title={__('No purchase history', 'quillcrm')}
								subtitle={__('No WooCommerce purchase history found for this contact.', 'quillcrm')}
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
						{__('Easy Digital Downloads', 'quillcrm')}
					</h3>
					{purchaseHistory && (
						<div className="flex gap-5">
							<MessageStatsCard
								icon={<TotalOrdersIcon />}
								value={purchaseHistory.edd.total}
								label={__('Total Orders', 'quillcrm')}
								iconBgClass="bg-[#E4EEFD]"
								borderColorClass="border-l-secondary"
								iconColor="text-[#458DC7]"
							/>
							<MessageStatsCard
								icon={<TotalRevenueIcon />}
								value={`${purchaseHistory.edd.revenue} ${purchaseHistory.edd.currency}`}
								label={__('Total Revenue', 'quillcrm')}
								iconBgClass="bg-[#D1F6DF]"
								borderColorClass="border-l-[#16A34A]"
								iconColor="text-[#16A34A]"
							/>
							<MessageStatsCard
								icon={<AverageOrderValueIcon />}
								value={`${purchaseHistory.edd.average || '0'} ${purchaseHistory.edd.currency}`}
								label={__('Average Order Value', 'quillcrm')}
								iconBgClass="bg-[#EEE4FF]"
								borderColorClass="border-l-[#660FF1]"
								iconColor="text-[#660FF1]"
							/>
						</div>
					)}
					<div>
						{!loading &&
							purchaseHistory &&
							purchaseHistory.edd.orders.length === 0 ? (
							<NoData
								icon={<NoPurchaseHistoryIcon width={120} height={120} />}
								title={__('No purchase history', 'quillcrm')}
								subtitle={__('No Easy Digital Downloads purchase history found for this contact.', 'quillcrm')}
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

			{/* No Data State - when both are inactive or loading */}
			{!loading && !isWooActive && !isEddActive && (
				<NoData
					icon={<NoPurchaseHistoryIcon width={120} height={120} />}
					title={__('No eCommerce platform active', 'quillcrm')}
					subtitle={__('Activate WooCommerce or Easy Digital Downloads to track purchase history.', 'quillcrm')}
				/>
			)}
		</div>
	);
};

export default PurchaseHistory;
