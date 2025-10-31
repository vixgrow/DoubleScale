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
import type { AutomationContactsResponse } from '@quillcrm/client';
import { useContactContext } from '../state/context';
import { GradientAutomationsIcon, NoData } from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';

interface AutomationProps {
	contact_id: number;
}

const Automation: React.FC<AutomationProps> = ({ contact_id }) => {
	const { automationContacts, setAutomationContacts } = useContactContext();
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

	const fetchAutomationContacts = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(
					`/qc/v1/contacts/${contact_id}/automation-contacts`,
					{
						per_page: perPage,
						page,
					}
				),
			})) as AutomationContactsResponse;

			setAutomationContacts(response.data);
			setTotalRecords(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automation', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAutomationContacts();
	}, [page, perPage]);

	const columns = getColumns({
		onView: (automationContact) => {
			// TODO: Implement view automation details dialog
			console.log('View automation:', automationContact);
		},
	});

	return (
		<div className="qcrm-automation flex flex-col gap-5">
			<h3 className="text-2xl font-semibold">
				{__('Automation', 'quillcrm')}
			</h3>
			<div>
				{!loading && (!automationContacts || automationContacts.length === 0) ? (
					<NoData
						icon={<GradientAutomationsIcon />}
						title={__('No automations yet', 'quillcrm')}
						subtitle={__('Automations help you engage smarter—send emails, assign deals, or trigger actions based on behavior.', 'quillcrm')}
					/>
				) : (
					<>
						<DataTable
							columns={columns}
							data={automationContacts || []}
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

export default Automation;
