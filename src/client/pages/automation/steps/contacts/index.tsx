/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	AutomationContact,
	AutomationContactsResponse,
	DataTableConfig,
} from '@quillcrm/client';
import { useParams } from '@quillcrm/navigation';
import Result from '../workflow/result';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import DataTablePagination from '@quillcrm/components/ui/data-table-pagination';
import { Dialog, DialogContent, DialogOverlay } from '@quillcrm/components/ui/dialog';

const ContactsList: React.FC = () => {
	const { id } = useParams<{ id: string; tab: string }>();
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [totalRecords, setTotalRecords] = useState(0);
	const [contacts, setContacts] = useState<AutomationContact[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [contact, setContact] = useState<AutomationContact | null>(null);
	const [keyword, setKeyword] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/automations/${id}/contacts`, {
					page,
					per_page: perPage,
					keyword,
				}),
				method: 'GET',
			})) as AutomationContactsResponse;

			response.total && setTotalRecords(response.total);
			response.data && setContacts(response.data);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message || __('Failed to fetch contacts', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContacts();
	}, [page, perPage, keyword]);

	const columns = getColumns({
		onViewJourney: (contact: AutomationContact) => setContact(contact),
	});

	const tableConfig: DataTableConfig<AutomationContact> = {
		search: {
			placeholder: __('Search Contacts', 'quillcrm'),
			onChange: (value) => setKeyword(value),
			value: keyword,
		},
		selection: {
			enabled: true,
			selectedKeys: selectedRowKeys,
			onSelectionChange: setSelectedRowKeys,
		},
	};

	return (
		<div className="qcrm-contacts-list px-5 overflow-y-auto h-screen">
			<div className="qcrm-contacts-list__table">
				<DataTable
					columns={columns}
					data={contacts}
					config={tableConfig}
					showPagination={false}
					initialPageSize={perPage}
					setPage={setPage}
					loading={loading}
				/>
				<DataTablePagination table={serverSideTable} />
			</div>

			<Dialog open={contact !== null} onOpenChange={() => setContact(null)}>
				<DialogOverlay className="z-[150200]"/>	
				<DialogContent className="max-w-4xl z-[150200]">
					<Result contact={contact} />
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ContactsList;
