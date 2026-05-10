import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import AddEmailSequence from './components/add-email-sequence';
import SubscribersModal from './components/subscribers-modal';
import { EMAIL_SEQUENCE_TYPE, END_POINT } from './constants';
import { DataTable } from '@/components/ui/data-table';
import { emailSequenceColumns } from './columns';
import { PageHeader, PlusIcon } from '@/components';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { formatDateForAPI } from '@doublescale/utils';

// Import types
import { EmailSequence, EmailSequenceListResponse } from './types';

const EmailSequences: React.FC<{ navigate: (path: string) => void }> = ({
	navigate,
}) => {
	const [sequences, setSequences] = useState<EmailSequence[]>([]);
	const [loading, setLoading] = useState(true);
	const [keywords, setKeywords] = useState('');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isAdding, setIsAdding] = useState<boolean>(false);
	const [bulkAction, setBulkAction] = useState<string>('');
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});
	const [showSubscribersModal, setShowSubscribersModal] = useState(false);
	const [selectedSequenceForSubscribers, setSelectedSequenceForSubscribers] =
		useState<{
			id: number;
			name: string;
		} | null>(null);

	const { createNotice } = useDispatch('doublescale/core');

	// Use the reusable hook
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const fetchSequences = async () => {
		setLoading(true);
		try {
			const response = await apiFetch<EmailSequenceListResponse>({
				path: addQueryArgs(END_POINT, {
					page,
					per_page: perPage,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keywords,
				}),
			});

			setSequences(response.data || []);
			setTotalRecords(response.total || 0);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch email sequences', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await apiFetch({
				path: `${END_POINT}/${id}`,
				method: 'DELETE',
			});

			createNotice({
				type: 'success',
				message: __('Email sequence deleted successfully', 'doublescale'),
			});

			fetchSequences();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to delete email sequence', 'doublescale'),
			});
		}
	};

	const deleteSelected = async () => {
		try {
			await apiFetch({
				path: `${END_POINT}/bulk`,
				method: 'POST',
				data: {
					email_sequence_ids: selectedRowKeys,
				},
			});

			setSelectedRowKeys([]);
			fetchSequences();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	useEffect(() => {
		fetchSequences();
	}, [page, perPage, dateRange, keywords]);

	const handleDuplicate = async (id: number) => {
		try {
			await apiFetch({
				path: `${END_POINT}/${id}/duplicate`,
				method: 'POST',
				data: {
					type: EMAIL_SEQUENCE_TYPE,
				},
			});
			createNotice({
				type: 'success',
				message: __(
					'Email sequence duplicated successfully',
					'doublescale'
				),
			});
			fetchSequences();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const handleShowSubscribers = (id: number, name: string) => {
		setSelectedSequenceForSubscribers({ id, name });
		setShowSubscribersModal(true);
	};

	const columns = emailSequenceColumns({
		onDelete: handleDelete,
		onDuplicate: handleDuplicate,
		navigate,
		onShowSubscribers: handleShowSubscribers,
	});

	return (
		<div className="doublescale-email-sequences">
			<PageHeader
				title={__('Email Sequences', 'doublescale')}
				subtitle={__('Manage your email sequences', 'doublescale')}
				actions={[
					{
						label: __('Create Sequence', 'doublescale'),
						icon: <PlusIcon />,
						onClick: () => setIsAdding(true),
					},
				]}
			/>

			<DataTable
				columns={columns}
				data={sequences}
				showPagination={false}
				initialPageSize={perPage}
				setPage={setPage}
				loading={loading}
				config={{
					search: {
						placeholder: __('Search', 'doublescale'),
						onChange: (value) => {
							setKeywords(value);
						},
						value: keywords,
					},
					selection: {
						enabled: true,
						selectedKeys: selectedRowKeys,
						onSelectionChange: setSelectedRowKeys,
					},
					bulkActions: {
						enabled: true,
						currentAction: bulkAction,
						onActionChange: (value) => setBulkAction(value),
						onExecuteAction: () => deleteSelected(),
						activeTab: 'all',
					},
					dateRange: {
						enabled: true,
						value: dateRange,
						onDateChange: setDateRange,
					},
				}}
			/>
			<DataTablePagination table={serverSideTable} />

			<AddEmailSequence
				onSuccess={fetchSequences}
				setIsAdding={setIsAdding}
				isAdding={isAdding}
				handleNavigate={navigate}
			/>

			{selectedSequenceForSubscribers && (
				<SubscribersModal
					isOpen={showSubscribersModal}
					onClose={() => {
						setShowSubscribersModal(false);
						setSelectedSequenceForSubscribers(null);
					}}
					sequenceId={selectedSequenceForSubscribers.id}
					sequenceName={selectedSequenceForSubscribers.name}
				/>
			)}
		</div>
	);
};

export default EmailSequences;
