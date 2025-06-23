import React from 'react';
import { Flex, Button, Input, Select, Popover, Checkbox } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { __ } from '@wordpress/i18n';
import { map } from 'lodash';

export interface BulkActionOption {
	label: string;
	value: string;
}

export interface Column {
	title: string;
	dataIndex: string;
	key?: string;
}

export interface TableActionsProps {
	// Search functionality
	showSearch?: boolean;
	searchPlaceholder?: string;
	searchValue?: string;
	onSearch?: (value: string, clear?: boolean) => void;
	onSearchChange?: (value: string) => void;

	// Bulk actions functionality
	showBulkActions?: boolean;
	bulkActionOptions?: BulkActionOption[];
	selectedBulkAction?: string;
	onBulkActionChange?: (action: string) => void;
	onBulkActionApply?: () => void;
	isBulkActionApplying?: boolean;
	selectedRowsCount?: number;
	bulkActionDisabled?: boolean;

	// Advanced filters functionality
	showAdvancedFilters?: boolean;
	onAdvancedFiltersToggle?: () => void;
	advancedFiltersLabel?: string;

	// Columns functionality
	showColumnsSelector?: boolean;
	columns?: Column[];
	selectedColumns?: string[];
	onColumnsChange?: (columns: string[]) => void;
	columnsLabel?: string;

	// Custom actions
	customActions?: React.ReactNode[];

	// Additional bulk action components (for lists, tags, etc.)
	additionalBulkComponents?: React.ReactNode;

	// Styling
	className?: string;
	leftActionsGap?: number;
	rightActionsGap?: number;
	mainGap?: number;
}

const TableActions: React.FC<TableActionsProps> = ({
	// Search props
	showSearch = false,
	searchPlaceholder = __('Search...', 'quillcrm'),
	searchValue = '',
	onSearch,
	onSearchChange,

	// Bulk actions props
	showBulkActions = false,
	bulkActionOptions = [],
	selectedBulkAction = '',
	onBulkActionChange,
	onBulkActionApply,
	isBulkActionApplying = false,
	selectedRowsCount = 0,
	bulkActionDisabled = false,

	// Advanced filters props
	showAdvancedFilters = false,
	onAdvancedFiltersToggle,
	advancedFiltersLabel = __('Advanced Filters', 'quillcrm'),

	// Columns props
	showColumnsSelector = false,
	columns = [],
	selectedColumns = [],
	onColumnsChange,
	columnsLabel = __('Columns', 'quillcrm'),

	// Custom actions
	customActions = [],
	additionalBulkComponents,

	// Styling
	className = '',
	leftActionsGap = 10,
	rightActionsGap = 10,
	mainGap = 10,
}) => {
	const handleSearchAction = (value: string, e: any, source: any) => {
		if ('clear' === source?.source) {
			onSearch?.(value, true);
			return;
		}
		onSearch?.(value, false);
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onSearchChange?.(e.target.value);
	};

	const handleBulkActionChange = (value: string) => {
		onBulkActionChange?.(value);
	};

	const handleColumnsChange = (columnKey: string, checked: boolean) => {
		if (!onColumnsChange) return;

		let newColumns: string[];

		if (checked) {
			newColumns = [...selectedColumns, columnKey];
		} else {
			newColumns = selectedColumns.filter(col => col !== columnKey);
		}

		// Keep created_at at the end if it exists
		if (newColumns.includes('created_at')) {
			const filteredColumns = newColumns.filter(col => col !== 'created_at');
			newColumns = [...filteredColumns, 'created_at'];
		}

		onColumnsChange(newColumns);
	};

	const renderBulkActions = () => {
		if (!showBulkActions) return null;

		return (
			<Flex gap={leftActionsGap}>
				<Select
					options={bulkActionOptions}
					value={selectedBulkAction}
					onChange={handleBulkActionChange}
					disabled={selectedRowsCount === 0 || bulkActionDisabled}
					style={{ minWidth: 120 }}
				/>

				{additionalBulkComponents}

				<Button
					type="primary"
					onClick={onBulkActionApply}
					disabled={selectedRowsCount === 0 || !selectedBulkAction || bulkActionDisabled}
					loading={isBulkActionApplying}
				>
					{__('Apply', 'quillcrm')}
				</Button>
			</Flex>
		);
	};

	const renderSearch = () => {
		if (!showSearch) return null;

		return (
			<Input.Search
				placeholder={searchPlaceholder}
				allowClear
				onSearch={handleSearchAction}
				onChange={handleSearchChange}
				value={searchValue}
				styles={{
					affixWrapper: {
						padding: '4px 5px',
					},
					input: {
						minHeight: 'auto',
					},
				}}
			/>
		);
	};

	const renderAdvancedFilters = () => {
		if (!showAdvancedFilters) return null;

		return (
			<Button
				onClick={onAdvancedFiltersToggle}
				type="primary"
			>
				{advancedFiltersLabel}
			</Button>
		);
	};

	const renderColumnsSelector = () => {
		if (!showColumnsSelector || columns.length === 0) return null;

		return (
			<Popover
				placement="bottom"
				trigger="click"
				content={
					<Flex vertical>
						{map(columns, (column) => (
							<Checkbox
								key={column.dataIndex}
								checked={selectedColumns.includes(column.dataIndex)}
								onChange={(e) => handleColumnsChange(column.dataIndex, e.target.checked)}
							>
								{column.title}
							</Checkbox>
						))}
					</Flex>
				}
			>
				<Button icon={<UnorderedListOutlined />}>
					{columnsLabel}
				</Button>
			</Popover>
		);
	};

	const renderLeftActions = () => {
		const actions = [
			renderBulkActions(),
			renderSearch(),
			renderAdvancedFilters(),
		].filter(Boolean);

		if (actions.length === 0) return null;

		return (
			<Flex gap={leftActionsGap}>
				{actions}
			</Flex>
		);
	};

	const renderRightActions = () => {
		const actions = [
			renderColumnsSelector(),
			...customActions,
		].filter(Boolean);

		if (actions.length === 0) return null;

		return (
			<Flex gap={rightActionsGap}>
				{actions}
			</Flex>
		);
	};

	const leftActions = renderLeftActions();
	const rightActions = renderRightActions();

	// Don't render anything if no actions are enabled
	if (!leftActions && !rightActions) {
		return null;
	}

	return (
		<Flex
			className={`table-actions ${className}`}
			justify="space-between"
			gap={mainGap}
		>
			{leftActions}
			{rightActions}
		</Flex>
	);
};

export default TableActions;