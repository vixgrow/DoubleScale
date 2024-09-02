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
import { Table, Tag as AntTag, Input, Button, Modal, Typography } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Forms, Form } from '../types';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';

const { Column } = Table;
const { Search } = Input;
const FormsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Forms>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [keyword, setKeyword] = useState('');
	const [visible, setVisible] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState({
		name: '',
	});
	const forms = ConfigAPI.getForms();
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchForms = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/forms', {
					page,
					per_page: perPage,
					keyword,
				}),
				method: 'GET',
			})) as any;

			response.total && setTotal(response.total);
			response.data && setData(response.data as Forms);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch forms', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const createForm = async () => {
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: '/qc/v1/forms',
				method: 'POST',
				data: form,
			})) as Form;

			navigate(getToLink(`forms/${response.id}`));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to create form', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		fetchForms();
	}, [page, perPage]);

	return (
		<div className="qcrm-forms-list">
			<div className="qcrm-contacts-forms-list__actions">
				<div className="qcrm-contacts-forms-list__search">
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
						{__('Create Form', 'quillcrm')}
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
					total,
					onChange: (page, pageSize) => {
						setPage(page);
						setPerPage(pageSize);
					},
				}}
				rowSelection={{
					selectedRowKeys,
					onChange: (selectedRowKeys) =>
						setSelectedRowKeys(selectedRowKeys),
				}}
			>
				<Column
					title={__('Name')}
					dataIndex="name"
					key="name"
					render={(_, record: Form) => (
						<NavLink
							to={
								record.status === 'active'
									? `forms/${record.id}/overview`
									: `forms/${record.id}`
							}
						>
							{record.name}
						</NavLink>
					)}
				/>
				<Column
					title={__('Type')}
					dataIndex="form_type"
					key="form_type"
					render={(_, record: Form) =>
						forms[record.form_type]?.label || ''
					}
				/>
				<Column
					title={__('Form ID')}
					dataIndex="form_id"
					key="form_id"
				/>
				<Column
					title={__('Status')}
					dataIndex="status"
					key="status"
					render={(status) => (
						<AntTag color={status === 'active' ? 'green' : 'red'}>
							{status}
						</AntTag>
					)}
				/>
				<Column
					title={__('Created At')}
					dataIndex="created_at"
					key="created_at"
				/>
				<Column
					title={__('Updated At')}
					dataIndex="updated_at"
					key="updated_at"
				/>
			</Table>
			<Modal
				title={__('Create Form', 'quillcrm')}
				open={visible}
				onOk={createForm}
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
								value={form.name}
								onChange={(e) => {
									setForm({
										...form,
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

export default FormsList;
