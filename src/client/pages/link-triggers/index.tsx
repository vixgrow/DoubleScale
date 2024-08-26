/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	Table,
	Tag as AntTag,
	Typography,
	Modal,
	Input,
	Button,
	Popover,
	Flex,
} from 'antd';
import { MoreOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { LinkTrigger } from '../types';
import { NavLink, useNavigate, getToLink } from '@quillcrm/navigation';

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
	const { Search } = Input;

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
			})) as any;

			response.total && setTotal(response.total);
			response.data && setData(response.data as LinkTrigger[]);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLinks();
	}, [page, perPage]);

	const createLinkTrigger = async () => {
		if (!link.name) {
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
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="qcrm-link-trigger-list">
			<div className="qcrm-contacts-links-list__actions">
				<div className="qcrm-contacts-links-list__search">
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
						{__('Create Link Trigger', 'quillcrm')}
					</Button>
				</div>
			</div>
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
					dataIndex="count"
					key="count"
					render={(count) => count || 0}
				/>
				<Column
					title={__('Created At', 'quillcrm')}
					dataIndex="created_at"
					key="created_at"
					sorter={(a: LinkTrigger, b: LinkTrigger) =>
						a.created_at.localeCompare(b.created_at)
					}
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
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Name', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Input
								value={link.name}
								onChange={(e) => {
									setLinkTrigger({
										...link,
										name: e.target.value,
									});
								}}
							/>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default LinkTriggerList;
