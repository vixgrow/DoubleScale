/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Table,
	Tag as AntTag,
	Popover,
	Flex,
	Button,
	Input,
	Checkbox,
	Select,
} from 'antd';
import { UserOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Contact,
	Tag,
	List,
	Filter as FilterType,
} from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import { Filters } from '@quillcrm/components';

const { Column } = Table;

const ContactsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Contact[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const { createNotice } = useDispatch('quillcrm/core');
	const [selectedColumns, setSelectedColumns] = useState<string[]>([
		'full_name',
		'email',
		'status',
		'phone',
		'country',
		'created_at',
	]);
	const [keyword, setKeyword] = useState<string>('');
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<FilterType[]>([]);
	const [isFiltering, setIsFiltering] = useState(false);
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState(false);

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					page,
					per_page: perPage,
					keyword,
					filters: filters,
				}),
				method: 'GET',
			})) as any;

			response.total && setTotal(response.total);
			response.data && setData(response.data as Contact[]);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch contacts', 'quillcrm'),
			});
		} finally {
			setLoading(false);
			setIsFiltering(false);
		}
	};

	const deleteSelected = async () => {
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to delete contacts', 'quillcrm'),
			});
		} finally {
			setIsApplying(false);
		}
	};

	useEffect(() => {
		fetchContacts();
	}, [page, perPage]);

	const columns = [
		{
			title: __('Full Name', 'quillcrm'),
			dataIndex: 'full_name',
			key: 'full_name',
			render: (_, record: Contact) => (
				<NavLink to={`contacts/${record.id}`}>
					<Flex gap={10} align="center">
						<div className="qcrm-contacts-list__avatar">
							<UserOutlined />
						</div>
						{record.first_name || '-'} {record.last_name || '-'}
					</Flex>
				</NavLink>
			),
		},
		{
			title: __('Email', 'quillcrm'),
			dataIndex: 'email',
			key: 'email',
			sorter: (a: Contact, b: Contact) => a.email.localeCompare(b.email),
			render: (_, record: Contact) => (
				<NavLink to={`contacts/${record.id}`}>{record.email}</NavLink>
			),
		},
		{
			title: 'Tag',
			dataIndex: 'tags',
			key: 'tags',
			render: (tags: Tag[]) =>
				tags.map((tag) => <AntTag key={tag.id}>{tag.name}</AntTag>),
		},
		{
			title: 'List',
			dataIndex: 'lists',
			key: 'lists',
			render: (lists: List[]) =>
				lists.map((list) => <AntTag key={list.id}>{list.name}</AntTag>),
		},
		{
			title: __('Status', 'quillcrm'),
			dataIndex: 'status',
			key: 'status',
			sorter: (a: Contact, b: Contact) =>
				a.status.localeCompare(b.status),
		},
		{
			title: __('Phone', 'quillcrm'),
			dataIndex: 'phone',
			key: 'phone',
		},
		{
			title: __('Country', 'quillcrm'),
			dataIndex: 'country',
			key: 'country',
		},
		{
			title: __('City', 'quillcrm'),
			dataIndex: 'city',
			key: 'city',
		},
		{
			title: __('Address 1', 'quillcrm'),
			dataIndex: 'address_1',
			key: 'address_1',
		},
		{
			title: __('Address 2', 'quillcrm'),
			dataIndex: 'address_2',
			key: 'address_2',
		},
		{
			title: __('State', 'quillcrm'),
			dataIndex: 'state',
			key: 'state',
		},
		{
			title: __('Postal Code', 'quillcrm'),
			dataIndex: 'zip',
			key: 'zip',
		},
		{
			title: __('Created At', 'quillcrm'),
			dataIndex: 'created_at',
			key: 'created_at',
			render: (date: string) => convertDate(date),
		},
	];

	return (
		<div className="qcrm-contacts-list">
			<Flex
				className="qcrm-contacts-list__actions"
				justify="space-between"
			>
				<Flex gap={10}>
					<Flex gap={10}>
						<Select
							options={[
								{
									label: __('Bulk Actions', 'quillcrm'),
									value: '',
								},
								{
									label: __('Delete', 'quillcrm'),
									value: 'delete',
								},
							]}
							value={bulkAction}
							onChange={(value) => setBulkAction(value)}
							disabled={selectedRowKeys.length === 0}
						/>
						<Button
							type="primary"
							onClick={() => {
								if (bulkAction === 'delete') {
									deleteSelected();
								}
							}}
							disabled={selectedRowKeys.length === 0}
							loading={isApplying}
						>
							{__('Apply', 'quillcrm')}
						</Button>
					</Flex>
					<Input.Search
						placeholder={__('Search Contacts', 'quillcrm')}
						allowClear
						onSearch={() => {
							fetchContacts();
						}}
						onChange={(e) => setKeyword(e.target.value)}
						styles={{
							affixWrapper: {
								padding: '4px 5px',
							},
							input: {
								minHeight: 'auto',
							},
						}}
					/>
					<Button
						onClick={() => setShowFilters(!showFilters)}
						type="primary"
					>
						{__('Advanced Filters', 'quillcrm')}
					</Button>
				</Flex>
				<Flex gap={10}>
					<Popover
						placement="bottom"
						trigger="click"
						content={
							<Flex vertical>
								{map(columns, (column) => (
									<Checkbox
										key={column.dataIndex}
										checked={selectedColumns.includes(
											column.dataIndex
										)}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedColumns([
													...selectedColumns,
													column.dataIndex,
												]);
											} else {
												setSelectedColumns(
													selectedColumns.filter(
														(col) =>
															col !==
															column.dataIndex
													)
												);
											}
										}}
									>
										{column.title}
									</Checkbox>
								))}
							</Flex>
						}
					>
						<Button icon={<UnorderedListOutlined />}>
							{__('Columns', 'quillcrm')}
						</Button>
					</Popover>
				</Flex>
			</Flex>
			{showFilters && (
				<div className="qcrm-contacts-list__filters">
					<Filters
						filters={filters}
						onChange={setFilters}
						onApply={() => {
							setPage(1);
							fetchContacts();
						}}
						isApplying={isFiltering}
					/>
				</div>
			)}
			<Table
				dataSource={data}
				rowKey="id"
				loading={loading}
				pagination={{
					current: page,
					pageSize: perPage,
					total: total,
					onChange: (page, perPage) => {
						setPage(page);
						setPerPage(perPage);
					},
				}}
				rowSelection={{
					selectedRowKeys,
					onChange: (selectedRowKeys) =>
						setSelectedRowKeys(selectedRowKeys),
				}}
			>
				{map(selectedColumns, (column) => {
					const columnData = columns.find(
						(col) => col.dataIndex === column
					);
					if (!columnData) {
						return null;
					}

					return <Column {...columnData} />;
				})}
			</Table>
		</div>
	);
};

export default ContactsList;
