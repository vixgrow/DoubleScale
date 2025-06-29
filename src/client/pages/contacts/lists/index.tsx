/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { EditOutlined } from '@ant-design/icons';
import React, { forwardRef, useImperativeHandle } from 'react';
import { ColumnDef } from '@tanstack/react-table';

/**
 * Internal dependencies
 */
import './style.scss';
import type { List as ContactList, ListsResponse, DataTableConfig, NoticeMessage } from '@quillcrm/client';
import { CustomDialogHeader, Field, GradientListIcon, SortIcon, NoticeBanner } from '@quillcrm/components';
import { convertDate } from '@quillcrm/utils';
import { isEmpty } from 'validator';
import { DataTable } from '@/components/ui/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@quillcrm/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

export interface ListsRef {
	openCreateListModal: () => void;
}

interface ListsProps {
	activeTab?: string;
}

const selectionColumn: ColumnDef<ContactList> = {
	id: 'select',
	header: ({ table }) => (
		<Checkbox
			checked={table.getIsAllPageRowsSelected()}
			onCheckedChange={(value) =>
				table.toggleAllPageRowsSelected(!!value)
			}
			aria-label="Select all"
		/>
	),
	cell: ({ row }) => (
		<Checkbox
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label="Select row"
		/>
	),
	enableSorting: false,
	enableHiding: false,
};

const Lists = forwardRef<ListsRef, ListsProps>(({ activeTab }, ref) => {
	const [lists, setLists] = useState<ContactList[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage] = useState<number>(10);
	const [page] = useState<number>(1);
	const [keyword] = useState<string>('');
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedList, setSelectedList] = useState<ContactList | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [list, setList] = useState({
		name: '',
		description: '',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	useImperativeHandle(ref, () => ({
		openCreateListModal: () => {
			setSelectedList(null);
			setList({
				name: '',
				description: '',
			});
			setVisible(true);
		},
	}));

	const fetchLists = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					per_page: perPage,
					page,
					keyword,
				}),
			})) as ListsResponse;

			setLists(response.data);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLists();
	}, [page, perPage, keyword]);

	const createList = async () => {
		if (!validate(list)) {
			return;
		}

		setIsSaving(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/lists',
				method: 'POST',
				data: list,
			});

			setLists([...lists, response as ContactList]);
			setVisible(false);
			setList({
				name: '',
				description: '',
			});
			showNotice('success', __('Your List was successfully added  — check it out!', 'quillcrm'));
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsSaving(false);
		}
	};

	const updateList = async () => {
		if (!selectedList || !validate(selectedList)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/lists/${selectedList?.id}`,
				method: 'PUT',
				data: selectedList,
			})) as ContactList;

			setLists([
				...lists.map((list) =>
					list.id === response.id ? response : list
				),
			]);

			setVisible(false);
			setSelectedList(null);
			showNotice('success', __('List updated successfully', 'quillcrm'));
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsSaving(false);
		}
	};

	const deleteSelectedLists = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/lists',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchLists();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice('success', __('Selected lists deleted successfully', 'quillcrm'));
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const doBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelectedLists();
				break;
			default:
				break;
		}
	};

	const validate = (list: Partial<ContactList>) => {
		if (isEmpty(list.name || '', { ignore_whitespace: true })) {
			showNotice('error', __('List name is required', 'quillcrm'));
			return false;
		}
		return true;
	};

	const columns: ColumnDef<ContactList>[] = [
		selectionColumn,
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<div className='flex items-center gap-1'
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Name', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<span>{row.original.name}</span>
			),
		},
		{
			accessorKey: 'description',
			header: ({ column }) => (
				<div className='flex items-center gap-1'
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Description', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => row.original.description || '-',
		},
		{
			accessorKey: 'contacts_count',
			header: ({ column }) => (
				<div className='flex items-center gap-1'
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Contacts No', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => row.original.contacts_count ?? 0,
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => (
				<div className='flex items-center gap-1'
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Created At', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => convertDate(row.original.created_at),
		},
		{
			accessorKey: 'actions',
			header: () => __('Actions', 'quillcrm'),
			cell: ({ row }) => (
				<Button
					onClick={() => {
						setSelectedList(row.original);
						setVisible(true);
					}}
					variant="ghost"
					className='p-0'
				>
					<EditOutlined />
					{__('Edit', 'quillcrm')}
				</Button>
			),
		},
	];

	const tableConfig: DataTableConfig<ContactList> = {
		manageColumns: {
			enabled: false,
		},
		search: {
			placeholder: __('Search Lists', 'quillcrm'),
		},
		selection: {
			enabled: true,
			selectedKeys: selectedRowKeys,
			onSelectionChange: setSelectedRowKeys,
		},
		bulkActions: {
			enabled: true,
			currentAction: bulkAction,
			onActionChange: setBulkAction,
			onExecuteAction: doBulkAction,
			activeTab: activeTab,
		},
	};

	return (
		<div className="qcrm-contacts-lists-list">
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={closeNotice}
				/>
			)}

			<DataTable
				columns={columns}
				data={lists}
				config={tableConfig}
			/>

			<Dialog open={visible} onOpenChange={(open) => {
				setVisible(open);
				if (!open) {
					setSelectedList(null);
					setList({ name: '', description: '' });
				}
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<CustomDialogHeader
								title={selectedList ? __('Edit List', 'quillcrm') : __('Create List', 'quillcrm')}
								subtitle={__('Add basic information below to add new List', 'quillcrm')}
								icon={<GradientListIcon />}
							/>
						</DialogTitle>
					</DialogHeader>

					<div className="qcrm-fields space-y-4 mt-4">
						<Field
							label={__('List Name', 'quillcrm')}
							value={selectedList ? selectedList.name : list.name}
							onChange={(value) => {
								selectedList
									? setSelectedList({ ...selectedList, name: value })
									: setList({ ...list, name: value });
							}}
							type="text"
						/>
						<Field
							label={__('List Description', 'quillcrm')}
							value={selectedList ? selectedList.description ?? '' : list.description}
							onChange={(value) => {
								selectedList
									? setSelectedList({ ...selectedList, description: value })
									: setList({ ...list, description: value });
							}}
							type="textarea"
						/>
					</div>

					<DialogFooter className="mt-6 w-full">
						<Button
							onClick={() => {
								selectedList ? updateList() : createList();
							}}
							disabled={isSaving}
							size='xl'
							variant="gradient"
							className='w-full'
						>
							{isSaving ? __('Submitting...', 'quillcrm') : __('Submit', 'quillcrm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});

export default Lists;