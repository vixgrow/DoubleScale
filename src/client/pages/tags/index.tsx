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
	Select,
	Popover,
} from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Tag as ContactTag, TagsResponse } from '@quillcrm/client';
import { Field } from '@quillcrm/components';
import { convertDate } from '@quillcrm/utils';
import { isEmpty } from 'validator';

const { Column } = Table;

const Tags: React.FC = () => {
	const [tags, setTags] = useState<ContactTag[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [total, setTotal] = useState<number>(0);
	const [keyword, setKeyword] = useState<string>('');
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
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchTags = async (clear: boolean = false) => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					per_page: perPage,
					page,
					keyword: clear ? '' : keyword,
				}),
			})) as TagsResponse;

			setTags(response.data);
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
		fetchTags();
	}, [page, perPage]);

	const createTag = async () => {
		if (!validate(tag)) {
			return;
		}

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
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateTag = async () => {
		if (!selectedTag) {
			return;
		}

		if (!validate(selectedTag)) {
			return;
		}

		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/tags/${selectedTag?.id}`,
				method: 'PUT',
				data: selectedTag,
			})) as ContactTag;

			setTags([
				...tags.map((tag) => (tag.id === response.id ? response : tag)),
			]);

			setVisible(false);
			setSelectedTag(null);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
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
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const deleteSelectedTags = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			// @ts-ignore
			const response = await apiFetch({
				path: '/qc/v1/tags',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			setTags(tags.filter((tag) => !selectedRowKeys.includes(tag.id)));
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

	const validate = (tag: Partial<ContactTag>) => {
		if (isEmpty(tag.name || '', { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Tag name is required', 'quillcrm'),
			});
			return false;
		}

		return true;
	};

	return (
		<div className="qcrm-contacts-tags-list">
			<Typography.Title level={2}>
				{__('Tags', 'quillcrm')}
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
									deleteSelectedTags();
								}
							}}
							disabled={selectedRowKeys.length === 0}
							loading={isApplying}
						>
							{__('Apply', 'quillcrm')}
						</Button>
					</Flex>
					<Input.Search
						placeholder={__('Search Tags', 'quillcrm')}
						allowClear
						onSearch={(_value, _e, source) => {
							if (source?.source === 'clear') {
								fetchTags(true);
								return;
							}
							fetchTags();
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
					{__('Create Tag', 'quillcrm')}
				</Button>
			</Flex>
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
					render={(name: string, record: ContactTag) => (
						<Flex gap={10} align="center">
							<Popover
								content={
									<Flex vertical gap={10}>
										<Button
											icon={<EditOutlined />}
											onClick={() => {
												setSelectedTag(record);
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
												deleteTag(record.id)
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
					<Field
						label={__('Name', 'quillcrm')}
						value={selectedTag ? selectedTag.name : tag.name}
						onChange={(value) => {
							if (selectedTag) {
								setSelectedTag({
									...selectedTag,
									name: value,
								});
							} else {
								setTag({
									...tag,
									name: value,
								});
							}
						}}
						type="text"
					/>
					<Field
						label={__('Description', 'quillcrm')}
						value={
							selectedTag
								? selectedTag.description ?? ''
								: tag.description
						}
						onChange={(value) => {
							if (selectedTag) {
								setSelectedTag({
									...selectedTag,
									description: value,
								});
							} else {
								setTag({
									...tag,
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

export default Tags;
