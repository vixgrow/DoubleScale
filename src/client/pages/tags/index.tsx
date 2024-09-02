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
import { Tag as ContactTag } from '../types';

const { Column } = Table;

const Tags: React.FC = () => {
	const [tags, setTags] = useState<ContactTag[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [total, setTotal] = useState<number>(0);
	const [keyword, setKeyword] = useState<string>('');
	const { Search } = Input;
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedTag, setSelectedTag] = useState<ContactTag | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [tag, setTag] = useState({
		name: '',
		description: '',
	});
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchTags = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					per_page: perPage,
					page,
					keyword,
				}),
			})) as { data: ContactTag[]; total: number };

			setTags(response.data as ContactTag[]);
			setTotal(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch tags', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTags();
	}, [page, perPage, keyword]);

	const createTag = async () => {
		setIsSaving(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/tags',
				method: 'POST',
				data: tag,
			});

			setTags([...tags, response as ContactTag]);
			setVisible(false);
			setTag({
				name: '',
				description: '',
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to create tag', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateTag = async () => {
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/tags/${selectedTag?.id}`,
				method: 'PUT',
				data: selectedTag,
			})) as any;

			setTags([
				...tags.map((tag) => (tag.id === response.id ? response : tag)),
			]);

			setVisible(false);
			setSelectedTag(null);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to update tag', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const deleteTag = async (id: number) => {
		try {
			await apiFetch({
				path: `/qc/v1/tags/${id}`,
				method: 'DELETE',
			});

			setTags(tags.filter((tag) => tag.id !== id));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to delete tag', 'quillcrm'),
			});
		}
	};

	return (
		<div className="qcrm-contacts-tags-list">
			<Typography.Title level={2}>
				{__('Tags', 'quillcrm')}
			</Typography.Title>
			<div className="qcrm-contacts-tags-list__actions">
				<div className="qcrm-contacts-tags-list__search">
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
						{__('Create Tag', 'quillcrm')}
					</Button>
				</div>
			</div>
			<Table
				dataSource={tags}
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
					render={(_, record: ContactTag) => (
						<div className="qcrm-contacts-tags-list-table__actions">
							<Button
								type="link"
								icon={<EditOutlined />}
								onClick={() => {
									setSelectedTag(record);
									setVisible(true);
								}}
							>
								{__('Edit', 'quillcrm')}
							</Button>
							<Popconfirm
								title={__('Are you sure?', 'quillcrm')}
								onConfirm={() => deleteTag(record.id)}
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
					selectedTag
						? __('Edit Tag', 'quillcrm')
						: __('Create Tag', 'quillcrm')
				}
				open={visible}
				onOk={() => (selectedTag ? updateTag() : createTag())}
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
									selectedTag ? selectedTag.name : tag.name
								}
								onChange={(e) => {
									if (selectedTag) {
										setSelectedTag({
											...selectedTag,
											name: e.target.value,
										});
									} else {
										setTag({
											...tag,
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
									selectedTag
										? selectedTag.description ?? ''
										: tag.description
								}
								onChange={(e) => {
									if (selectedTag) {
										setSelectedTag({
											...selectedTag,
											description: e.target.value,
										});
									} else {
										setTag({
											...tag,
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

export default Tags;
