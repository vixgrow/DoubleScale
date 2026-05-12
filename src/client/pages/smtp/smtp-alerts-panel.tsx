/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	fetchSmtpSettings,
	saveSmtpSettings,
	testSmtpAlert,
} from '../settings/smtp/smtp-api';
import SlackIcon from '../../../components/icons/slack';
import WebhookIcon from '../../../components/icons/webhook';
import DiscordIcon from '@doublescale/shared/icons/discord';
import { PlusIcon } from '@doublescale/components';
import TrashIcon from '@doublescale/shared/icons/trash';


export type SmtpAlertsSettings = {
	enable_slack_alerts?: boolean;
	slack_data?: string[];
	enable_webhook_alerts?: boolean;
	webhook_data?: string[];
	enable_discord_alerts?: boolean;
	discord_data?: string[];
};

export type SmtpAlertsPanelProps = {
	onDirtyChange?: (dirty: boolean) => void;
	onSavingChange?: (saving: boolean) => void;
	saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
	draftSettings?: SmtpAlertsSettings | null;
	onSettingsChange?: (settings: SmtpAlertsSettings) => void;
};

const defaultAlerts = (): SmtpAlertsSettings => ({
	enable_slack_alerts: false,
	slack_data: [],
	enable_webhook_alerts: false,
	webhook_data: [],
	enable_discord_alerts: false,
	discord_data: [],
});

/** Stable JSON snapshot used for dirty comparison. */
const snapshot = (s: SmtpAlertsSettings) => JSON.stringify(s);

