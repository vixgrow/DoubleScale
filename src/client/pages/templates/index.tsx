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
import { Table, Input, Button, Modal, Flex, Select } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	CustomTemplate as Template,
	TemplatesResponse,
} from '@quillcrm/client';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';
import { Field } from '@quillcrm/components';
import { convertDate } from '@quillcrm/utils';

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
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');
	const navigate = useNavigate();

	const fetchTemplates = async (clear: boolean = false) => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/templates', {
					page,
					per_page: perPage,
					keyword: clear ? '' : keyword,
				}),
				method: 'GET',
			})) as TemplatesResponse;

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
		fetchTemplates();
	}, [page, perPage]);

	const createTemplate = async () => {
		if (!template.name) {
			createNotice({
				type: 'error',
				message: __('Template name is required', 'quillcrm'),
			});
			return;
		}
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/templates',
				method: 'POST',
				data: template,
			})) as Template;

			setVisible(false);
			navigate(getToLink(`templates/${response.id}`));
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
				path: '/qc/v1/campaigns',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			setSelectedRowKeys([]);
			fetchTemplates();
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
		<div className="qcrm-templates-list">
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
						onSearch={(_value, _e, source) => {
							if (source?.source === 'clear') {
								fetchTemplates(true);
								return;
							}
							fetchTemplates();
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
					{__('Create Template', 'quillcrm')}
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
					render={(date: string) => convertDate(date)}
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
					<Field
						label={__('Name', 'quillcrm')}
						value={template.name}
						onChange={(value) =>
							setTemplate({
								...template,
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

export default TemplatesList;
