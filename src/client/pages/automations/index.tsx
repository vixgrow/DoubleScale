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
	Input,
	Button,
	Modal,
	Typography,
	Tabs,
	Flex,
	Select,
} from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Automations,
	Automation,
	AutomationsResponse,
} from '@quillcrm/client';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import type { TriggersGroup } from '@quillcrm/config';
import { Field } from '@quillcrm/components';
import { isEmpty } from 'validator';

const { Column } = Table;

const TriggersGroupRender: React.FC<{
	groups: TriggersGroup[];
	onChange: (value: string) => void;
	value: string;
}> = ({ groups, onChange, value }) => {
	return (
		<Flex gap={20} wrap vertical={true}>
			{map(groups, (group, key) => (
				<div key={key} className="qcrm-automation-triggers-group">
					<Typography.Paragraph
						strong
						className="qcrm-automation-triggers-group__label"
						style={{ marginBottom: '10px' }}
					>
						{group.label}
					</Typography.Paragraph>
					<Flex
						className="qcrm-automation-triggers-group__triggers"
						gap={10}
						wrap
					>
						{map(group.triggers, (trigger, key) => {
							return (
								<Button
									key={key}
									onClick={() => onChange(key)}
									type={value === key ? 'primary' : 'default'}
								>
									{trigger.label}
								</Button>
							);
						})}
					</Flex>
				</div>
			))}
		</Flex>
	);
};

const AutomationsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Automations>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [keyword, setKeyword] = useState('');
	const [visible, setVisible] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [automation, setAutomation] = useState({
		name: '',
		trigger: '',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const navigate = useNavigate();
	const automationTriggers = ConfigAPI.getAutomationTriggers();
	const { createNotice } = useDispatch('quillcrm/core');

	const automationTriggersTabs = map(
		automationTriggers,
		(trigger, index) => ({
			key: index,
			label: trigger.label,
			children: (
				<TriggersGroupRender
					groups={trigger.groups}
					onChange={(value) =>
						setAutomation({ ...automation, trigger: value })
					}
					value={automation.trigger}
				/>
			),
		})
	);

	const fetchAutomations = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/automations', {
					page,
					per_page: perPage,
					keyword,
				}),
				method: 'GET',
			})) as AutomationsResponse;

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

	const createAutomation = async () => {
		if (!validate(automation)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: '/qc/v1/automations',
				method: 'POST',
				data: automation,
			})) as Automation;

			navigate(getToLink(`automations/${response.id}`));
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
				path: '/qc/v1/automations',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			setSelectedRowKeys([]);
			fetchAutomations();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const validate = (automation: Partial<Automation>) => {
		if (isEmpty(automation.name || '', { ignore_whitespace: true })) {
			createNotice({
				type: 'error',
				message: __('Automation name is required', 'quillcrm'),
			});
			return false;
		}

		if (isEmpty(automation.trigger || '')) {
			createNotice({
				type: 'error',
				message: __('Automation trigger is required', 'quillcrm'),
			});
			return false;
		}

		return true;
	};

	useEffect(() => {
		fetchAutomations();
	}, [page, perPage]);

	return (
		<div className="qcrm-automations-list">
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
							fetchAutomations();
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
					{__('Create Automation', 'quillcrm')}
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
					render={(_, record: Automation) => (
						<NavLink to={`automations/${record.id}`}>
							{record.name}
						</NavLink>
					)}
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
				title={__('Create Automation', 'quillcrm')}
				open={visible}
				onOk={createAutomation}
				onCancel={() => setVisible(false)}
				confirmLoading={isSaving}
				style={{ minWidth: '800px' }}
			>
				<div className="qcrm-fields" style={{ marginBottom: '20px' }}>
					<Field
						label={__('Name', 'quillcrm')}
						value={automation.name}
						onChange={(value) =>
							setAutomation({ ...automation, name: value })
						}
						type="text"
					/>
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Trigger', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Tabs
								defaultActiveKey="0"
								tabPosition="left"
								items={automationTriggersTabs}
							/>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default AutomationsList;
