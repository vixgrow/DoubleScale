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
import { Card } from '@/components/ui/card';
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
							<Card className="flex-1 p-3 shadow-none border-l-secondary border-l-[3px] border-y-0 border-r-0">
								<div className="flex justify-between items-center">
									<div className="flex flex-col">
										<span className="text-2xl font-semibold">
											{purchaseHistory.wc.total}
										</span>
										<span className="text-lg text-gray-500 font-medium">
											{__('Total Orders', 'quillcrm')}
										</span>
									</div>
									<div className="bg-[#E4EEFD] px-2 py-4 rounded-full">
										<TotalOrdersIcon />
									</div>
								</div>
							</Card>
							<Card className="flex-1 p-3 shadow-none border-l-[#16A34A] border-l-[3px] border-y-0 border-r-0">
								<div className="flex justify-between items-center">
									<div className="flex flex-col">
										<span className="text-2xl font-semibold">
											{purchaseHistory.wc.revenue}{' '}
											{purchaseHistory.wc.currency}
										</span>
										<span className="text-lg text-gray-500 font-medium">
											{__('Total Revenue', 'quillcrm')}
										</span>
									</div>
									<div className="bg-[#D1F6DF] p-2 rounded-full">
										<TotalRevenueIcon />
									</div>
								</div>
							</Card>
							<Card className="flex-1 p-3 shadow-none border-l-[#660FF1] border-l-[3px] border-y-0 border-r-0">
								<div className="flex justify-between items-center">
									<div className="flex flex-col">
										<span className="text-2xl font-semibold">
											{purchaseHistory.wc.average
												? purchaseHistory.wc.average
												: '0'}{' '}
											{purchaseHistory.wc.currency}
										</span>
										<span className="text-lg text-gray-500 font-medium">
											{__(
												'Average Order Value',
												'quillcrm'
											)}
										</span>
									</div>
									<div className="bg-[#EEE4FF] p-1.5 rounded-full">
										<AverageOrderValueIcon />
									</div>
								</div>
							</Card>
						</div>
					)}
					<div>
						{!loading &&
						purchaseHistory &&
						purchaseHistory.wc.orders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 gap-4">
								<div className="text-gray-400">
									<NoPurchaseHistoryIcon
										width={120}
										height={120}
									/>
								</div>
								<span className="text-lg text-gray-500 font-medium">
									{__(
										'No purchase history found',
										'quillcrm'
									)}
								</span>
							</div>
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
							<Card className="flex-1 p-3 shadow-none border-l-secondary border-l-[3px] border-y-0 border-r-0">
								<div className="flex justify-between items-center">
									<div className="flex flex-col">
										<span className="text-2xl font-semibold">
											{purchaseHistory.edd.total}
										</span>
										<span className="text-lg text-gray-500 font-medium">
											{__('Total Orders', 'quillcrm')}
										</span>
									</div>
									<div className="bg-[#E4EEFD] px-2 py-4 rounded-full">
										<TotalOrdersIcon />
									</div>
								</div>
							</Card>
							<Card className="flex-1 p-3 shadow-none border-l-[#16A34A] border-l-[3px] border-y-0 border-r-0">
								<div className="flex justify-between items-center">
									<div className="flex flex-col">
										<span className="text-2xl font-semibold">
											{purchaseHistory.edd.revenue}{' '}
											{purchaseHistory.edd.currency}
										</span>
										<span className="text-lg text-gray-500 font-medium">
											{__('Total Revenue', 'quillcrm')}
										</span>
									</div>
									<div className="bg-[#D1F6DF] p-2 rounded-full">
										<TotalRevenueIcon />
									</div>
								</div>
							</Card>
							<Card className="flex-1 p-3 shadow-none border-l-[#660FF1] border-l-[3px] border-y-0 border-r-0">
								<div className="flex justify-between items-center">
									<div className="flex flex-col">
										<span className="text-2xl font-semibold">
											{purchaseHistory.edd.average
												? purchaseHistory.edd.average
												: '0'}{' '}
											{purchaseHistory.edd.currency}
										</span>
										<span className="text-lg text-gray-500 font-medium">
											{__(
												'Average Order Value',
												'quillcrm'
											)}
										</span>
									</div>
									<div className="bg-[#EEE4FF] p-1.5 rounded-full">
										<AverageOrderValueIcon />
									</div>
								</div>
							</Card>
						</div>
					)}
					<div>
						{!loading &&
						purchaseHistory &&
						purchaseHistory.edd.orders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 gap-4">
								<div className="text-gray-400">
									<NoPurchaseHistoryIcon
										width={120}
										height={120}
									/>
								</div>
								<span className="text-lg text-gray-500 font-medium">
									{__(
										'No purchase history found',
										'quillcrm'
									)}
								</span>
							</div>
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
				<div className="flex flex-col items-center justify-center py-20 gap-4">
					<div className="text-gray-400">
						<NoPurchaseHistoryIcon width={120} height={120} />
					</div>
					<span className="text-lg text-gray-500 font-medium">
						{__('No eCommerce platform active', 'quillcrm')}
					</span>
				</div>
			)}
		</div>
	);
};

export default PurchaseHistory;
