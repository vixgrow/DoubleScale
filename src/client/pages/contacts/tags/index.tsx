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
import type {
	Tag as ContactTag,
	TagsResponse,
	DataTableConfig,
	NoticeMessage,
} from '@quillcrm/client';
import {
	CustomDialogHeader,
	Field,
	SortIcon,
	NoticeBanner,
	GradientTagIcon,
} from '@quillcrm/components';
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
} from '@/components/ui/dialog';

export interface TagsRef {
	openCreateTagModal: () => void;
}

interface TagsProps {
	activeTab?: string;
}

const selectionColumn: ColumnDef<ContactTag> = {
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

const Tags = forwardRef<TagsRef, TagsProps>(({ activeTab }, ref) => {
	const [tags, setTags] = useState<ContactTag[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [keyword, setKeyword] = useState<string>('');
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedTag, setSelectedTag] = useState<ContactTag | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [tag, setTag] = useState({
		name: '',
		description: '',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});

	useEffect(() => {
		if (dateRange.from || dateRange.to) {
			setPage(1); // Reset to first page when filtering
			fetchTags();
		}
	}, [dateRange]);

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	useImperativeHandle(ref, () => ({
		openCreateTagModal: () => {
			setSelectedTag(null);
			setTag({
				name: '',
				description: '',
			});
			setVisible(true);
		},
	}));

	const fetchTags = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					per_page: perPage,
					page,
					keyword,
				}),
			})) as TagsResponse;

			setTags(response.data);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTags();
	}, [page, perPage, keyword]);

	const createTag = async () => {
		if (!validate(tag)) {
			return;
		}

		setIsSaving(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/tags',
				method: 'POST',
				data: tag,
			});

			setTags([...tags, response as ContactTag]);
			setVisible(false);
			setTag({
				name: '',
				description: '',
			});
			showNotice(
				'success',
				__(
					'Your Tag was successfully added  — check it out!',
					'quillcrm'
				)
			);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsSaving(false);
		}
	};

	const updateTag = async () => {
		if (!selectedTag || !validate(selectedTag)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/tags/${selectedTag?.id}`,
				method: 'PUT',
				data: selectedTag,
			})) as ContactTag;

			setTags([
				...tags.map((tag) => (tag.id === response.id ? response : tag)),
			]);

			setVisible(false);
			setSelectedTag(null);
			showNotice('success', __('Tag updated successfully', 'quillcrm'));
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsSaving(false);
		}
	};

	const deleteSelectedTags = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/tags',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchTags();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Selected tags deleted successfully', 'quillcrm')
			);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const doBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelectedTags();
				break;
			default:
				break;
		}
	};

	const validate = (tag: Partial<ContactTag>) => {
		if (isEmpty(tag.name || '', { ignore_whitespace: true })) {
			showNotice('error', __('Tag name is required', 'quillcrm'));
			return false;
		}
		return true;
	};

	const columns: ColumnDef<ContactTag>[] = [
		selectionColumn,
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Name', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => <span>{row.original.name}</span>,
		},
		{
			accessorKey: 'description',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
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
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Contacts', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (row.original as any).contacts_count ?? 0,
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
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
						setSelectedTag(row.original);
						setVisible(true);
					}}
					variant="ghost"
					className="p-0"
				>
					<EditOutlined />
					{__('Edit', 'quillcrm')}
				</Button>
			),
		},
	];

	const tableConfig: DataTableConfig<ContactTag> = {
		manageColumns: {
			enabled: false,
		},
		search: {
			placeholder: __('Search Tags', 'quillcrm'),
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
		dateRange: {
			enabled: true,
			value: dateRange,
			onDateChange: setDateRange,
			placeholder: __('Date Range', 'quillcrm'),
		},
	};

	return (
		<div className="qcrm-contacts-tags-list">
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner notice={notice} closeNotice={closeNotice} />
			)}

			<DataTable
				columns={columns}
				data={tags}
				config={tableConfig}
				initialPageSize={perPage}
			/>

			<Dialog
				open={visible}
				onOpenChange={(open) => {
					setVisible(open);
					if (!open) {
						setSelectedTag(null);
						setTag({ name: '', description: '' });
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<CustomDialogHeader
								title={
									selectedTag
										? __('Edit Tag', 'quillcrm')
										: __('Create Tag', 'quillcrm')
								}
								subtitle={__(
									'Add basic information below to add new Tag',
									'quillcrm'
								)}
								icon={<GradientTagIcon />}
							/>
						</DialogTitle>
					</DialogHeader>

					<div className="qcrm-fields space-y-4 mt-4">
						<Field
							label={__('Tag Name', 'quillcrm')}
							value={selectedTag ? selectedTag.name : tag.name}
							onChange={(value) => {
								selectedTag
									? setSelectedTag({
											...selectedTag,
											name: value,
										})
									: setTag({ ...tag, name: value });
							}}
							type="text"
						/>
						<Field
							label={__('Tag Description', 'quillcrm')}
							value={
								selectedTag
									? (selectedTag.description ?? '')
									: tag.description
							}
							onChange={(value) => {
								selectedTag
									? setSelectedTag({
											...selectedTag,
											description: value,
										})
									: setTag({ ...tag, description: value });
							}}
							type="textarea"
						/>
					</div>

					<DialogFooter className="mt-6 w-full">
						<Button
							onClick={() => {
								selectedTag ? updateTag() : createTag();
							}}
							disabled={isSaving}
							size="xl"
							variant="gradient"
							className="w-full"
						>
							{isSaving
								? __('Submitting...', 'quillcrm')
								: __('Submit', 'quillcrm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});

export default Tags;
