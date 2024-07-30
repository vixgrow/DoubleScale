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
import { Typography, Table, Input, Button, Modal, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { List as ContactList } from '../types';

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
			console.error(error);
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
			console.error(error);
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
		} catch (error) {
			console.error(error);
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
			console.error(error);
		}
	};

	return (
		<div className="qcrm-contacts-lists-list">
			<Typography.Title level={2}>
				{__('Lists', 'quillforms')}
			</Typography.Title>
			<div className="qcrm-contacts-lists-list__actions">
				<div className="qcrm-contacts-lists-list__search">
					<Search
						placeholder={__('Search', 'quillforms')}
						onSearch={(value, _e) => {
							if (value.length < 2 && value.length > 0) {
								return;
							}
							setKeyword(value);
						}}
						enterButton={__('Search', 'quillforms')}
						size="large"
					/>
				</div>
				<div>
					<Button type="primary" onClick={() => setVisible(true)}>
						{__('Create List', 'quillforms')}
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
					title={__('Name', 'quillforms')}
					dataIndex="name"
					key="name"
				/>
				<Column
					title={__('Description', 'quillforms')}
					dataIndex="description"
					key="description"
				/>
				<Column
					title={__('Created At', 'quillforms')}
					dataIndex="created_at"
					key="created_at"
					render={(date: string) => new Date(date).toLocaleString()}
				/>
				<Column
					title={__('Actions', 'quillforms')}
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
								{__('Edit', 'quillforms')}
							</Button>
							<Popconfirm
								title={__('Are you sure?', 'quillforms')}
								onConfirm={() => deleteList(record.id)}
							>
								<Button
									type="link"
									icon={<DeleteOutlined />}
									danger
								>
									{__('Delete', 'quillforms')}
								</Button>
							</Popconfirm>
						</div>
					)}
				/>
			</Table>
			<Modal
				title={
					selectedList
						? __('Edit List', 'quillforms')
						: __('Create List', 'quillforms')
				}
				open={visible}
				onOk={() => (selectedList ? updateList() : createList())}
				onCancel={() => setVisible(false)}
				confirmLoading={isSaving}
			>
				<div className="qcrm-fields">
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Name', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Input
								value={
									selectedList ? selectedList.name : list.name
								}
								onChange={(e) => {
									if (selectedList) {
										setSelectedList({
											...selectedList,
											name: e.target.value,
										});
									} else {
										setList({
											...list,
											name: e.target.value,
										});
									}
								}}
							/>
						</div>
					</div>
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Description', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Input.TextArea
								value={
									selectedList
										? selectedList.description ?? ''
										: list.description
								}
								onChange={(e) => {
									if (selectedList) {
										setSelectedList({
											...selectedList,
											description: e.target.value,
										});
									} else {
										setList({
											...list,
											description: e.target.value,
										});
									}
								}}
							/>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default Lists;
