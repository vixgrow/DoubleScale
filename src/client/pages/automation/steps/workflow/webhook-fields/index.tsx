/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef, useCallback, useEffect } from '@wordpress/element';
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
import { Progress } from '@/components/ui/progress';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../state/context';
import { Automation } from '@doublescale/client';
import ConfigAPI from '@doublescale/config';
import { convertDate } from '@doublescale/utils';

const POLL_INTERVAL = 2000;
const POLL_DURATION = 120000;

interface WebhookFieldsProps {
	values: { [key: string]: any };
	onChange: (value: any) => void;
}

const WebhookFields: React.FC<WebhookFieldsProps> = ({ values, onChange }) => {
	const { automation } = useAutomationContext();
	const [loading, setLoading] = useState(false);
	const [listening, setListening] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState(0);
	const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const deadlineRef = useRef<number>(0);
	const { webhook_key, payload, received_at, mapped_fields } = values;
	const contactFieldsGroups = ConfigAPI.getContactFieldsGroups();
	const adminUrl = ConfigAPI.getSiteUrl();
	const { createNotice } = useDispatch('doublescale/core');

	const stopListening = useCallback(() => {
		if (pollTimerRef.current) {
			clearInterval(pollTimerRef.current);
			pollTimerRef.current = null;
		}
		if (countdownRef.current) {
			clearInterval(countdownRef.current);
			countdownRef.current = null;
		}
		setListening(false);
		setLoading(false);
		setRemainingSeconds(0);
	}, []);

	useEffect(() => {
		return () => stopListening();
	}, [stopListening]);

	const pollForPayload = useCallback(async () => {
		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/automations/${automation?.id}`,
			})) as Automation;

			if (!isEmpty(response.settings?.payload)) {
				onChange(response.settings);
				stopListening();
			}
		} catch {
			// Silently retry on next interval.
		}
	}, [automation?.id, onChange, stopListening]);

	const startListening = useCallback(() => {
		setListening(true);
		setLoading(true);
		deadlineRef.current = Date.now() + POLL_DURATION;
		setRemainingSeconds(Math.ceil(POLL_DURATION / 1000));

		pollForPayload();

		pollTimerRef.current = setInterval(() => {
			if (Date.now() >= deadlineRef.current) {
				stopListening();
				createNotice({
					type: 'error',
					message: __('No webhook data received. Please try again.', 'doublescale'),
				});
				return;
			}
			pollForPayload();
		}, POLL_INTERVAL);

		countdownRef.current = setInterval(() => {
			const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
			setRemainingSeconds(left);
			if (left <= 0 && countdownRef.current) {
				clearInterval(countdownRef.current);
				countdownRef.current = null;
			}
		}, 1000);
	}, [pollForPayload, stopListening, createNotice]);

	const fetchAutomation = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/automations/${automation?.id}`,
			})) as Automation;

			onChange(response.settings);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automation', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	const progressPercent = listening
		? (remainingSeconds / (POLL_DURATION / 1000)) * 100
		: 0;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-2.5">
				<p className="text-base font-normal text-[#09090B]">{__('Webhook URL')}</p>
				<Input
					value={`${adminUrl}/wp-json/doublescale/v1/automations/webhook?doublescale_key=${webhook_key}&doublescale_id=${automation?.id}`}
					readOnly
				/>
				<p className="text-sm text-muted-foreground">
					{__('Use this URL to send data to DoubleScale.')}
				</p>
			</div>
			<div className="flex flex-col gap-2.5">
				{isEmpty(payload) && (
					<>
						{listening ? (
							<div className="flex flex-col gap-3">
								<div className="flex items-center gap-3">
									<Loader2 className="h-4 w-4 animate-spin text-primary" />
									<span className="text-sm text-muted-foreground">
										{__('Listening for webhook data...', 'doublescale')}{' '}
										<span className="font-medium tabular-nums">
											{remainingSeconds}s
										</span>
									</span>
								</div>
								<Progress value={progressPercent} className="h-1.5" />
								<p className="text-xs text-muted-foreground">
									{__('Send a POST request to the webhook URL above. The data will appear here automatically.', 'doublescale')}
								</p>
								<Button
									onClick={stopListening}
									variant="outline"
									size="sm"
									className="w-fit"
								>
									{__('Stop Listening', 'doublescale')}
								</Button>
							</div>
						) : (
							<Button onClick={startListening} variant="secondaryDeepBlue">
								{__('Receive Data', 'doublescale')}
							</Button>
						)}
					</>
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
									<TableRow key={key} className="text-[#333333]">
										<TableCell>{key}</TableCell>
										<TableCell className="font-mono text-xs whitespace-pre-wrap break-all">
											{value === null || value === undefined
												? ''
												: typeof value === 'object'
													? JSON.stringify(value)
													: String(value)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<p className="text-sm">
							{__('Received At')}: {convertDate(received_at)}
						</p>
						<Button onClick={fetchAutomation} disabled={loading} variant="secondaryDeepBlue">
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{__('Refresh Data')}
						</Button>
						<div className="flex flex-col gap-2.5">
							<p className="text-base font-normal text-[#09090B]">
								{__('Map Fields')}
							</p>
							{map(payload, (_, key) => {
								return (
									<div key={key} className="flex gap-3">
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
												<SelectValue placeholder={__('Select field', 'doublescale')} />
											</SelectTrigger>
											<SelectContent className="max-h-[250px] overflow-y-auto">
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
