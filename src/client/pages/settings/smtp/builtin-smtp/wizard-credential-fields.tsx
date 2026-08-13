/**
 * Reusable credential input blocks used in both Wizard step-3 and the Edit Account modal.
 */
import { __ } from '@wordpress/i18n';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	getMailerCredentialFields,
	getOAuthAppFields,
	isSmtpOAuthMailer,
	type MailerField,
} from '../mailer-options';
import type { SmtpConnection } from '../types';
import { SMTP_CONNECTION_INPUT_CLASS, SMTP_CONNECTION_SELECT_TRIGGER_CLASS } from './form-utils';
import { InfoIcon } from '@doublescale/components';

// ---------------------------------------------------------------------------
// OAuth credential fields  (Gmail / Outlook / Zoho step-3 left panel)
// ---------------------------------------------------------------------------

type OAuthCredentialFieldsProps = {
	mailer: string;
	form: SmtpConnection;
	setForm: React.Dispatch<React.SetStateAction<SmtpConnection>>;
};

export function OAuthCredentialFields({
	mailer,
	form,
	setForm,
}: OAuthCredentialFieldsProps) {
	if (mailer === 'phpmailer' || !isSmtpOAuthMailer(mailer)) {
		return null;
	}

	return (
		<>
			<Alert>
				<AlertTitle>{__('OAuth app credentials', 'doublescale')}</AlertTitle>
				<AlertDescription>
					{__(
						'Enter the client ID and client secret from your provider developer console. Save, then open provider authorization (left column); after OAuth completes, choose the mailbox from Provider account.',
						'doublescale'
					)}
				</AlertDescription>
			</Alert>
			{getOAuthAppFields(mailer)?.map((field: MailerField) => {
				const app = form.oauth_app || {};
				const val = String(
					(app as Record<string, unknown>)[field.key] ?? ''
				);
				const fid = `smtp-oauth-${field.key}`;
				if (field.type === 'select' && field.options?.length) {
					return (
						<div key={field.key} className="space-y-2">
							<Label htmlFor={fid}>{field.label}</Label>
							<Select
								value={val || field.options[0].value}
								onValueChange={(v) =>
									setForm((f) => ({
										...f,
										oauth_app: {
											...(f.oauth_app || {}),
											[field.key]: v,
										},
									}))
								}
							>
								<SelectTrigger id={fid}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{field.options.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);
				}
				return (
					<div key={field.key} className="space-y-2">
						<Label htmlFor={fid}>{field.label}</Label>
						<Input
							id={fid}
							type={field.type === 'password' ? 'password' : 'text'}
							autoComplete={
								field.type === 'password' ? 'new-password' : 'off'
							}
							value={val}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									oauth_app: {
										...(f.oauth_app || {}),
										[field.key]: e.target.value,
									},
								}))
							}
						/>
					</div>
				);
			})}
		</>
	);
}

// ---------------------------------------------------------------------------
// API-key / credential fields  (non-OAuth, non-PHPMailer, non-SMTP step-3 right panel)
// ---------------------------------------------------------------------------

type ApiCredentialFieldsProps = {
	mailer: string;
	form: SmtpConnection;
	setForm: React.Dispatch<React.SetStateAction<SmtpConnection>>;
};

export function ApiCredentialFields({
	mailer,
	form,
	setForm,
}: ApiCredentialFieldsProps) {
	const isSmtpRelay = mailer === 'smtp';
	if (mailer === 'phpmailer' || isSmtpRelay || isSmtpOAuthMailer(mailer)) {
		return null;
	}

	const fields = getMailerCredentialFields(mailer);
	if (!fields?.length) {
		return null;
	}

	return (
		<>
			{fields.map((field: MailerField) => {
				const creds = (form.credentials || {}) as Record<string, unknown>;
				const val = String(creds[field.key] ?? '');
				const fid = `smtp-cred-${field.key}`;
				const labelHasRequired =
					field.required !== false &&
					String(field.label).trim().length > 0;

				if (field.type === 'select' && field.options?.length) {
					return (
						<div key={field.key} className="space-y-2">
							<Label htmlFor={fid}>
								{field.label}
								{labelHasRequired ? (
									<span className="text-destructive"> *</span>
								) : null}
							</Label>
							<Select
								value={val || field.options[0].value}
								onValueChange={(v) =>
									setForm((f) => ({
										...f,
										credentials: {
											...(f.credentials || {}),
											[field.key]: v,
										},
									}))
								}
							>
								<SelectTrigger
									id={fid}
									className={SMTP_CONNECTION_SELECT_TRIGGER_CLASS}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{field.options.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{field.help ? (
								<div className="flex gap-2 text-xs text-muted-foreground">
									<InfoIcon width={16} height={16} color="#0D9DFC" />
									<span>{field.help}</span>
								</div>
							) : null}
						</div>
					);
				}

				return (
					<div key={field.key} className="space-y-2">
						<Label htmlFor={fid}>
							{field.label}
							{labelHasRequired ? (
								<span className="text-destructive"> *</span>
							) : null}
						</Label>
						<Input
							id={fid}
							className={SMTP_CONNECTION_INPUT_CLASS}
							type={field.type === 'password' ? 'password' : 'text'}
							autoComplete={
								field.type === 'password' ? 'new-password' : 'off'
							}
							value={val}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									credentials: {
										...(f.credentials || {}),
										[field.key]: e.target.value,
									},
								}))
							}
						/>
						{field.help ? (
							<div className="flex gap-2 text-xs text-muted-foreground">
								<InfoIcon width={16} height={16} color="#0D9DFC" />
								<span>{field.help}</span>
							</div>
						) : null}
					</div>
				);
			})}
		</>
	);
}
