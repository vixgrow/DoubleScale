/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import { useContactContext } from '../state/context';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import {
	PlusIcon,
	NoticeBanner,
	DeleteModal,
	GradientCallsIcon,
	NoData,
    AddLogIcon,
} from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';
import CallDialog from './call-dialog';
import type { NoticeMessage } from '@quillcrm/client';

interface Call {
	id: number;
	contact_id: number;
	activity_type: string;
	data: {
		phone_number?: string;
		duration?: number;
		outcome?: string;
		notes?: string;
		called_at?: string;
	};
	created_at: string;
	updated_at?: string;
	user?: {
		id: number;
		display_name: string;
	};
}

interface CallsResponse {
	data: Call[];
	total: number;
}

interface CallsProps {
	contact_id: number;
}

const Calls: React.FC<CallsProps> = ({ contact_id }) => {
	const [calls, setCalls] = useState<Call[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [callModalVisible, setCallModalVisible] = useState(false);
	const [selectedCall, setSelectedCall] = useState<Call | null>(null);
	const [callToDelete, setCallToDelete] = useState<Call | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	const fetchCalls = async () => {
		setLoading(true);

		try {
			const response: any = await apiFetch({
				path: addQueryArgs(`/qc/v1/activities`, {
					contact_id,
					activity_type: 'call_logged',
					per_page: perPage,
					page,
				}),
			});

			// The API returns { data: [...], meta: { total, per_page, ... } }
			if (response?.data && Array.isArray(response.data)) {
				setCalls(response.data);
				setTotalRecords(response.meta?.total || response.data.length);
			} else if (Array.isArray(response)) {
				// Legacy fallback
				setCalls(response);
				setTotalRecords(response.length);
			}
		} catch (error: any) {
			showNotice(
				'error',
				error.message || __('Failed to fetch calls', 'quillcrm')
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCalls();
	}, [page, perPage, contact_id]);

	const handleEdit = (call: Call) => {
		setSelectedCall(call);
		setCallModalVisible(true);
	};

	const handleDelete = (call: Call) => {
		setCallToDelete(call);
	};

	const confirmDelete = async () => {
		if (!callToDelete) return;

		try {
			await apiFetch({
				path: `/qc/v1/activities/${callToDelete.id}`,
				method: 'DELETE',
			});

			setCalls(calls.filter((c) => c.id !== callToDelete.id));
			fetchCalls();
			showNotice('success', __('Call deleted successfully', 'quillcrm'));
		} catch (error) {
			showNotice('error', __('Failed to delete call', 'quillcrm'));
		} finally {
			setCallToDelete(null);
		}
	};

	const handleAddCall = () => {
		setSelectedCall(null);
		setCallModalVisible(true);
	};

	const columns = getColumns({
		onEdit: handleEdit,
		onDelete: handleDelete,
	});

	return (
		<div className="qcrm-calls flex flex-col gap-5">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">
					{__('Calls', 'quillcrm')}
				</h2>
				<Button
					variant="secondary"
					size="sm"
					className="bg-white"
					onClick={handleAddCall}
				>
					<AddLogIcon />
					{__('Log Call', 'quillcrm')}
				</Button>
			</div>
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}
			<div>
				{!loading && (!calls || calls.length === 0) ? (
					<NoData
						icon={<GradientCallsIcon />}
						title={__('No calls found yet', 'quillcrm')}
						subtitle={__('No calls logged yet—this space is quiet for now. Add a call to keep the conversation going and stay in touch.', 'quillcrm')}
						onClick={handleAddCall}
						buttonLabel={__('Add Log Call', 'quillcrm')}
					/>
				) : (
					<>
						<DataTable
							columns={columns}
							data={calls || []}
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
			<CallDialog
				open={callModalVisible}
				onClose={() => {
					setCallModalVisible(false);
					setSelectedCall(null);
				}}
				contact_id={contact_id}
				selectedCall={selectedCall}
				onSave={(call) => {
					fetchCalls();
				}}
				onUpdate={(call) => {
					fetchCalls();
				}}
				showNotice={showNotice}
			/>
			<DeleteModal
				isOpen={!!callToDelete}
				onClose={() => setCallToDelete(null)}
				onConfirm={confirmDelete}
				selectedCount={1}
				activeTab="calls"
			/>
		</div>
	);
};

export default Calls;
