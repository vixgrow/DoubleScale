/**
 * Dialog to edit sales rep notification title/body templates.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateSalesSettings, useSalesSettings } from '@/hooks/sales';

const PROPOSAL_TOKENS =
	'{event_label}, {proposal_number}, {proposal_subject}, {decline_reason_suffix}, {company_name}, {sales_link}';

const INVOICE_TOKENS = '{invoice_number}, {company_name}, {sales_link}';

const CONTRACT_TOKENS =
	'{event_label}, {contract_number}, {contract_subject}, {company_name}, {sales_link}';

interface SalesNotificationTemplateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subKey: string | null;
	label: string;
}

export const SalesNotificationTemplateDialog: React.FC<SalesNotificationTemplateDialogProps> = ({
	open,
	onOpenChange,
	subKey,
	label,
}) => {
	const { data, refetch } = useSalesSettings();
	const [title, setTitle] = useState('');
	const [message, setMessage] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !subKey || !data) {
			return;
		}
		const tpl = data.rep_notification_templates?.[subKey];
		setTitle(tpl?.title ?? '');
		setMessage(tpl?.message ?? '');
		setError(null);
	}, [open, subKey, data]);

	const handleSave = async () => {
		if (!subKey || !data) {
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await updateSalesSettings({
				rep_notification_templates: {
					...(data.rep_notification_templates ?? {}),
					[subKey]: {
						title: title.trim(),
						message: message.trim(),
					},
				},
			});
			await refetch();
			onOpenChange(false);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : __('Save failed.', 'doublescale'));
		} finally {
			setSaving(false);
		}
	};

	const tokenHint =
		subKey === 'sales_invoice_paid'
			? INVOICE_TOKENS
			: subKey === 'sales_contract_sent' || subKey === 'sales_contract_signed'
				? CONTRACT_TOKENS
				: PROPOSAL_TOKENS;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{__('Edit notification', 'doublescale')} — {label}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="sales-notif-title">{__('Title', 'doublescale')}</Label>
						<Input
							id="sales-notif-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={__('Notification title', 'doublescale')}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="sales-notif-message">{__('Message', 'doublescale')}</Label>
						<Textarea
							id="sales-notif-message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={5}
							placeholder={__('Notification message', 'doublescale')}
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						{__('Tokens:', 'doublescale')} {tokenHint}
					</p>
					{error ? <div className="text-sm text-red-600">{error}</div> : null}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button onClick={() => void handleSave()} disabled={saving}>
						{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
