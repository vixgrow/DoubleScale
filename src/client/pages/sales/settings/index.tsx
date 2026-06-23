/**
 * Sales module settings (emails, payments, taxes).
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import ConfigAPI from '@doublescale/config';
import { FormField } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateSalesSettings, useSalesSettings } from '@/hooks/sales';
import type { SalesSettings } from '@/types/sales';
import { TaxesManager } from './taxes-manager';
import { PaymentGatewaysSettings } from './payment-gateways-settings';
import { SalesEmailIntroField } from './sales-email-intro-field';
import { InvoicesProGate, PaymentsProGate } from '../pro-gates';
import { useIsProActive } from '@doublescale/shared/hooks/use-is-pro-active';

const SALES_EMAIL_MERGE_TAG_HINT = __(
	'Use merge tags from the editor toolbar — {{sales:…}} for document fields and {{contact:…}} for contact fields. Legacy {token} placeholders still work.',
	'doublescale'
);

const SALES_EMAIL_SUBJECT_PLACEHOLDERS: Record<string, string> = {
	proposal_email_subject: 'Proposal: {{sales:proposal_subject}}',
	invoice_email_subject: 'Invoice: {{sales:invoice_number}}',
	credit_note_email_subject: 'Credit Note: {{sales:credit_note_number}}',
	contract_email_subject: 'Contract: {{sales:contract_subject}}',
	contract_signed_email_subject: 'Contract signed: {{sales:contract_number}}',
};

const SalesSettingsPage: React.FC = () => {
	const navigate = useNavigate();
	const documentsEnabled = ConfigAPI.isModuleEnabled('documents');
	const isProActive = useIsProActive();
	const { data, loading, error, refetch } = useSalesSettings();
	const [form, setForm] = useState<SalesSettings | null>(null);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [tab, setTab] = useState('general');

	useEffect(() => {
		if (data) {
			setForm(data);
		}
	}, [data]);

	useEffect(() => {
		if (!documentsEnabled && tab === 'payments') {
			setTab('general');
		}
	}, [documentsEnabled, tab]);

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
							'Emails, payment gateways, taxes, and customer experience for proposals, contracts, invoices, and credit notes.',
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

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="general">{__('General', 'doublescale')}</TabsTrigger>
					{documentsEnabled ? (
						<TabsTrigger value="payments">{__('Payments', 'doublescale')}</TabsTrigger>
					) : null}
					<TabsTrigger value="taxes">{__('Taxes', 'doublescale')}</TabsTrigger>
				</TabsList>

				<TabsContent value="general" className="space-y-6 mt-6">
					<section className="space-y-4 border rounded-lg bg-white p-6">
						<h2 className="font-medium">{__('Proposal emails', 'doublescale')}</h2>
						<FormField label={__('Email subject', 'doublescale')} className="!mb-0">
							<Input
								value={form.proposal_email_subject}
								onChange={(e) => patch('proposal_email_subject', e.target.value)}
								placeholder={SALES_EMAIL_SUBJECT_PLACEHOLDERS.proposal_email_subject}
							/>
						</FormField>
						<FormField label={__('Email intro', 'doublescale')} className="!mb-0">
							<SalesEmailIntroField
								value={form.proposal_email_intro}
								onChange={(value) => patch('proposal_email_intro', value)}
								documentType="proposal"
							/>
						</FormField>
						<p className="text-xs text-muted-foreground">{SALES_EMAIL_MERGE_TAG_HINT}</p>
					</section>

					{isProActive ? (
					<section className="space-y-4 border rounded-lg bg-white p-6">
						<h2 className="font-medium">{__('Invoice emails', 'doublescale')}</h2>
						<FormField label={__('Email subject', 'doublescale')} className="!mb-0">
							<Input
								value={form.invoice_email_subject}
								onChange={(e) => patch('invoice_email_subject', e.target.value)}
								placeholder={SALES_EMAIL_SUBJECT_PLACEHOLDERS.invoice_email_subject}
							/>
						</FormField>
						<FormField label={__('Email intro', 'doublescale')} className="!mb-0">
							<SalesEmailIntroField
								value={form.invoice_email_intro}
								onChange={(value) => patch('invoice_email_intro', value)}
								documentType="invoice"
							/>
						</FormField>
						<p className="text-xs text-muted-foreground">{SALES_EMAIL_MERGE_TAG_HINT}</p>
					</section>
					) : (
						<InvoicesProGate />
					)}

					{isProActive ? (
					<section className="space-y-4 border rounded-lg bg-white p-6">
						<h2 className="font-medium">{__('Credit note emails', 'doublescale')}</h2>
						<FormField label={__('Email subject', 'doublescale')} className="!mb-0">
							<Input
								value={form.credit_note_email_subject}
								onChange={(e) => patch('credit_note_email_subject', e.target.value)}
								placeholder={SALES_EMAIL_SUBJECT_PLACEHOLDERS.credit_note_email_subject}
							/>
						</FormField>
						<FormField label={__('Email intro', 'doublescale')} className="!mb-0">
							<SalesEmailIntroField
								value={form.credit_note_email_intro}
								onChange={(value) => patch('credit_note_email_intro', value)}
								documentType="credit_note"
							/>
						</FormField>
						<p className="text-xs text-muted-foreground">{SALES_EMAIL_MERGE_TAG_HINT}</p>
					</section>
					) : null}

					<section className="space-y-4 border rounded-lg bg-white p-6">
						<h2 className="font-medium">{__('Contract emails', 'doublescale')}</h2>
						<FormField label={__('Email subject', 'doublescale')} className="!mb-0">
							<Input
								value={form.contract_email_subject}
								onChange={(e) => patch('contract_email_subject', e.target.value)}
								placeholder={SALES_EMAIL_SUBJECT_PLACEHOLDERS.contract_email_subject}
							/>
						</FormField>
						<FormField label={__('Email intro', 'doublescale')} className="!mb-0">
							<SalesEmailIntroField
								value={form.contract_email_intro}
								onChange={(value) => patch('contract_email_intro', value)}
								documentType="contract"
							/>
						</FormField>
						<p className="text-xs text-muted-foreground">{SALES_EMAIL_MERGE_TAG_HINT}</p>
					</section>

					<section className="space-y-4 border rounded-lg bg-white p-6">
						<h2 className="font-medium">{__('Contract signed emails', 'doublescale')}</h2>
						<FormField label={__('Email subject', 'doublescale')} className="!mb-0">
							<Input
								value={form.contract_signed_email_subject}
								onChange={(e) => patch('contract_signed_email_subject', e.target.value)}
								placeholder={SALES_EMAIL_SUBJECT_PLACEHOLDERS.contract_signed_email_subject}
							/>
						</FormField>
						<FormField label={__('Email intro', 'doublescale')} className="!mb-0">
							<SalesEmailIntroField
								value={form.contract_signed_email_intro}
								onChange={(value) => patch('contract_signed_email_intro', value)}
								documentType="contract"
							/>
						</FormField>
						<p className="text-xs text-muted-foreground">{SALES_EMAIL_MERGE_TAG_HINT}</p>
					</section>

					<section className="space-y-4 border rounded-lg bg-white p-6">
						<h2 className="font-medium">{__('Documents & receipts', 'doublescale')}</h2>
						<FormField
							label={__('Company address on PDFs and receipts', 'doublescale')}
							className="!mb-0"
						>
							<Textarea
								value={form.pdf_company_address ?? ''}
								onChange={(e) => patch('pdf_company_address', e.target.value)}
								rows={4}
								placeholder={__(
									'Street, city, country — shown on proposal/invoice PDFs and payment receipts.',
									'doublescale'
								)}
							/>
						</FormField>
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
				</TabsContent>

				{documentsEnabled ? (
					<TabsContent value="payments" className="mt-6">
						{isProActive ? (
							<PaymentGatewaysSettings form={form} patch={patch} />
						) : (
							<PaymentsProGate />
						)}
					</TabsContent>
				) : null}

				<TabsContent value="taxes" className="mt-6">
					<TaxesManager />
				</TabsContent>
			</Tabs>

			<div className="flex justify-end">
				<Button onClick={() => void handleSave()} disabled={saving}>
					{saving ? __('Saving…', 'doublescale') : __('Save Settings', 'doublescale')}
				</Button>
			</div>
		</div>
	);
};

export default SalesSettingsPage;
