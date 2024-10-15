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
import { Table, Tag as AntTag, Input, Button, Modal, Flex, Select } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Forms, Form, FormsResponse } from '@quillcrm/client';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import { Field } from '@quillcrm/components';
import { convertDate } from '@quillcrm/utils';
import { isEmpty } from 'validator';

const { Column } = Table;
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
	const [bulkAction, setBulkAction] = useState('');
	const [isApplying, setIsApplying] = useState(false);

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
			})) as FormsResponse;

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

	const createForm = async () => {
		if (isEmpty(form.name, { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Form name is required', 'quillcrm'),
			});
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: '/qc/v1/forms',
				method: 'POST',
				data: form,
			})) as Form;

			navigate(getToLink(`forms/${response.id}`));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		fetchForms();
	}, [page, perPage]);

	const deleteSelected = async () => {
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/forms',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			createNotice({
				type: 'success',
				message: __('Forms deleted', 'quillcrm'),
			});
			setSelectedRowKeys([]);
			fetchForms();
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
		<div className="qcrm-forms-list">
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
							fetchForms();
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
					{__('Create Form', 'quillcrm')}
				</Button>
			</Flex>
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
					render={(text) => convertDate(text)}
				/>
				<Column
					title={__('Updated At')}
					dataIndex="updated_at"
					key="updated_at"
					render={(text) => convertDate(text)}
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
					<Field
						label={__('Name', 'quillcrm')}
						value={form.name}
						onChange={(value) =>
							setForm({
								...form,
								name: value,
							})
						}
						type="text"
					/>
				</div>
			</Modal>
		</div>
	);
};

export default FormsList;
