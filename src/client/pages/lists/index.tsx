/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Typography,
	Table,
	Input,
	Button,
	Modal,
	Popconfirm,
	Flex,
	Popover,
	Select,
} from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { List as ContactList, ListsResponse } from '@quillcrm/client';
import { Field } from '@quillcrm/components';
import { convertDate } from '@quillcrm/utils';
import { isEmpty } from 'validator';

const { Column } = Table;

const Lists: React.FC = () => {
	const [lists, setLists] = useState<ContactList[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [total, setTotal] = useState<number>(0);
	const [keyword, setKeyword] = useState<string>('');
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedList, setSelectedList] = useState<ContactList | null>(
		null
	);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(
		[]
	);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [list, setList] = useState({
		name: '',
		description: '',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');

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
			setTotal(response.total);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLists();
	}, [page, perPage]);

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
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
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
			createNotice({
				type: 'success',
				message: __('List updated successfully', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const deleteList = async (id: number) => {
		try {
			await apiFetch({
				path: `/qc/v1/lists/${id}`,
				method: 'DELETE',
			});

			setLists(lists.filter((list) => list.id !== id));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const deleteSelectedLists = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			// @ts-ignore
			const response = await apiFetch({
				path: '/qc/v1/lists',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			setLists(
				lists.filter(
					(list) => !selectedRowKeys.includes(list.id)
				)
			);
			setSelectedRowKeys([]);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const validate = (list: Partial<ContactList>) => {
		if (isEmpty(list.name || '', { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('List name is required', 'quillcrm'),
			});
			return false;
		}
		return true;
	};

	return (
		<div className="qcrm-contacts-lists-list">
			<Typography.Title level={2}>
				{__('Lists', 'quillcrm')}
			</Typography.Title>
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
									deleteSelectedLists();
								}
							}}
							disabled={selectedRowKeys.length === 0}
							loading={isApplying}
						>
							{__('Apply', 'quillcrm')}
						</Button>
					</Flex>
					<Input.Search
						placeholder={__('Search Lists', 'quillcrm')}
						allowClear
						onSearch={() => {
							fetchLists();
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
				</Flex>
				<Button type="primary" onClick={() => setVisible(true)}>
					{__('Create List', 'quillcrm')}
				</Button>
			</Flex>
			<Table
				dataSource={lists}
				rowKey="id"
				loading={loading}
				pagination={{
					current: page,
					pageSize: perPage,
					total,
					onChange: (newPage) => setPage(newPage),
					onShowSizeChange: (_, newSize) => setPerPage(newSize),
				}}
				rowSelection={{
					selectedRowKeys,
					onChange: (selectedRowKeys) =>
						setSelectedRowKeys(selectedRowKeys),
				}}
			>
				<Column
					title={__('Name', 'quillcrm')}
					dataIndex="name"
					key="name"
					render={(name: string, record: ContactList) => (
						<Flex gap={10} align="center">
							<Popover
								content={
									<Flex vertical gap={10}>
										<Button
											icon={<EditOutlined />}
											onClick={() => {
												setSelectedList(record);
												setVisible(true);
											}}
										>
											{__('Edit', 'quillcrm')}
										</Button>
										<Popconfirm
											title={__(
												'Are you sure?',
												'quillcrm'
											)}
											onConfirm={() =>
												deleteList(record.id)
											}
										>
											<Button
												icon={<DeleteOutlined />}
												danger
											>
												{__('Delete', 'quillcrm')}
											</Button>
										</Popconfirm>
									</Flex>
								}
								trigger="click"
							>
								<MoreOutlined size={40} />
							</Popover>
							<Typography.Text>{name}</Typography.Text>
						</Flex>
					)}
				/>
				<Column
					title={__('Contacts', 'quillcrm')}
					dataIndex="contacts_count"
					key="contacts_count"
					render={(count: number) => count ?? 0}
				/>
				<Column
					title={__('Created At', 'quillcrm')}
					dataIndex="created_at"
					key="created_at"
					render={(date: string) => convertDate(date)}
				/>
			</Table>
			<Modal
				title={
					selectedList
						? __('Edit List', 'quillcrm')
						: __('Create List', 'quillcrm')
				}
				open={visible}
				onOk={() => (selectedList ? updateList() : createList())}
				onCancel={() => setVisible(false)}
				confirmLoading={isSaving}
			>
				<div className="qcrm-fields">
					<Field
						label={__('Name', 'quillcrm')}
						value={selectedList ? selectedList.name : list.name}
						onChange={(value) => {
							if (selectedList) {
								setSelectedList({
									...selectedList,
									name: value,
								});
							} else {
								setList({
									...list,
									name: value,
								});
							}
						}}
						type="text"
					/>
					<Field
						label={__('Description', 'quillcrm')}
						value={
							selectedList
								? selectedList.description ?? ''
								: list.description
						}
						onChange={(value) => {
							if (selectedList) {
								setSelectedList({
									...selectedList,
									description: value,
								});
							} else {
								setList({
									...list,
									description: value,
								});
							}
						}}
						type="textarea"
					/>
				</div>
			</Modal>
		</div>
	);
};

export default Lists;
