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
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Tag as ContactTag,
	TagsResponse,
	DataTableConfig,
	ServerSortState,
	NoticeMessage,
} from '@doublescale/client';
import {
	NoticeBanner,
	NoData,
	GradientTagIcon,
	PageHeader,
	PlusIcon,
} from '@doublescale/components';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { isEmpty } from 'validator';
import { DataTable } from '@/components/ui/data-table';
import { TagsDialog } from './tags-dialog';
import { useTagsColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { formatDateForAPI } from '@doublescale/utils';
import {
	getListPreferences,
	parseSavedDateRange,
	parseSavedSort,
	serializeDateRange,
} from '@doublescale/services/list-preferences-service';
import { useListPreferencesPersistence } from '@doublescale/hooks/use-list-preferences';
import { useNavigate, getToLink } from '@doublescale/navigation';

export interface TagsRef {
	openCreateTagModal: () => void;
}

interface TagsProps {
	activeTab?: string;
}

/**
 * Columns the tags list can be sorted by. Mirrors the server allow-list.
 */
const TAG_SORTABLE_COLUMNS = [
	'name',
	'slug',
	'status',
	'created_at',
	'updated_at',
] as const;

const Tags = forwardRef<TagsRef, TagsProps>(({ activeTab }, ref) => {
	const isCrmManager = useCapabilities().isCrmManager();
	const navigate = useNavigate();
	const [tags, setTags] = useState<ContactTag[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(
		() => getListPreferences('tags').per_page ?? 10
	);
	const [page, setPage] = useState<number>(
		() => getListPreferences('tags').page ?? 1
	);
	const [keyword, setKeyword] = useState<string>(
		() => getListPreferences('tags').keyword ?? ''
	);
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
	}>(() => parseSavedDateRange(getListPreferences('tags').date_range));

	const [sort, setSort] = useState<ServerSortState | null>(() =>
		parseSavedSort(getListPreferences('tags').sort, TAG_SORTABLE_COLUMNS)
	);

	useListPreferencesPersistence(
		'tags',
		useMemo(
			() => ({
				page,
				per_page: perPage,
				keyword,
				date_range: serializeDateRange(dateRange),
				sort,
			}),
			[dateRange, keyword, page, perPage, sort]
		)
	);

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

	const handleOpenCreateTagModal = () => {
		setSelectedTag(null);
		setTag({
			name: '',
			description: '',
		});
		setVisible(true);
	};

	useImperativeHandle(ref, () => ({
		openCreateTagModal: handleOpenCreateTagModal,
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
					...(sort
						? { orderby: sort.orderby, order: sort.order }
						: {}),
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
	}, [page, perPage, keyword, dateRange, sort]);

	// Narrowing the result set invalidates the current page number. Skipped on
	// mount so a restored page survives the initial render.
	const isInitialFilterRun = useRef(true);
	useEffect(() => {
		if (isInitialFilterRun.current) {
			isInitialFilterRun.current = false;
			return;
		}

		setPage(1);
	}, [keyword, dateRange, sort]);


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

	const handleViewContacts = (tagToView: ContactTag) => {
		navigate(getToLink('contacts', { tag_id: tagToView.id }));
	};

	const handleSubmit = () => {
		selectedTag ? updateTag() : createTag();
	};

	const columns = useTagsColumns({
		onEditTag: handleEditTag,
		onViewContacts: handleViewContacts,
		page,
		perPage,
	});

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
		sorting: {
			value: sort,
			onSortChange: setSort,
		},
	};

	return (
		<div className="doublescale-contacts-tags-list">
			<PageHeader
				title={__('Tags', 'doublescale')}
				subtitle={__('Contacts', 'doublescale')}
				actions={
					isCrmManager
						? [
								{
									label: __('Add Tags', 'doublescale'),
									onClick: handleOpenCreateTagModal,
									icon: <PlusIcon />,
								},
							]
						: []
				}
			/>
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}

			<div className="rounded-[20px] bg-white p-6 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]">
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
						onClick={handleOpenCreateTagModal}
					/>
				)}
			</div>

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
