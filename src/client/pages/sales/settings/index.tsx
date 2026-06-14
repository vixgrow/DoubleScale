/**
 * Sales module settings (email templates, notifications).
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { FormField } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { updateSalesSettings, useSalesSettings } from '@/hooks/sales';
import type { SalesSettings } from '@/types/sales';

const SalesSettingsPage: React.FC = () => {
	const navigate = useNavigate();
	const { data, loading, error, refetch } = useSalesSettings();
	const [form, setForm] = useState<SalesSettings | null>(null);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		if (data) {
			setForm(data);
		}
	}, [data]);

	const patch = (key: keyof SalesSettings, value: SalesSettings[keyof SalesSettings]) => {
		setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
	};

	const handleSave = async () => {
		if (!form) {
			return;
		}
		setSaving(true);
		setNotice(null);
		try {
			await updateSalesSettings(form);
			await refetch();
			setNotice(__('Settings saved.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Save failed.', 'doublescale'));
		} finally {
			setSaving(false);
		}
	};

	if (loading && !form) {
		return (
			<div className="p-6 text-muted-foreground">{__('Loading…', 'doublescale')}</div>
		);
	}

	if (error && !form) {
		return (
			<div className="p-6 space-y-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/proposals'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Back', 'doublescale')}
				</Button>
				<div className="text-red-600">{error}</div>
			</div>
		);
	}

	if (!form) {
		return null;
	}

	return (
		<div className="p-6 space-y-6 max-w-3xl">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">{__('Sales Settings', 'doublescale')}</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{__(
							'Customize customer emails and internal notifications for proposals and invoices.',
							'doublescale'
						)}
					</p>
				</div>
				<Button variant="outline" onClick={() => navigate(getToLink('sales/proposals'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Back', 'doublescale')}
				</Button>
			</div>

			{notice ? (
				<div className="text-sm rounded border px-3 py-2 bg-slate-50 text-slate-700">{notice}</div>
			) : null}

			<section className="space-y-4 border rounded-lg bg-white p-6">
				<h2 className="font-medium">{__('Proposal emails', 'doublescale')}</h2>
				<FormField label={__('Email subject', 'doublescale')} className="!mb-0">
					<Input
						value={form.proposal_email_subject}
						onChange={(e) => patch('proposal_email_subject', e.target.value)}
					/>
				</FormField>
				<FormField label={__('Email intro', 'doublescale')} className="!mb-0">
					<Textarea
						value={form.proposal_email_intro}
						onChange={(e) => patch('proposal_email_intro', e.target.value)}
						rows={3}
					/>
				</FormField>
				<p className="text-xs text-muted-foreground">
					{__('Tokens: {subject}, {proposal_number}, {customer_name}, {public_url}', 'doublescale')}
				</p>
			</section>

			<section className="space-y-4 border rounded-lg bg-white p-6">
				<h2 className="font-medium">{__('Invoice emails', 'doublescale')}</h2>
				<FormField label={__('Email subject', 'doublescale')} className="!mb-0">
					<Input
						value={form.invoice_email_subject}
						onChange={(e) => patch('invoice_email_subject', e.target.value)}
					/>
				</FormField>
				<FormField label={__('Email intro', 'doublescale')} className="!mb-0">
					<Textarea
						value={form.invoice_email_intro}
						onChange={(e) => patch('invoice_email_intro', e.target.value)}
						rows={3}
					/>
				</FormField>
				<p className="text-xs text-muted-foreground">
					{__(
						'Tokens: {invoice_number}, {customer_name}, {total}, {balance}, {public_url}',
						'doublescale'
					)}
				</p>
			</section>

			<section className="space-y-4 border rounded-lg bg-white p-6">
				<h2 className="font-medium">{__('Notifications', 'doublescale')}</h2>
				<div className="flex items-center justify-between">
					<Label htmlFor="notify-rep-sent">{__('Notify rep when proposal is sent', 'doublescale')}</Label>
					<Switch
						id="notify-rep-sent"
						checked={form.notify_rep_proposal_sent}
						onCheckedChange={(v) => patch('notify_rep_proposal_sent', v)}
					/>
				</div>
				<div className="flex items-center justify-between">
					<Label htmlFor="notify-rep-accepted">
						{__('Notify rep when proposal is accepted', 'doublescale')}
					</Label>
					<Switch
						id="notify-rep-accepted"
						checked={form.notify_rep_proposal_accepted}
						onCheckedChange={(v) => patch('notify_rep_proposal_accepted', v)}
					/>
				</div>
				<div className="flex items-center justify-between">
					<Label htmlFor="notify-rep-declined">
						{__('Notify rep when proposal is declined', 'doublescale')}
					</Label>
					<Switch
						id="notify-rep-declined"
						checked={form.notify_rep_proposal_declined}
						onCheckedChange={(v) => patch('notify_rep_proposal_declined', v)}
					/>
				</div>
				<div className="flex items-center justify-between">
					<Label htmlFor="notify-rep-paid">{__('Notify rep when invoice is paid', 'doublescale')}</Label>
					<Switch
						id="notify-rep-paid"
						checked={form.notify_rep_invoice_paid}
						onCheckedChange={(v) => patch('notify_rep_invoice_paid', v)}
					/>
				</div>
			</section>

			<section className="space-y-4 border rounded-lg bg-white p-6">
				<h2 className="font-medium">{__('Customer experience', 'doublescale')}</h2>
				<div className="flex items-center justify-between">
					<Label htmlFor="require-signature">
						{__('Require signature when accepting proposals', 'doublescale')}
					</Label>
					<Switch
						id="require-signature"
						checked={form.require_signature_on_accept}
						onCheckedChange={(v) => patch('require_signature_on_accept', v)}
					/>
				</div>
				<FormField
					label={__('Expiry reminder (days before open till)', 'doublescale')}
					className="!mb-0"
				>
					<Input
						type="number"
						min={0}
						max={30}
						value={form.proposal_expiry_reminder_days}
						onChange={(e) =>
							patch('proposal_expiry_reminder_days', Number(e.target.value) || 0)
						}
					/>
				</FormField>
			</section>

			<div className="flex justify-end">
				<Button onClick={() => void handleSave()} disabled={saving}>
					{saving ? __('Saving…', 'doublescale') : __('Save Settings', 'doublescale')}
				</Button>
			</div>
		</div>
	);
};

export default SalesSettingsPage;
