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
	Modal,
	Input,
	Button,
	Popover,
	Flex,
	Select,
} from 'antd';
import { MoreOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { LinkTrigger, LinkTriggersResponse } from '@quillcrm/client';
import { NavLink, useNavigate, getToLink } from '@quillcrm/navigation';
import { Field } from '@quillcrm/components';
import { convertDate } from '@quillcrm/utils';
import { isEmpty } from 'validator';

const { Column } = Table;

const LinkTriggerList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<LinkTrigger[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [visible, setVisible] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [link, setLinkTrigger] = useState({
		name: '',
		status: 'inactive',
	});
	const [keyword, setKeyword] = useState('');
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');
	const [bulkAction, setBulkAction] = useState('');
	const [isApplying, setIsApplying] = useState(false);

	const fetchLinks = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/link-triggers', {
					page,
					per_page: perPage,
					keyword,
				}),
				method: 'GET',
			})) as LinkTriggersResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
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
		fetchLinks();
	}, [page, perPage]);

	const createLinkTrigger = async () => {
		if (isEmpty(link.name, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Link trigger name is required', 'quillcrm'),
			});
			return;
		}
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/link-triggers',
				method: 'POST',
				data: link,
			})) as LinkTrigger;

			setVisible(false);
			navigate(getToLink(`link-triggers/${response.id}`));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const deleteSelected = async () => {
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/link-triggers',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			createNotice({
				type: 'success',
				message: __('Link triggers deleted', 'quillcrm'),
			});
			setSelectedRowKeys([]);
			fetchLinks();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	return (
		<div className="qcrm-link-trigger-list">
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
						placeholder={__('Search', 'quillcrm')}
						allowClear
						onSearch={() => {
							fetchLinks();
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
					{__('Create Link', 'quillcrm')}
				</Button>
			</Flex>
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
				<Column
					title={__('Name', 'quillcrm')}
					dataIndex="name"
					key="name"
					render={(_, record: LinkTrigger) => (
						<Flex>
							<Popover
								content={
									<Button
										type="link"
										onClick={() => {
											navigator.clipboard.writeText(
												record.full_url
											);
										}}
									>
										{__('Copy', 'quillcrm')}
									</Button>
								}
								trigger="click"
							>
								<MoreOutlined />
							</Popover>
							<NavLink to={`link-triggers/${record.id}`}>
								{record.name}
							</NavLink>
						</Flex>
					)}
				/>
				<Column
					title={__('Status', 'quillcrm')}
					dataIndex="status"
					key="status"
					sorter={(a: LinkTrigger, b: LinkTrigger) =>
						a.status.localeCompare(b.status)
					}
					render={(status) => (
						<AntTag color={status === 'active' ? 'green' : 'red'}>
							{status}
						</AntTag>
					)}
				/>
				<Column
					title={__('Clicks', 'quillcrm')}
					dataIndex="click_count"
					key="click_count"
					render={(click_count) => click_count || 0}
				/>
				<Column
					title={__('Created At', 'quillcrm')}
					dataIndex="created_at"
					key="created_at"
					sorter={(a: LinkTrigger, b: LinkTrigger) =>
						a.created_at.localeCompare(b.created_at)
					}
					render={(created_at) => convertDate(created_at)}
				/>
			</Table>
			<Modal
				title={__('Create Link Trigger', 'quillcrm')}
				open={visible}
				onOk={createLinkTrigger}
				onCancel={() => setVisible(false)}
				confirmLoading={isSaving}
			>
				<div className="qcrm-fields">
					<Field
						label={__('Name', 'quillcrm')}
						value={link.name}
						onChange={(value) =>
							setLinkTrigger({ ...link, name: value })
						}
						type="text"
					/>
				</div>
			</Modal>
		</div>
	);
};

export default LinkTriggerList;
