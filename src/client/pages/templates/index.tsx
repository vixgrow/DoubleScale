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
import { Table, Input, Button, Modal, Typography } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CustomTemplate as Template } from '../types';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';

const { Column } = Table;

const TemplatesList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Template[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [keyword, setKeyword] = useState('');
	const [visible, setVisible] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [template, setTemplate] = useState({
		name: '',
	});
	const { createNotice } = useDispatch('quillcrm/core');
	const navigate = useNavigate();
	const Search = Input.Search;

	const fetchTemplates = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/templates', {
					page,
					per_page: perPage,
					keyword,
				}),
				method: 'GET',
			})) as any;

			response.total && setTotal(response.total);
			response.data && setData(response.data as Template[]);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch templates', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTemplates();
	}, [page, perPage]);

	const createTemplate = async () => {
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/templates',
				method: 'POST',
				data: template,
			})) as any;

			setVisible(false);
			navigate(getToLink(`templates/${response.id}`));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to create template', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="qcrm-templates-list">
			<div className="qcrm-contacts-templates-list__actions">
				<div className="qcrm-contacts-templates-list__search">
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
						{__('Create Template', 'quillcrm')}
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
					render={(_, record: Template) => (
						<NavLink to={`templates/${record.id}`}>
							{record.name}
						</NavLink>
					)}
				/>
				<Column
					title={__('Subject', 'quillcrm')}
					dataIndex="subject"
					key="subject"
				/>
				<Column
					title={__('Created At', 'quillcrm')}
					dataIndex="created_at"
					key="created_at"
				/>
			</Table>
			<Modal
				title={__('Create Template', 'quillcrm')}
				open={visible}
				onOk={createTemplate}
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
								value={template.name}
								onChange={(e) => {
									setTemplate({
										...template,
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

export default TemplatesList;
