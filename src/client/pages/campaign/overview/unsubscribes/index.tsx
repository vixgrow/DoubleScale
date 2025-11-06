/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { CampaignEmail, CampaignEmailsResponse, Campaign } from '@quillcrm/client';
import { useParams } from '@quillcrm/navigation';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';
import { NoData, UnsubscribesIcon, UnsubscribeSMSIcon } from '@quillcrm/components';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';

const UnsubscribesTab: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<CampaignEmail[]>([]);
	const [keywords, setKeywords] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');

	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	) as Campaign | null;

	// Server-side table for pagination
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords: total,
		setPage,
		setPerPage,
	});

	const fetchUnsubscribes = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/campaigns/${id}/unsubscribes`, {
					per_page: perPage,
					page,
					keywords,
				}),
			})) as CampaignEmailsResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch unsubscribes', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUnsubscribes();
	}, [page, perPage, keywords]);

	const columns = getColumns(campaign?.type);

	return (
		<div className="flex flex-col gap-5">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">
					{__('Unsubscribes', 'quillcrm')} ({total})
				</h2>
			</div>

			{/* Unsubscribes Table */}
			<div>
				{!loading && data.length === 0 ? (
					<NoData
						icon={
							campaign?.type === CAMPAIGN_CHANNEL.SMS ? (
								<UnsubscribeSMSIcon width={48} height={48} />
							) : (
								<UnsubscribesIcon width={48} height={48} />
							)
						}
						title={__('No unsubscribes yet', 'quillcrm')}
						subtitle={__(
							'When contacts unsubscribe from this campaign, they will appear here.',
							'quillcrm'
						)}
					/>
				) : (
					<>
						<DataTable
							columns={columns}
							data={data}
							loading={loading}
							showPagination={false}
							initialPageSize={10}
							showMainActions={false}
							config={{
								search: {
									placeholder: campaign?.type === CAMPAIGN_CHANNEL.SMS
										? __('Search by name or phone...', 'quillcrm')
										: __('Search by name or email...', 'quillcrm'),
									onChange: setKeywords,
									value: keywords,
								},
							}}
							setPage={() => { }}
						/>
						<DataTablePagination table={serverSideTable} />
					</>
				)}
			</div>
		</div>
	);
};

export default UnsubscribesTab;
