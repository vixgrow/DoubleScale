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
} from '@doublescale/client';
import { useParams } from '@doublescale/navigation';
import Result from '../workflow/result';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@doublescale/components/ui/data-table-pagination';

const ContactsList: React.FC = () => {
	const { id } = useParams<{ id: string; tab: string }>();
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [contacts, setContacts] = useState<AutomationContact[]>([]);
	const [contact, setContact] = useState<AutomationContact | null>(null);
	const [keyword, setKeyword] = useState('');
	const { createNotice } = useDispatch('doublescale/core');

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
				path: addQueryArgs(`/doublescale/v1/automations/${id}/contacts`, {
					page,
					per_page: perPage,
					keyword,
				}),
				method: 'GET',
			})) as AutomationContactsResponse;

			setTotalRecords(response.total ?? 0);
			setContacts(response.data ?? []);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to fetch contacts', 'doublescale'),
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
			placeholder: __('Search Contacts', 'doublescale'),
			onChange: (value) => setKeyword(value),
			value: keyword,
		},
	};

	return (
		<div className="doublescale-contacts-list px-8 py-5 h-screen">
			<div className="mb-4">
				<h1 className="text-3xl font-semibold text-[#09090B]">{__('Contacts', 'doublescale')}</h1>
			</div>
			<div className="doublescale-contacts-list__table">
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

			<Result
				contact={contact}
				open={contact !== null}
				onOpenChange={(open) => !open && setContact(null)}
			/>
		</div>
	);
};

export default ContactsList;
