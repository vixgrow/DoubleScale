import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { isEmail } from 'validator';
import { useModulesConfigTick } from '@doublescale/hooks/use-module-enabled';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import config from '@/config';
import type { DoubleScaleInfo, VerifiedSender } from '@/shared/config/types/config-data';

/** SMTP/from-email config — supports free (`getDoubleScaleInfo`) and Pro (`getsmtpInfo`) APIs. */
function readSmtpInfoFromConfig(): DoubleScaleInfo {
	const api = config as {
		getDoubleScaleInfo?: () => DoubleScaleInfo;
		getsmtpInfo?: () => DoubleScaleInfo;
	};
	if (typeof api.getDoubleScaleInfo === 'function') {
		return api.getDoubleScaleInfo();
	}
	if (typeof api.getsmtpInfo === 'function') {
		return api.getsmtpInfo();
	}
	return { configured: false };
}
import { cn } from '@/lib/utils';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useModulesDialog } from '../../client/pages/settings/modules/modules-dialog';
import { fetchSmtpSettings } from '../../client/pages/settings/smtp/smtp-api';

/**
 * Build SMTP picker state from live REST payload (stays fresh after saving SMTP without full reload).
 */
function smtpSettingsResponseToInfo(
	data: Record<string, unknown>
): DoubleScaleInfo {
	const connections =
		(data.connections as Record<
			string,
			{ from_email?: string; from_name?: string }
		>) || {};
	const verified: VerifiedSender[] = [];
	for (const [connection_id, c] of Object.entries(connections)) {
		const email =
			typeof c?.from_email === 'string' ? c.from_email.trim() : '';
		if (email && isEmail(email)) {
			verified.push({
				connection_id,
				email,
				name: typeof c?.from_name === 'string' ? c.from_name : '',
			});
		}
	}
	if (verified.length > 0) {
		return { configured: true, verified_senders: verified };
	}
	return { configured: false };
}

interface FromEmailSelectorProps {
	value: string;
	onChange: (email: string, name?: string) => void;
	error?: string;
	required?: boolean;
	className?: string;
	placeholder?: string;
	/**
	 * When provided, these senders REPLACE the component's internal SMTP
	 * fetch. Pass a server-supplied list (the Support mailbox editor forwards
	 * `meta.smtp_senders`) so roles without CRM-manager access still get the
	 * picker - the gated SMTP GET would 403 for them. An empty array means
	 * "no senders" (free-type input, no picker); omit the prop to keep the
	 * default self-fetch behavior.
	 */
	senders?: VerifiedSender[];
}

