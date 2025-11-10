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
import type { Deal } from '@/client/pages/sales-pipeline/types';
import {
	GradientDealsIcon,
	DealsIcon,
	DealsClosedWonIcon,
	DealsWonValueIcon,
	MessageStatsCard,
	NoData,
} from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';

interface DealsProps {
	contact_id: number;
}

const Deals: React.FC<DealsProps> = ({ contact_id }) => {
	const [deals, setDeals] = useState<Deal[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const { createNotice } = useDispatch('quillcrm/core');

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const fetchDeals = async () => {
		setLoading(true);

		try {
			const response = await apiFetch({
				path: addQueryArgs(
					`/qc/v1/deals`,
					{
						contact_id: contact_id,
						per_page: perPage,
						page,
					}
				),
				parse: false,
			}) as Response;

			// Get data from response body
			const data = (await response.json()) as Deal[];
			
			// Get total from headers
			const total = parseInt(response.headers.get('X-Total-Count') || '0', 10);

			setDeals(data);
			setTotalRecords(total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch deals', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDeals();
	}, [page, perPage]);

	const columns = getColumns({
		onView: (deal) => {
			// TODO: Implement view automation details dialog
			console.log('View deal:', deal);
		},
	});

	// Calculate statistics
	const totalDeals = totalRecords;
	const closedWonDeals = deals?.filter((deal) => deal.status === 'won').length || 0;
	const wonValue = deals?.reduce((sum, deal) => {
		if (deal.status === 'won') {
			return sum + (deal.value || 0);
		}
		return sum;
	}, 0) || 0;

	// Format currency value
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: deals?.[0]?.currency || 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	return (
		<div className="qcrm-automation flex flex-col gap-5">
			<h3 className="text-2xl font-semibold">
				{__('Deals', 'quillcrm')}
			</h3>

			{/* Statistics Cards */}
			{!loading && (
				<div className="flex gap-5">
					<MessageStatsCard
						icon={<DealsIcon width={40} height={40} />}
						value={totalDeals}
						label={__('Total Deals', 'quillcrm')}
						iconBgClass="bg-[#E4EEFD]"
						borderColorClass="border-l-secondary"
						iconColor="text-[#458DC7]"
					/>
					<MessageStatsCard
						icon={<DealsClosedWonIcon width={40} height={40} />}
						value={closedWonDeals}
						label={__('Deals Closed Won', 'quillcrm')}
						iconBgClass="bg-[#D1F6DF]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#16A34A]"
					/>
					<MessageStatsCard
						icon={<DealsWonValueIcon width={40} height={40} />}
						value={formatCurrency(wonValue)}
						label={__('Deals Won Value', 'quillcrm')}
						iconBgClass="bg-[#EEE4FF]"
						borderColorClass="border-l-[#660FF1]"
						iconColor="text-[#660FF1]"
					/>
				</div>
			)}
			<div>
				{!loading && (!deals || deals.length === 0) ? (
					<NoData
						icon={<GradientDealsIcon />}
						title={__('No Deals', 'quillcrm')}
						subtitle={__('No deals found', 'quillcrm')}
					/>
				) : (
					<>
						<DataTable
							columns={columns}
							data={deals || []}
							loading={loading}
							showPagination={false}
							initialPageSize={perPage}
							showMainActions={false}
							setPage={setPage}
							config={{}}
						/>
						<DataTablePagination table={serverSideTable} />
					</>
				)}
			</div>
		</div>
	);
};

export default Deals;