const SmtpAlertsPanel: React.FC<SmtpAlertsPanelProps> = ({
	onDirtyChange,
	onSavingChange,
	saveRef,
	draftSettings,
	onSettingsChange,
}) => {
	const { createNotice } = useDispatch('doublescale/core') as {
		createNotice: (n: { type: string; message: string }) => void;
	};

	const [settings, setSettings] = useState<SmtpAlertsSettings>(defaultAlerts());
	const [loading, setLoading] = useState(true);
	const [, setSaving] = useState(false);
	const [testing, setTesting] = useState(false);

	const savedSnapshot = useRef<string>(snapshot(defaultAlerts()));

	useEffect(() => {
		onDirtyChange?.(snapshot(settings) !== savedSnapshot.current);
	}, [settings, onDirtyChange]);

	const reload = useCallback(async () => {
		setLoading(true);
		try {
			if (draftSettings) {
				setSettings(draftSettings);
				onDirtyChange?.(true);
				return;
			}
			const data = (await fetchSmtpSettings()) as Record<string, unknown>;
			const raw = (data.alerts_settings as SmtpAlertsSettings) || {};
			const merged = { ...defaultAlerts(), ...raw };
			savedSnapshot.current = snapshot(merged);
			setSettings(merged);
			onDirtyChange?.(false);
		} catch {
			createNotice({
				type: 'error',
				message: __('Could not load alert settings.', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	}, [draftSettings, onDirtyChange]);

	useEffect(() => {
		void reload();
	}, [reload]);

	useEffect(() => {
		if (!saveRef) return;
		saveRef.current = async () => {
			await doSave();
		};
	});

	const setField = <K extends keyof SmtpAlertsSettings>(
		key: K,
		value: SmtpAlertsSettings[K]
	) => {
		setSettings((s) => {
			const next = { ...s, [key]: value };
			onSettingsChange?.(next);
			return next;
		});
	};

	const sanitizeForSave = (s: SmtpAlertsSettings): SmtpAlertsSettings => ({
		...s,
		slack_data: (s.slack_data || []).filter((u) => u.trim() !== ''),
		webhook_data: (s.webhook_data || []).filter((u) => u.trim() !== ''),
		discord_data: (s.discord_data || []).filter((u) => u.trim() !== ''),
	});

	const hasRequiredUrls = (s: SmtpAlertsSettings): boolean => {
		if (s.enable_slack_alerts && (s.slack_data || []).length === 0) return false;
		if (s.enable_webhook_alerts && (s.webhook_data || []).length === 0) return false;
		if (s.enable_discord_alerts && (s.discord_data || []).length === 0) return false;
		return true;
	};

	const doSave = async () => {
		setSaving(true);
		onSavingChange?.(true);
		try {
			const valid = sanitizeForSave(settings);
			if (!hasRequiredUrls(valid)) {
				createNotice({
					type: 'error',
					message: __('Please add at least one webhook URL for each enabled alert channel.', 'doublescale'),
				});
				return;
			}
			await saveSmtpSettings({ alerts_settings: valid as Record<string, unknown> });
			savedSnapshot.current = snapshot(valid);
			setSettings(valid);
			onSettingsChange?.(valid);
			onDirtyChange?.(false);
			createNotice({
				type: 'success',
				message: __('Settings saved successfully.', 'doublescale'),
			});
		} catch {
			createNotice({
				type: 'error',
				message: __('Failed to save settings.', 'doublescale'),
			});
		} finally {
			setSaving(false);
			onSavingChange?.(false);
		}
	};

	const test = async (slug: 'slack' | 'webhook' | 'discord', data: string) => {
		if (!data.trim()) {
			createNotice({
				type: 'error',
				message: __('Please enter a valid URL.', 'doublescale'),
			});
			return;
		}
		setTesting(true);
		try {
			await testSmtpAlert({ slug, data: data.trim() });
			createNotice({
				type: 'success',
				message: __('Alert sent successfully.', 'doublescale'),
			});
		} catch (e: unknown) {
			const msg =
				e && typeof e === 'object' && 'message' in e
					? String((e as { message?: string }).message)
					: __('Failed to send alert.', 'doublescale');
			createNotice({ type: 'error', message: msg });
		} finally {
			setTesting(false);
		}
	};

	const renderUrlRows = (
		key: 'slack_data' | 'webhook_data' | 'discord_data',
		slug: 'slack' | 'webhook' | 'discord',
		label: string
	) => {
		const rows = settings[key] || [];
		return (
			<div className="flex flex-col gap-6">
				<div className='flex items-center justify-between'>
					<h3 className='text-lg text-foreground font-semibold leading-[30px]'>{__('Webhook URLs', 'doublescale')}</h3>
					<Button
						type="button"
						variant="outline"
						className='!text-brandPrimary !border-brandPrimary !bg-background !shadow-none'
						onClick={() => setField(key, [...rows, ''])}
					>
						<PlusIcon width={24} height={24} />
						{__('Add webhook URL', 'doublescale')}
					</Button>

				</div>

				{rows.map((url, index) => (
					<div key={index} className="flex flex-wrap gap-6 items-end">
						<div className="flex-1 min-w-[200px] space-y-2">
							<Label className="text-foreground" htmlFor={`${key}-${index}`}>{label} <span className='text-[#C30A0A]'>*</span></Label>
							<Input
								id={`${key}-${index}`}
								value={url}
								required
								onChange={(e) => {
									const next = [...rows];
									next[index] = e.target.value;
									setField(key, next);
								}}
								placeholder="https://"
							/>
						</div>
						<Button
							type="button"
							variant="outline"
							disabled={testing}
							onClick={() => void test(slug, url)}
							className=' px-4 !text-brandPrimary !border-brandPrimary !bg-background !shadow-none'
						>
							{__('Test', 'doublescale')}
						</Button>
						<Button
							type="button"
							variant="outline"
							className=' px-4 !text-[#C30A0A] !border-[#C30A0A] !bg-background !shadow-none'
							onClick={() => {
								const next = [...rows];
								next.splice(index, 1);
								setField(key, next);
							}}
						>
							<TrashIcon width={24} height={24} />
						</Button>
					</div>
				))}

			</div>
		);
	};

	if (loading) {
		return (
			<p className="text-sm text-muted-foreground">
				{__('Loading alert settings…', 'doublescale')}
			</p>
		);
	}

	return (
		<div className="space-y-6 w-full min-h-screen p-6 rounded-[20px] bg-white shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
			{/* <div className='rounded-2xl border border-border bg-muted p-4'>
				<div className='flex items-start gap-2'>
				<SlackIcon />
				<div className='flex-1'>
					<h3 className='text-lg font-semibold leading-[30px] text-foreground'>{__('Slack', 'doublescale')}</h3>
					<div className="flex items-center justify-between gap-4">
						<Label className=' leading-7 text-muted-foreground' htmlFor="alerts-slack-on">{__('Incoming webhooks for failed delivery notifications (Slack-compatible JSON).', 'doublescale')}</Label>
						<Switch
							id="alerts-slack-on"
							checked={Boolean(settings.enable_slack_alerts)}
							onCheckedChange={(v) => setField('enable_slack_alerts', v)}
						/>
					</div>
				</div>
				</div>
				{settings.enable_slack_alerts && (
						<>
							<div className=' w-full h-[1px] bg-border my-6'></div>
							{renderUrlRows('slack_data', 'slack', __('Slack webhook URL', 'doublescale'))}

						</>
					)}
			</div> */}

			<div className='rounded-2xl border border-border bg-muted p-4 '>
				<div className='flex items-start gap-2'>
				<WebhookIcon />
				<div className='flex-1'>
					<h3 className='text-lg font-semibold leading-[30px] text-foreground'>{__('Webhook', 'doublescale')}</h3>
					<div className="flex items-center justify-between gap-4">
						<Label className='leading-7 text-muted-foreground' htmlFor="alerts-wh-on">
							{__('POST a JSON payload to your endpoint when sending fails.', 'doublescale')}
						</Label>
						<Switch
							id="alerts-wh-on"
							className="data-[state=checked]:bg-brandPrimary"
							checked={Boolean(settings.enable_webhook_alerts)}
							onCheckedChange={(v) => setField('enable_webhook_alerts', v)}
						/>
					</div>
				</div>
				</div>
				{settings.enable_webhook_alerts && (
						<>
							<div className='w-full h-[1px] bg-border my-6'></div>
							{renderUrlRows('webhook_data', 'webhook', __('Webhook URL', 'doublescale'))}
						</>
					)}
			</div>

			{/* <div className='rounded-2xl border border-border bg-muted p-4 '>
				<div className='flex items-start gap-2'>
				<DiscordIcon width={48} height={48} />
				<div className='flex-1'>
					<h3 className='text-lg font-semibold leading-[30px] text-foreground'>{__('Discord', 'doublescale')}</h3>
					<div className="flex items-center justify-between gap-4">
						<Label className='leading-7 text-muted-foreground' htmlFor="alerts-dc-on">
							{__('Discord channel webhooks for failure notifications.', 'doublescale')}
						</Label>
						<Switch
							id="alerts-dc-on"
							checked={Boolean(settings.enable_discord_alerts)}
							onCheckedChange={(v) => setField('enable_discord_alerts', v)}
						/>
					</div>
				</div>
				</div>
				{settings.enable_discord_alerts && (
						<>
							<div className='w-full h-[1px] bg-border my-6'></div>
							{renderUrlRows('discord_data', 'discord', __('Discord webhook URL', 'doublescale'))}
						</>
					)}
			</div> */}
		</div>
	);
};

export default SmtpAlertsPanel;