/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useRef } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import React, { forwardRef, useImperativeHandle } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	DataTableConfig,
	NoticeMessage,
} from '@doublescale/client';
import { NoticeBanner, NoData, CategoryIcon } from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import { LevelDialog } from './level-dialog';
import { useLevelsColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { formatDateForAPI } from '@doublescale/utils';

export interface LevelsRef {
	openCreateLevelModal: () => void;
}

interface LevelsProps {
	activeTab?: string;
}

export interface LeadScoringLevel {
	id: number;
	name: string;
	slug: string;
	points: number;
	created_at: string;
	updated_at: string;
}

interface LevelsResponse {
	data: LeadScoringLevel[];
	total: number;
	total_count?: number;
}

const Levels = forwardRef<LevelsRef, LevelsProps>(({ activeTab }, ref) => {
	const [levels, setLevels] = useState<LeadScoringLevel[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [keyword, setKeyword] = useState<string>('');
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedLevel, setSelectedLevel] = useState<LeadScoringLevel | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [level, setLevel] = useState({
		name: '',
		slug: '',
		points: 0,
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
		openCreateLevelModal: () => {
			setSelectedLevel(null);
			setLevel({
				name: '',
				slug: '',
				points: 0,
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

	const fetchLevels = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/lead-scoring-levels', {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
					order: 'asc',
				}),
			})) as LevelsResponse;

			setLevels(response.data);
			setTotalRecords(response.total);
			setHasRecords((response.total_count || 0) > 0);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLevels();
	}, [page, perPage, keyword, dateRange]);

	const validate = (level: Partial<LeadScoringLevel>) => {
		if (!level.name || level.name.trim() === '') {
			setVisible(false);
			showNotice('error', __('Level name is required', 'doublescale'));
			return false;
		}
		if (level.points === undefined || level.points < 0) {
			setVisible(false);
			showNotice('error', __('Points must be a positive number', 'doublescale'));
			return false;
		}
		return true;
	};

	const createLevel = async () => {
		if (!validate(level)) {
			return;
		}

		setIsSaving(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/lead-scoring-levels',
				method: 'POST',
				data: level,
			});

			setVisible(false);
			await fetchLevels();
			showNotice('success', __('Level created successfully', 'doublescale'));
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const updateLevel = async () => {
		if (!selectedLevel || !validate(selectedLevel)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/lead-scoring-levels/${selectedLevel?.id}`,
				method: 'PUT',
				data: selectedLevel,
			})) as LeadScoringLevel;

			setLevels([...levels.map((l) => (l.id === response.id ? response : l))]);

			setVisible(false);
			setSelectedLevel(null);
			showNotice('success', __('Level updated successfully', 'doublescale'));
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const deleteSelectedLevels = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/lead-scoring-levels',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchLevels();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Selected levels deleted successfully', 'doublescale')
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
				deleteSelectedLevels();
				break;
			default:
				break;
		}
	};

	const handleEditLevel = (level: LeadScoringLevel) => {
		setSelectedLevel(level);
		setVisible(true);
	};

	const handleSubmit = () => {
		selectedLevel ? updateLevel() : createLevel();
	};

	const handleCloseModal = () => {
		setVisible(false);
		setSelectedLevel(null);
		setLevel({
			name: '',
			slug: '',
			points: 0,
		});
	};

	const columns = useLevelsColumns({ onEditLevel: handleEditLevel });

	const tableConfig: DataTableConfig<LeadScoringLevel> = {
		manageColumns: {
			enabled: false,
		},
		search: {
			placeholder: __('Search Levels', 'doublescale'),
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
		<div className="doublescale-lead-scoring-levels-list">
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}

			{loading || hasRecords ? (
				<>
					{/* Data Table */}
					<DataTable
						columns={columns}
						data={levels}
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
					icon={<CategoryIcon width={40} height={40} />}
					title={__('No Levels Found', 'doublescale')}
					subtitle={__('Create your first lead scoring level to get started', 'doublescale')}
					buttonLabel={__('Add Level', 'doublescale')}
					onClick={() => {
						setSelectedLevel(null);
						setLevel({
							name: '',
							slug: '',
							points: 0,
						});
						setVisible(true);
					}}
				/>
			)}

			{/* Dialog */}
			<LevelDialog
				visible={visible}
				selectedLevel={selectedLevel}
				level={level}
				isSaving={isSaving}
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				onLevelChange={setLevel}
				onSelectedLevelChange={setSelectedLevel}
			/>
		</div>
	);
});

Levels.displayName = 'Levels';

export default Levels;
