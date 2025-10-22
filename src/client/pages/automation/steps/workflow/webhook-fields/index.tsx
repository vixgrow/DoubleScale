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
import { Loader2 } from 'lucide-react';
import { isEmpty, map } from 'lodash';

/**
 * Internal dependencies - UI Components
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import { Automation } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
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
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-2.5">
				<p className="text-sm font-medium">{__('Webhook URL')}</p>
				<Input
					value={`${adminUrl}/wp-json/qc/v1/automations/webhook?quillcrm_key=${webhook_key}&quillcrm_id=${automation?.id}`}
					readOnly
				/>
				<p className="text-sm text-muted-foreground">
					{__('Use this URL to send data to QuillCRM.')}
				</p>
			</div>
			<div className="flex flex-col gap-2.5">
				{isEmpty(payload) && (
					<Button onClick={fetchAutomation} disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{__('Receive Data')}
					</Button>
				)}
				{!isEmpty(payload) && (
					<div className="flex flex-col gap-2.5">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{__('Field')}</TableHead>
									<TableHead>{__('Value')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Object.entries(payload).map(([key, value]) => (
									<TableRow key={key}>
										<TableCell>{key}</TableCell>
										<TableCell>{value as string}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<p className="text-sm">
							{__('Received At')}: {convertDate(received_at)}
						</p>
						<Button onClick={fetchAutomation} disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{__('Refresh Data')}
						</Button>
						<div className="flex flex-col gap-2.5">
							<p className="text-sm font-medium">
								{__('Map Fields')}
							</p>
							{map(payload, (_, key) => {
								return (
									<div key={key} className="flex gap-5">
										<Input
											readOnly
											value={key}
											className="flex-1"
										/>
										<Select
											onValueChange={(value) => {
												onChange({
													...values,
													mapped_fields: {
														...mapped_fields,
														[key]: value,
													},
												});
											}}
											value={mapped_fields?.[key] || ''}
										>
											<SelectTrigger className="flex-1">
												<SelectValue placeholder={__('Select field', 'quillcrm')} />
											</SelectTrigger>
											<SelectContent>
												{map(
													contactFieldsGroups,
													(group, groupKey) => (
														<SelectGroup key={groupKey}>
															<SelectLabel>{group.label}</SelectLabel>
															{map(
																group.fields,
																(field, fieldKey) => (
																	<SelectItem
																		key={fieldKey}
																		value={fieldKey}
																	>
																		{field.label}
																	</SelectItem>
																)
															)}
														</SelectGroup>
													)
												)}
											</SelectContent>
										</Select>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default WebhookFields;
