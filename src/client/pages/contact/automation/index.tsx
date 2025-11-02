/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { useNavigate, getToLink } from '@quillcrm/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import type { AutomationContactsResponse, AutomationContact } from '@quillcrm/client';
import { useContactContext } from '../state/context';
import { GradientAutomationsIcon, NoData } from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';
import Result from '../../automation/steps/workflow/result';
import { Provider as AutomationProvider } from '../../automation/state/context';

interface AutomationProps {
	contact_id: number;
}

const Automation: React.FC<AutomationProps> = ({ contact_id }) => {
	const { automationContacts, setAutomationContacts } = useContactContext();
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [selectedContact, setSelectedContact] = useState<AutomationContact | null>(null);
	const [isResultDialogOpen, setIsResultDialogOpen] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');
	const navigate = useNavigate();

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
		onViewJourney: (automationContact) => {
			setSelectedContact(automationContact);
			setIsResultDialogOpen(true);
		},
		onViewAutomation: (automationContact) => {
			navigate(getToLink(`automations/${automationContact.automation_id}`));
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
			{selectedContact && (
				<AutomationProvider
					value={{
						automation: (selectedContact as any).automation || null,
						steps: (selectedContact as any).automation?.steps || [],
						isLoading: false,
						isSaving: false,
						viewMode: true,
						analyticsData: [],
						updatedSteps: {},
						setAutomation: () => { },
						setIsLoading: () => { },
						setIsSaving: () => { },
						updateAutomation: () => { },
						saveAutomation: () => { },
						updateSettings: () => { },
						setSteps: () => { },
						addStep: () => { },
						removeStep: () => { },
						updateStep: () => { },
						setUpdatedSteps: () => { },
					}}
				>
					<Result
						contact={selectedContact}
						open={isResultDialogOpen}
						onOpenChange={setIsResultDialogOpen}
					/>
				</AutomationProvider>
			)}
		</div>
	);
};

export default Automation;
