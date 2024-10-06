/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Input, Typography, Table, Flex, Button, Select } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import { Automation } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import { isEmpty, map } from 'lodash';
import { convertDate } from '@quillcrm/utils';

interface WebhookFieldsProps {
	values: { [key: string]: any };
	onChange: (value: any) => void;
}

const WebhookFields: React.FC<WebhookFieldsProps> = ({ values, onChange }) => {
	const { automation } = useAutomationContext();
	const [loading, setLoading] = useState(false);
	const { webhook_key, payload, received_at, mapped_fields } = values;
	const contactFieldsGroups = ConfigAPI.getContactFieldsGroups();
	const adminUrl = ConfigAPI.getSiteUrl();
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchAutomation = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${automation?.id}`,
			})) as Automation;

			onChange(response.settings);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automation', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Flex gap={20} vertical>
			<Flex gap={10} vertical>
				<Typography.Text>{__('Webhook URL')}</Typography.Text>
				<Input
					value={`${adminUrl}/wp-json/qc/v1/automation/webhook/?quillcrm_key=${webhook_key}&quillcrm_id=${automation?.id}`}
					readOnly
				/>
				<Typography.Text type="secondary">
					{__('Use this URL to send data to QuillCRM.')}
				</Typography.Text>
			</Flex>
			<Flex gap={10} vertical>
				{isEmpty(payload) && (
					<Button onClick={fetchAutomation} loading={loading}>
						{__('Receive Data')}
					</Button>
				)}
				{!isEmpty(payload) && (
					<Flex gap={10} vertical>
						<Table
							dataSource={Object.entries(payload)}
							pagination={false}
						>
							<Table.Column
								title={__('Field')}
								dataIndex={0}
								key={0}
							/>
							<Table.Column
								title={__('Value')}
								dataIndex={1}
								key={1}
							/>
						</Table>
						<Typography.Text>
							{__('Received At')}: {convertDate(received_at)}
						</Typography.Text>
						<Button onClick={fetchAutomation} loading={loading}>
							{__('Refresh Data')}
						</Button>
						<Flex gap={10} vertical>
							<Typography.Text>
								{__('Map Fields')}
							</Typography.Text>
							{map(payload, (_, key) => {
								return (
									<Flex key={key} gap={20}>
										<Input
											readOnly
											value={key}
											style={{ flex: 1 }}
										/>
										<Select
											onChange={(value) => {
												onChange({
													...values,
													mapped_fields: {
														...mapped_fields,
														[key]: value,
													},
												});
											}}
											value={mapped_fields?.[key] || ''}
											options={map(
												contactFieldsGroups,
												(group, groupKey) => ({
													label: group.label,
													value: groupKey,
													options: map(
														group.fields,
														(field, fieldKey) => ({
															label: field.label,
															value: fieldKey,
														})
													),
												})
											)}
											style={{ flex: 1 }}
										/>
									</Flex>
								);
							})}
						</Flex>
					</Flex>
				)}
			</Flex>
		</Flex>
	);
};

export default WebhookFields;
