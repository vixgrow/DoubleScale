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
import React, { forwardRef, useImperativeHandle, useRef } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Tag as ContactTag,
	TagsResponse,
	DataTableConfig,
	NoticeMessage,
} from '@doublescale/client';
import { NoticeBanner, NoData, GradientTagIcon } from '@doublescale/components';
import { isEmpty } from 'validator';
import { DataTable } from '@/components/ui/data-table';
import { TagsDialog } from './tags-dialog';
import { useTagsColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { formatDateForAPI } from '@doublescale/utils';

export interface TagsRef {
	openCreateTagModal: () => void;
}

interface TagsProps {
	activeTab?: string;
}

const Tags = forwardRef<TagsRef, TagsProps>(({ activeTab }, ref) => {
	const [tags, setTags] = useState<ContactTag[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [keyword, setKeyword] = useState<string>('');
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
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
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
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

	// Use the reusable hook
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const fetchTags = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/tags', {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
			})) as TagsResponse;

			setTags(response.data);
			setTotalRecords(response.total);
			setHasRecords((response.total_count || 0) > 0);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTags();
	}, [page, perPage, keyword, dateRange]);

	const createTag = async () => {
		if (!validate(tag)) {
			return;
		}

		setIsSaving(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/tags',
				method: 'POST',
				data: tag,
			});

			setVisible(false);
			setTag({
				name: '',
				description: '',
			});
			showNotice(
				'success',
				__(
					'Your Tag was successfully added  — check it out!',
					'doublescale'
				)
			);
			fetchTags();
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
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
				path: `/doublescale/v1/tags/${selectedTag?.id}`,
				method: 'PUT',
				data: selectedTag,
			})) as ContactTag;

			setTags([
				...tags.map((tag) => (tag.id === response.id ? response : tag)),
			]);

			setVisible(false);
			setSelectedTag(null);
			showNotice('success', __('Tag updated successfully', 'doublescale'));
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
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
				path: '/doublescale/v1/tags',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchTags();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Selected tags deleted successfully', 'doublescale')
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
			setVisible(false);
			showNotice('error', __('Tag name is required', 'doublescale'));
			return false;
		}
		return true;
	};

	const handleEditTag = (tag: ContactTag) => {
		setSelectedTag(tag);
		setVisible(true);
	};

	const handleSubmit = () => {
		selectedTag ? updateTag() : createTag();
	};

	const columns = useTagsColumns({ onEditTag: handleEditTag });

	const tableConfig: DataTableConfig<ContactTag> = {
		manageColumns: {
			enabled: false,
		},
		search: {
			placeholder: __('Search Tags', 'doublescale'),
			onChange: (value) => setKeyword(value),
			value: keyword,
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
			placeholder: __('Date Range', 'doublescale'),
		},
	};

	return (
		<div className="doublescale-contacts-tags-list">
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}

			{loading || hasRecords ? (
				<>
					<DataTable
						columns={columns}
						data={tags}
						activeTab={activeTab}
						config={tableConfig}
						showPagination={false}
						initialPageSize={perPage}
						setPage={setPage}
						loading={loading}
					/>
					<DataTablePagination table={serverSideTable} />
				</>
			) : (
				<NoData
					icon={<GradientTagIcon width={120} height={120} />}
					title={__('No tags yet', 'doublescale')}
					subtitle={__(
						'Get started by creating your first tag to organize your contacts',
						'doublescale'
					)}
					buttonLabel={__('Create Tag', 'doublescale')}
					onClick={() => {
						setSelectedTag(null);
						setTag({
							name: '',
							description: '',
						});
						setVisible(true);
					}}
				/>
			)}

			<TagsDialog
				visible={visible}
				onVisibleChange={setVisible}
				selectedTag={selectedTag}
				tag={tag}
				onTagChange={setTag}
				onSelectedTagChange={setSelectedTag}
				onSubmit={handleSubmit}
				isSaving={isSaving}
			/>
		</div>
	);
});

export default Tags;
