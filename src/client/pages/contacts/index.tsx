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
	Modal,
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
	ContactsResponse,
} from '@quillcrm/client';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import { Filters, Field } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';

const { Column } = Table;

const ContactsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Contact[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const { createNotice } = useDispatch('quillcrm/core');
	const isWooCommerceActive = ConfigAPI.isWoocommerceActive();
	const defaultSelectedColumns = [
		'full_name',
		'email',
		'status',
		'phone',
		'country',
		'created_at',
	];
	const navigate = useNavigate();
	const [contact, setContact] = useState({
		email: '',
		first_name: '',
		last_name: '',
	});
	const [isSaving, setIsSaving] = useState(false);

	if (isWooCommerceActive) {
		defaultSelectedColumns.push('total_orders');
		defaultSelectedColumns.push('total_revenue');
		defaultSelectedColumns.push('last_order_date');
		// Move created_at to the end
		defaultSelectedColumns.splice(
			defaultSelectedColumns.indexOf('created_at'),
			1
		);
		defaultSelectedColumns.push('created_at');
	}

	const [selectedColumns, setSelectedColumns] = useState<string[]>(
		defaultSelectedColumns
	);
	const [keyword, setKeyword] = useState<string>('');
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<FilterType[]>([]);
	const [isFiltering, setIsFiltering] = useState(false);
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState(false);
	const [visible, setVisible] = useState(false);

	const createContact = async () => {
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: '/qc/v1/contacts',
				method: 'POST',
				data: contact,
			})) as Contact;

			navigate(getToLink(`contacts/${response.id}`));
		} catch (error) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to create Contact', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const getContactOrderDetails = (contact: Contact) => {
		const details = {
			orders: 0,
			revenue: '-',
			lastOrderDate: '-',
		};
		if (!isWooCommerceActive) {
			return details;
		}

		if (!contact.orders || contact.orders.length === 0) {
			return details;
		}

		details.orders = contact.orders.length;
		details.revenue = contact.revenue || '-';
		details.lastOrderDate = contact.orders[0].date_created_gmt;

		return details;
	};

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
			})) as ContactsResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
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

	if (isWooCommerceActive) {
		columns.push({
			title: __('Total Orders', 'quillcrm'),
			dataIndex: 'total_orders',
			key: 'total_orders',
			render: (_, record: Contact) => {
				const details = getContactOrderDetails(record);
				return <>{details.orders}</>;
			},
		});

		columns.push({
			title: __('Total Revenue', 'quillcrm'),
			dataIndex: 'total_revenue',
			key: 'total_revenue',
			render: (_, record: Contact) => {
				const details = getContactOrderDetails(record);
				return <>{details.revenue}</>;
			},
		});

		columns.push({
			title: __('Last Order Date', 'quillcrm'),
			dataIndex: 'last_order_date',
			key: 'last_order_date',
			render: (_, record: Contact) => {
				const details = getContactOrderDetails(record);
				return (
					<>
						{details.lastOrderDate
							? convertDate(details.lastOrderDate)
							: '-'}
					</>
				);
			},
		});
	}

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
					<Button type="primary" onClick={() => setVisible(true)}>
						{__('Create Contact', 'quillcrm')}
					</Button>
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
			<Modal
				title={__('Create Form', 'quillcrm')}
				open={visible}
				onOk={createContact}
				onCancel={() => setVisible(false)}
				confirmLoading={isSaving}
			>
				<div className="qcrm-fields">
					<Field
						label={__('Email', 'quillcrm')}
						value={contact.email}
						onChange={(value) =>
							setContact({
								...contact,
								email: value,
							})
						}
						type="email"
					/>
					<Field
						label={__('First Name', 'quillcrm')}
						value={contact.first_name}
						onChange={(value) =>
							setContact({
								...contact,
								first_name: value,
							})
						}
						type="text"
					/>
					<Field
						label={__('Last Name', 'quillcrm')}
						value={contact.last_name}
						onChange={(value) =>
							setContact({
								...contact,
								last_name: value,
							})
						}
						type="text"
					/>
				</div>
			</Modal>
		</div>
	);
};

export default ContactsList;
