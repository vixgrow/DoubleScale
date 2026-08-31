3; /**
 * Sales module settings (emails, payments, taxes, contract types, approvals).
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import type { FC, ReactNode } from 'react';
import { __ } from '@wordpress/i18n';

import ConfigAPI from '@doublescale/config';
import {
	ContractDraftIcon,
	ContractTypesIcon,
	FormField,
	InfoIcon,
	PageHeader,
	PageTabs,
	PurchaseHistoryIcon,
	SettingsCustomerExperienceIcon,
	SettingsDocumentsReceiptsIcon,
	SettingsIcon,
	SettingsPaymentsIcon,
	SettingsProposalEmailIcon,
	SettingsApprovalsIcon,
	SettingsTaxesIcon,
	TotalCreditedIcon,
} from '@doublescale/components';
import { useIsProActive } from '@doublescale/shared/hooks/use-is-pro-active';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { updateSalesSettings, useSalesSettings } from '@/hooks/sales';
import type { SalesSettings } from '@/types/sales';
import type { SalesEmailDocumentType } from '@/components/merge-tags/utils';
import { ApprovalsProGate } from '../pro-gates';
import { ApprovalWorkflowSettings } from './approval-workflow-settings';
import { ContractTypesManager } from './contract-types-manager';
import { PaymentGatewaysSettings } from './payment-gateways-settings';
import { SalesEmailIntroField } from './sales-email-intro-field';
import { TaxesManager } from './taxes-manager';

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

const TABS_WITH_SAVE = new Set(['general', 'payments', 'approvals']);

interface EmailSettingsCardProps {
	title: string;
	icon: ReactNode;
	subject: string;
	subjectPlaceholder: string;
	onSubjectChange: (value: string) => void;
	intro: string;
	onIntroChange: (value: string) => void;
	documentType: SalesEmailDocumentType;
}

const EmailSettingsCard: FC<EmailSettingsCardProps> = ({
	title,
	icon,
	subject,
	subjectPlaceholder,
	onSubjectChange,
	intro,
	onIntroChange,
	documentType,
}) => (
	<section className="space-y-6 rounded-xl border border-border bg-[#F7F8FA] p-6">
		<div className="flex items-center gap-3">
			<div className="flex shrink-0 items-center justify-center rounded-full text-[#0D9DFC] bg-white p-1.5 border border-border">
				{icon}
			</div>
			<h2 className="text-base lg:text-xl font-semibold text-foreground">
				{title}
			</h2>
		</div>

		<FormField label={__('Email Subject', 'doublescale')} className="!mb-0">
			<Input
				value={subject}
				onChange={(e) => onSubjectChange(e.target.value)}
				placeholder={subjectPlaceholder}
				className="h-10 rounded-lg border-[#D0D0D0]"
			/>
		</FormField>
		<div>
			<FormField
				label={__('Email Intro', 'doublescale')}
				className="!mb-0"
			>
				<SalesEmailIntroField
					value={intro}
					onChange={onIntroChange}
					documentType={documentType}
				/>
			</FormField>

			<p className="text-sm text-muted-foreground flex items-center gap-2">
				<span className='shrink-0'>
					<InfoIcon width={16} height={16} />
				</span>
				{SALES_EMAIL_MERGE_TAG_HINT}
			</p>
		</div>
	</section>
);

interface SettingsSectionCardProps {
	title: string;
	icon: ReactNode;
	children: ReactNode;
}

const SettingsSectionCard: FC<SettingsSectionCardProps> = ({
	title,
	icon,
	children,
}) => (
	<section className="space-y-6 rounded-xl border border-border bg-[#F7F8FA] p-6">
		<div className="flex items-center gap-3">
			<div className="flex shrink-0 items-center justify-center rounded-full text-[#0D9DFC] bg-white p-1.5 border border-border">
				{icon}
			</div>
			<h2 className="text-base lg:text-xl font-semibold text-foreground">
				{title}
			</h2>
		</div>
		{children}
	</section>
);

const SalesSettingsPage: FC = () => {
	const documentsEnabled = ConfigAPI.isModuleEnabled('documents');
	const dealsEnabled = ConfigAPI.isModuleEnabled('deals');
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
		if (!documentsEnabled && (tab === 'payments' || tab === 'approvals')) {
			setTab('general');
		}
	}, [documentsEnabled, tab]);

	const patch = (
		key: keyof SalesSettings,
		value: SalesSettings[keyof SalesSettings]
	) => {
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
			if (typeof window !== 'undefined') {
				const w = window as Window & {
					doublescaleConfig?: {
						salesApprovalWorkflowEnabled?: boolean;
					};
				};
				if (w.doublescaleConfig) {
					w.doublescaleConfig.salesApprovalWorkflowEnabled = Boolean(
						form.approval_workflow_enabled
					);
				}
			}
			setNotice(__('Settings saved.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(
				err instanceof Error
					? err.message
					: __('Save failed.', 'doublescale')
			);
		} finally {
			setSaving(false);
		}
	};

	const generalTab = form ? (
		<div className="grid gap-6 pt-6 xl:grid-cols-2">
			<EmailSettingsCard
				title={__('Proposal Emails', 'doublescale')}
				icon={<SettingsProposalEmailIcon width={20} height={20} />}
				subject={form.proposal_email_subject}
				subjectPlaceholder={
					SALES_EMAIL_SUBJECT_PLACEHOLDERS.proposal_email_subject
				}
				onSubjectChange={(value) =>
					patch('proposal_email_subject', value)
				}
				intro={form.proposal_email_intro}
				onIntroChange={(value) => patch('proposal_email_intro', value)}
				documentType="proposal"
			/>

			<EmailSettingsCard
				title={__('Invoice Emails', 'doublescale')}
				icon={
					<PurchaseHistoryIcon
						width={20}
						height={20}
						color="#0D9DFC"
					/>
				}
				subject={form.invoice_email_subject}
				subjectPlaceholder={
					SALES_EMAIL_SUBJECT_PLACEHOLDERS.invoice_email_subject
				}
				onSubjectChange={(value) =>
					patch('invoice_email_subject', value)
				}
				intro={form.invoice_email_intro}
				onIntroChange={(value) =>
					patch('invoice_email_intro', value)
				}
				documentType="invoice"
			/>

			{isProActive ? (
				<EmailSettingsCard
					title={__('Credit Note Emails', 'doublescale')}
					icon={
						<TotalCreditedIcon
							width={20}
							height={20}
							color="#0D9DFC"
						/>
					}
					subject={form.credit_note_email_subject}
					subjectPlaceholder={
						SALES_EMAIL_SUBJECT_PLACEHOLDERS.credit_note_email_subject
					}
					onSubjectChange={(value) =>
						patch('credit_note_email_subject', value)
					}
					intro={form.credit_note_email_intro}
					onIntroChange={(value) =>
						patch('credit_note_email_intro', value)
					}
					documentType="credit_note"
				/>
			) : null}

			<EmailSettingsCard
				title={__('Contract Emails', 'doublescale')}
				icon={
					<ContractDraftIcon width={20} height={20} color="#0D9DFC" />
				}
				subject={form.contract_email_subject}
				subjectPlaceholder={
					SALES_EMAIL_SUBJECT_PLACEHOLDERS.contract_email_subject
				}
				onSubjectChange={(value) =>
					patch('contract_email_subject', value)
				}
				intro={form.contract_email_intro}
				onIntroChange={(value) => patch('contract_email_intro', value)}
				documentType="contract"
			/>

			<EmailSettingsCard
				title={__('Contract Signed Emails', 'doublescale')}
				icon={
					<ContractTypesIcon width={20} height={20} color="#0D9DFC" />
				}
				subject={form.contract_signed_email_subject}
				subjectPlaceholder={
					SALES_EMAIL_SUBJECT_PLACEHOLDERS.contract_signed_email_subject
				}
				onSubjectChange={(value) =>
					patch('contract_signed_email_subject', value)
				}
				intro={form.contract_signed_email_intro}
				onIntroChange={(value) =>
					patch('contract_signed_email_intro', value)
				}
				documentType="contract"
			/>
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
				<SettingsSectionCard
					title={__('Documents & Receipts', 'doublescale')}
					icon={
						<SettingsDocumentsReceiptsIcon width={20} height={23} />
					}
				>
					<FormField
						label={__(
							'Company address on PDFs and receipts',
							'doublescale'
						)}
						className="!mb-4"
					>
						<Textarea
							value={form.pdf_company_address ?? ''}
							onChange={(e) =>
								patch('pdf_company_address', e.target.value)
							}
							rows={4}
							className="rounded-lg border-[#D0D0D0]"
							placeholder={__(
								'Street, city, country — shown on proposal/invoice PDFs and payment receipts.',
								'doublescale'
							)}
						/>
					</FormField>
					<FormField
						label={__(
							'Company registration number',
							'doublescale'
						)}
						className="!mb-4"
					>
						<Input
							value={form.pdf_company_registration_number ?? ''}
							onChange={(e) =>
								patch(
									'pdf_company_registration_number',
									e.target.value
								)
							}
							className="rounded-lg border-[#D0D0D0]"
							placeholder={__(
								'Optional — shown on sales documents and receipts.',
								'doublescale'
							)}
						/>
					</FormField>
					<FormField
						label={__('Tax / VAT number', 'doublescale')}
						className="!mb-0"
					>
						<Input
							value={form.pdf_company_tax_vat_number ?? ''}
							onChange={(e) =>
								patch('pdf_company_tax_vat_number', e.target.value)
							}
							className="rounded-lg border-[#D0D0D0]"
							placeholder={__(
								'Optional — shown on sales documents and receipts.',
								'doublescale'
							)}
						/>
					</FormField>
				</SettingsSectionCard>

				<SettingsSectionCard
					title={__('Customer Experience', 'doublescale')}
					icon={
						<SettingsCustomerExperienceIcon
							width={20}
							height={19}
						/>
					}
				>
					<div className="flex items-center justify-between gap-4">
						<Label
							htmlFor="require-signature"
							className="font-medium text-base"
						>
							{__(
								'Require signature when accepting proposals',
								'doublescale'
							)}
						</Label>
						<Switch
							id="require-signature"
							checked={form.require_signature_on_accept}
							onCheckedChange={(v) =>
								patch('require_signature_on_accept', v)
							}
						/>
					</div>
					{isProActive && dealsEnabled ? (
						<div className="flex items-center justify-between gap-4">
							<div className="flex flex-col gap-1">
								<Label
									htmlFor="auto-close-deals"
									className="font-medium text-base"
								>
									{__(
										'Auto-close associated deals when fully paid',
										'doublescale'
									)}
								</Label>
								<p className="text-sm text-muted-foreground">
									{__(
										'When an invoice is fully paid, mark any deal linked to it as Won.',
										'doublescale'
									)}
								</p>
							</div>
							<Switch
								id="auto-close-deals"
								checked={Boolean(form.auto_close_deals_on_paid)}
								onCheckedChange={(v) =>
									patch('auto_close_deals_on_paid', v)
								}
							/>
						</div>
					) : null}
					<FormField
						label={__(
							'Expiry reminder (days before open till)',
							'doublescale'
						)}
						className="!mb-0"
					>
						<Input
							type="number"
							min={0}
							max={30}
							value={form.proposal_expiry_reminder_days}
							onChange={(e) =>
								patch(
									'proposal_expiry_reminder_days',
									Number(e.target.value) || 0
								)
							}
							className="h-10 w-full !rounded-lg !border-border"
						/>
					</FormField>
				</SettingsSectionCard>
			</div>
		</div>
	) : null;

	const tabsList = useMemo(() => {
		const tabs = [
			{
				value: 'general',
				label: __('General', 'doublescale'),
				icon: <SettingsIcon width={18} height={18} />,
			},
			...(documentsEnabled
				? [
						{
							value: 'payments',
							label: __('Payments', 'doublescale'),
							icon: (
								<SettingsPaymentsIcon width={18} height={18} />
							),
						},
					]
				: []),
			{
				value: 'taxes',
				label: __('Taxes', 'doublescale'),
				icon: <SettingsTaxesIcon width={18} height={18} />,
			},
			{
				value: 'contract-types',
				label: __('Contract Types', 'doublescale'),
				icon: <ContractTypesIcon width={18} height={18} />,
			},
			...(documentsEnabled
				? [
						{
							value: 'approvals',
							label: __('Approvals', 'doublescale'),
							icon: (
								<SettingsApprovalsIcon width={18} height={18} />
							),
						},
					]
				: []),
		];
		return isProActive
			? tabs
			: tabs.filter(
					(t) =>
						t.value !== 'approvals' &&
						t.value !== 'contract-types'
				);
	}, [documentsEnabled, isProActive]);

	const tabsContent = useMemo(() => {
		if (!form) {
			return [];
		}

		return [
			{ value: 'general', children: generalTab },
			...(documentsEnabled
				? [
						{
							value: 'payments',
							children: (
								<div className="pt-6">
									<PaymentGatewaysSettings
										form={form}
										patch={patch}
									/>
								</div>
							),
						},
					]
				: []),
			{
				value: 'taxes',
				children: (
					<div className="pt-6">
						<TaxesManager />
					</div>
				),
			},
			{
				value: 'contract-types',
				children: (
					<div className="pt-6">
						<ContractTypesManager />
					</div>
				),
			},
			...(documentsEnabled
				? [
						{
							value: 'approvals',
							children: (
								<div className="pt-6">
									{isProActive ? (
										<ApprovalWorkflowSettings
											form={form}
											patch={patch}
										/>
									) : (
										<ApprovalsProGate />
									)}
								</div>
							),
						},
					]
				: []),
		];
	}, [documentsEnabled, form, generalTab, isProActive]);

	if (loading && !form) {
		return (
			<div className="p-6 text-muted-foreground">
				{__('Loading…', 'doublescale')}
			</div>
		);
	}

	if (error && !form) {
		return <div className="p-6 text-sm text-red-600">{error}</div>;
	}

	if (!form) {
		return null;
	}

	return (
		<div className="space-y-6">
			<PageHeader
				subtitle={__('Sales', 'doublescale')}
				title={__('Sales Settings', 'doublescale')}
				actions={[]}
				rowClassName="flex-row items-center justify-between w-full [&_h1]:min-w-0"
				wrapperClassName="mb-0"
			/>

			{notice ? (
				<div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700">
					{notice}
				</div>
			) : null}

			<div className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
				<PageTabs
					value={tab}
					defaultValue="general"
					onValueChange={setTab}
					tabsVariant="underline"
					enableHorizontalScroll
					tabsList={tabsList}
					tabsContent={tabsContent}
					tabsListWrapperClassName="border-b border-border pb-0"
					tabsListClassName="gap-6"
					scrollArrowBg="bg-white"
				/>

				{TABS_WITH_SAVE.has(tab) ? (
					<div className="flex justify-end pt-6">
						<Button
							variant="gradient"
							onClick={() => void handleSave()}
							disabled={saving}
							className="min-w-[140px]"
						>
							{saving
								? __('Saving…', 'doublescale')
								: __('Save Settings', 'doublescale')}
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default SalesSettingsPage;