export const FromEmailSelector: React.FC<FromEmailSelectorProps> = ({
	value,
	onChange,
	error,
	required = true,
	className,
	placeholder,
	senders,
}) => {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const { openModulesDialog } = useModulesDialog();
	const [liveSmtp, setLiveSmtp] = useState<DoubleScaleInfo | null>(null);
	const modulesTick = useModulesConfigTick();
	const smtpModuleOn = config.isModuleToggleEnabled('smtp');

	// Parent-supplied senders take over completely - skip the internal SMTP
	// fetch (it is CRM-manager-gated and 403s for support-only roles).
	const sendersOverride = senders ?? null;

	useEffect(() => {
		if (sendersOverride || !smtpModuleOn) {
			setLiveSmtp(null);
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const data = await fetchSmtpSettings();
				if (cancelled) {
					return;
				}
				const mapped = smtpSettingsResponseToInfo(data);
				const base = readSmtpInfoFromConfig();
				// Successful GET means the bundled SMTP REST is available — never keep a stale "install plugin" hint.
				setLiveSmtp({
					configured: mapped.configured,
					verified_senders: mapped.verified_senders,
					config_url: base.config_url,
					plugin_url: undefined,
				});
			} catch {
				// SMTP REST unavailable (module off or no cap) — keep window.doublescaleConfig.
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [smtpModuleOn, modulesTick, sendersOverride]);

	const overrideInfo: DoubleScaleInfo | null = sendersOverride
		? {
				configured: sendersOverride.length > 0,
				verified_senders: sendersOverride,
		  }
		: null;
	const smtpInfo: DoubleScaleInfo =
		overrideInfo ?? liveSmtp ?? readSmtpInfoFromConfig();

	// Check if we have verified senders. A parent override bypasses the
	// `smtpModuleOn` gate - the server already vouched for these senders.
	const hasVerifiedSenders = !!(
		(sendersOverride || smtpModuleOn) &&
		smtpInfo?.configured &&
		smtpInfo?.verified_senders &&
		smtpInfo.verified_senders.length > 0
	);

	// Handle selection from dropdown
	const handleSelect = (selectedEmail: string) => {
		const sender = smtpInfo?.verified_senders?.find(
			(s) => s.email === selectedEmail
		);
		onChange(selectedEmail, sender?.name || undefined);
		setOpen(false);
	};

	// If no verified senders, just show input
	if (!hasVerifiedSenders) {
		return (
			<div className={className}>
				<Input
					type="email"
					placeholder={placeholder || __('name@gmail.com', 'doublescale')}
					value={value}
					onChange={(e) => onChange(e.target.value)}
				className={cn(
					'!rounded-lg !border-border',
					error &&
						'!border-destructive focus-visible:!ring-destructive/20'
				)}
				required={required}
				/>
			{!smtpModuleOn && (
				<p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2">
					{__(
						'The SMTP module is turned off. Enable it from Control Modules in the header to use saved mail connections and the sender account picker.',
						'doublescale'
					)}{' '}
					<button
						type="button"
						onClick={openModulesDialog}
						className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0 font-medium"
					>
						{__('Open Modules', 'doublescale')}
					</button>
				</p>
			)}
			{smtpModuleOn && !smtpInfo.configured && (
				<p className="text-xs text-muted-foreground mt-1">
					{smtpInfo.plugin_url ? (
						<>
							{__('Install an SMTP plugin', 'doublescale')}{' '}
							<button
								type="button"
								onClick={() => {
									window.location.assign(smtpInfo.plugin_url as string);
								}}
								className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
							>
								{__('from WordPress.org', 'doublescale')}
							</button>
							{' '}
							{__('for easier email management.', 'doublescale')}
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => navigate(getToLink('smtp/settings'))}
								className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
							>
								{__('Open SMTP settings', 'doublescale')}
							</button>
							{' '}
							{__(
								'to add a mail connection and From addresses.',
								'doublescale'
							)}
						</>
					)}
				</p>
			)}
			</div>
		);
	}

	// Render combo input with dropdown
	return (
		<div className={cn('w-full', className)}>
			<div className="flex gap-2 items-center w-full">
				<div className="flex-1 min-w-0">
					<Input
						type="email"
						placeholder={placeholder || __('name@gmail.com', 'doublescale')}
						value={value}
						onChange={(e) => onChange(e.target.value)}
					className={cn(
						'w-full !border-border !rounded-lg',
						error && '!border-destructive focus-visible:!ring-destructive/20'
					)}
						required={required}
					/>
				</div>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="h-10 w-10 shrink-0 justify-center p-0"
							type="button"
						>
							<ChevronsUpDown className="h-4 w-4 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="z-[151000] w-[400px] p-0"
						align="end"
					>
						{/* PanelLayout uses z-[150000]; cmdk default filter can hide items without an input */}
						<Command shouldFilter={false}>
							<CommandList>
								<CommandEmpty>
									{__('No verified senders found.', 'doublescale')}
								</CommandEmpty>
								<CommandGroup heading={__('smtp Connections', 'doublescale')}>
									{smtpInfo?.verified_senders?.map((sender) => (
										<CommandItem
											key={sender.connection_id}
											value={sender.email}
											onSelect={handleSelect}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													value === sender.email
														? 'opacity-100'
														: 'opacity-0'
												)}
											/>
											<div className="flex flex-col">
												<span className="font-medium">
													{sender.email}
												</span>
												{sender.name && (
												<span className="text-sm text-muted-foreground">
													{sender.name}
												</span>
												)}
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
			<p className="text-xs text-muted-foreground mt-1">
				{__('Type an email as per your domain/SMTP settings. Email mismatch settings may not deliver emails as expected', 'doublescale')}
			</p>
		</div>
	);
};
