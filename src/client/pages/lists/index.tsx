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
import { Typography, Table, Input, Button, Modal, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { List as ContactList } from '@quillcrm/client';
import { Field } from '@quillcrm/components';

const { Column } = Table;

const Lists: React.FC = () => {
	const [lists, setLists] = useState<ContactList[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [total, setTotal] = useState<number>(0);
	const [keyword, setKeyword] = useState<string>('');
	const { Search } = Input;
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedList, setSelectedList] = useState<ContactList | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [list, setList] = useState({
		name: '',
		description: '',
	});
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
			})) as { data: ContactList[]; total: number };

			setLists(response.data as ContactList[]);
			setTotal(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch lists', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLists();
	}, [page, perPage, keyword]);

	const createList = async () => {
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
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to create list', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateList = async () => {
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/lists/${selectedList?.id}`,
				method: 'PUT',
				data: selectedList,
			})) as any;

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
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to update list', 'quillcrm'),
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
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to delete list', 'quillcrm'),
			});
		}
	};

	return (
		<div className="qcrm-contacts-lists-list">
			<Typography.Title level={2}>
				{__('Lists', 'quillcrm')}
			</Typography.Title>
			<div className="qcrm-contacts-lists-list__actions">
				<div className="qcrm-contacts-lists-list__search">
					<Search
						placeholder={__('Search', 'quillcrm')}
						onSearch={(value, _e) => {
							if (value.length < 2 && value.length > 0) {
								return;
							}
							setKeyword(value);
						}}
						enterButton={__('Search', 'quillcrm')}
						size="large"
					/>
				</div>
				<div>
					<Button type="primary" onClick={() => setVisible(true)}>
						{__('Create List', 'quillcrm')}
					</Button>
				</div>
			</div>
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
				/>
				<Column
					title={__('Description', 'quillcrm')}
					dataIndex="description"
					key="description"
				/>
				<Column
					title={__('Created At', 'quillcrm')}
					dataIndex="created_at"
					key="created_at"
					render={(date: string) => new Date(date).toLocaleString()}
				/>
				<Column
					title={__('Actions', 'quillcrm')}
					key="actions"
					render={(_, record: ContactList) => (
						<div className="qcrm-contacts-lists-list-table__actions">
							<Button
								type="link"
								icon={<EditOutlined />}
								onClick={() => {
									setSelectedList(record);
									setVisible(true);
								}}
							>
								{__('Edit', 'quillcrm')}
							</Button>
							<Popconfirm
								title={__('Are you sure?', 'quillcrm')}
								onConfirm={() => deleteList(record.id)}
							>
								<Button
									type="link"
									icon={<DeleteOutlined />}
									danger
								>
									{__('Delete', 'quillcrm')}
								</Button>
							</Popconfirm>
						</div>
					)}
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
