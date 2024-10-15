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
import { isEmail } from 'validator';

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
import ImportModal from '../import-modal';
import { ListField, TagField } from '@quillcrm/components';

const { Column } = Table;

const ContactsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Contact[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [selectedLists, setSelectedLists] = useState<number[]>([]);
	const [selectedTags, setSelectedTags] = useState<number[]>([]);
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
	const [importModalVisible, setImportModalVisible] = useState(false);

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
		if (!isEmail(contact.email)) {
			createNotice({
				type: 'error',
				message: __('Invalid email', 'quillcrm'),
			});
			return;
		}

		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/contacts',
				method: 'POST',
				data: contact,
			})) as Contact;

			navigate(getToLink(`contacts/${response.id}`));
		} catch (error: any) {
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

	const fetchContacts = async (clear: boolean = false) => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					page,
					per_page: perPage,
					keyword: clear ? '' : keyword,
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
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const addToList = async () => {
		if (selectedLists.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a list', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/add-to-list',
				method: 'POST',
				data: { ids: selectedRowKeys, list_ids: selectedLists },
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const removeFromList = async () => {
		if (selectedLists.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a list', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/remove-from-list',
				method: 'POST',
				data: { ids: selectedRowKeys, list_ids: selectedLists },
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const addTag = async () => {
		if (selectedTags.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a tag', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/add-tag',
				method: 'POST',
				data: { ids: selectedRowKeys, tag_ids: selectedTags },
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const removeTag = async () => {
		if (selectedTags.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a tag', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/remove-tag',
				method: 'POST',
				data: { ids: selectedRowKeys, tag_ids: selectedTags },
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const doBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelected();
				break;
			case 'add_to_list':
				addToList();
				break;
			case 'remove_from_list':
				removeFromList();
				break;
			case 'add_tag':
				addTag();
				break;
			case 'remove_tag':
				removeTag();
				break;
			default:
				break;
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
			render: (_, record: Contact) => record.phone || '-',
		},
		{
			title: __('Country', 'quillcrm'),
			dataIndex: 'country',
			key: 'country',
			render: (_, record: Contact) => record.country || '-',
		},
		{
			title: __('City', 'quillcrm'),
			dataIndex: 'city',
			key: 'city',
			render: (_, record: Contact) => record.city || '-',
		},
		{
			title: __('Address 1', 'quillcrm'),
			dataIndex: 'address_1',
			key: 'address_1',
			render: (_, record: Contact) => record.address_1 || '-',
		},
		{
			title: __('Address 2', 'quillcrm'),
			dataIndex: 'address_2',
			key: 'address_2',
			render: (_, record: Contact) => record.address_2 || '-',
		},
		{
			title: __('State', 'quillcrm'),
			dataIndex: 'state',
			key: 'state',
			render: (_, record: Contact) =>
				record ? record.state || '-' : '-',
		},
		{
			title: __('Postal Code', 'quillcrm'),
			dataIndex: 'zip',
			key: 'zip',
			render: (_, record: Contact) => record.zip || '-',
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
							? convertDate(details.lastOrderDate) || '-'
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
								{
									label: __('Add to List', 'quillcrm'),
									value: 'add_to_list',
								},
								{
									label: __('Add Tag', 'quillcrm'),
									value: 'add_tag',
								},
								{
									label: __('Remove from List', 'quillcrm'),
									value: 'remove_from_list',
								},
								{
									label: __('Remove Tag', 'quillcrm'),
									value: 'remove_tag',
								},
							]}
							value={bulkAction}
							onChange={(value) => {
								setBulkAction(value);
								setSelectedLists([]);
								setSelectedTags([]);
							}}
							disabled={selectedRowKeys.length === 0}
						/>
						{(bulkAction === 'add_to_list' ||
							bulkAction === 'remove_from_list') && (
								<ListField
									value={selectedLists}
									onChange={(value) => setSelectedLists(value)}
								/>
							)}
						{(bulkAction === 'add_tag' ||
							bulkAction === 'remove_tag') && (
								<TagField
									value={selectedTags}
									onChange={(value) => setSelectedTags(value)}
								/>
							)}
						<Button
							type="primary"
							onClick={() => doBulkAction(bulkAction)}
							disabled={selectedRowKeys.length === 0}
							loading={isApplying}
						>
							{__('Apply', 'quillcrm')}
						</Button>
					</Flex>
					<Input.Search
						placeholder={__('Search Contacts', 'quillcrm')}
						allowClear
						onSearch={(_value, _e, source) => {
							if ('clear' === source?.source) {
								fetchContacts(true);
								return;
							}
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
												const newColumns = [
													...selectedColumns,
													column.dataIndex,
												];

												newColumns.splice(
													newColumns.indexOf(
														'created_at'
													),
													1
												);
												newColumns.push('created_at');

												setSelectedColumns(newColumns);
											} else {
												const newColumns =
													selectedColumns.filter(
														(col) =>
															col !==
															column.dataIndex
													);

												newColumns.splice(
													newColumns.indexOf(
														'created_at'
													),
													1
												);
												newColumns.push('created_at');

												setSelectedColumns(newColumns);
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
					<Button
						type="primary"
						onClick={() => setImportModalVisible(true)}
					>
						{__('Import Contacts', 'quillcrm')}
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
			<ImportModal
				open={importModalVisible}
				onClose={() => setImportModalVisible(false)}
				onCompleted={() => fetchContacts()}
			/>
		</div>
	);
};

export default ContactsList;
