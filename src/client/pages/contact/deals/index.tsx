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
import type { DealsResponse } from '@quillcrm/client';
import { useContactContext } from '../state/context';
import { NoDealsIcon } from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';

interface DealsProps {
	contact_id: number;
}

const Deals: React.FC<DealsProps> = ({ contact_id }) => {
	const { deals, setDeals } = useContactContext();
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
			const response = (await apiFetch({
				path: addQueryArgs(
					`/qc/v1/contacts/${contact_id}/deals`,
					{
						per_page: perPage,
						page,
					}
				),
			})) as DealsResponse;

			setDeals(response.data);
			setTotalRecords(response.total);
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

	return (
		<div className="qcrm-automation flex flex-col gap-5">
			<h3 className="text-2xl font-semibold">
				{__('Deals', 'quillcrm')}
			</h3>
			<div>
				{!loading && (!deals || deals.length === 0) ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="text-gray-400">
						 <NoDealsIcon width={120} height={120} />
						</div>
						<span className="text-lg text-gray-500 font-medium">
							{__('No deals found', 'quillcrm')}
						</span>
					</div>
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
