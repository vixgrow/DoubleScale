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
} from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Automations, Automation } from '../types';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import type { TriggersGroup } from '@quillcrm/config';

const { Column } = Table;
const { Search } = Input;

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
			})) as any;

			response.total && setTotal(response.total);
			response.data && setData(response.data as Automations);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automations', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const createAutomation = async () => {
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: '/qc/v1/automations',
				method: 'POST',
				data: automation,
			})) as Automation;

			navigate(getToLink(`automations/${response.id}`));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to create automation', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		fetchAutomations();
	}, [page, perPage]);
	console.log(automation);

	return (
		<div className="qcrm-automations-list">
			<div className="qcrm-contacts-automations-list__actions">
				<div className="qcrm-contacts-automations-list__search">
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
						{__('Create Automation', 'quillcrm')}
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
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Name', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Input
								value={automation.name}
								onChange={(e) => {
									setAutomation({
										...automation,
										name: e.target.value,
									});
								}}
							/>
						</div>
					</div>
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
