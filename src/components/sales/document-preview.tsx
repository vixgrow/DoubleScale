/**
 * Read-only document preview for proposals and invoices.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	INVOICE_STATUS_LABELS,
	PROPOSAL_STATUS_LABELS,
	CONTRACT_STATUS_LABELS,
	type InvoiceStatus,
	type ProposalStatus,
	type ContractStatus,
} from '@/constants/sales';
import { computeLineItemsTotals } from './line-items-editor';
import type { Invoice, LineItem, Proposal } from '@/types/sales';
import { getCompanyFrom } from './document-templates/company-from';
import { DocumentDesign } from './document-templates/designs';
import {
	DateRow,
	DocumentShell,
	LineItemsTable,
	PartyBlock,
	formatMoney,
} from './document-templates/designs/blocks';
import { normalizeTemplateId } from './document-templates/registry';

import './document-preview.scss';

const proposalStatusClass = (status: ProposalStatus): string =>
	`ds-sales-doc__status ds-sales-doc__status--${status}`;

const invoiceStatusClass = (status: InvoiceStatus): string =>
	`ds-sales-doc__status ds-sales-doc__status--${status}`;

const contractStatusClass = (status: string): string =>
	`ds-sales-doc__status ds-sales-doc__status--${status}`;

interface ProposalDocumentPreviewProps {
	proposal: Proposal;
}

export const ProposalDocumentPreview: React.FC<ProposalDocumentPreviewProps> = ({
	proposal,
}) => {
	const partyLines = [
		proposal.to_name,
		proposal.address,
		[proposal.city, proposal.state].filter(Boolean).join(', '),
		proposal.zip,
		proposal.country,
		proposal.email,
		proposal.phone,
	].filter(Boolean) as string[];

	const statusBadges = [
		{
			label: PROPOSAL_STATUS_LABELS[proposal.status] || proposal.status,
			className: proposalStatusClass(proposal.status),
		},
	];
	if (proposal.is_expired) {
		statusBadges.push({
			label: __('Expired', 'doublescale'),
			className: 'ds-sales-doc__status ds-sales-doc__status--expired',
		});
	}

	return (
		<DocumentDesign
			template={normalizeTemplateId(proposal.template)}
			accentColor={proposal.template_color ?? null}
			docType="proposal"
			number={proposal.proposal_number}
			subject={proposal.subject}
			from={getCompanyFrom()}
			statusBadges={statusBadges}
			parties={[{ label: __('To', 'doublescale'), lines: partyLines }]}
			dates={[
				{ label: __('Date', 'doublescale'), value: proposal.date },
				{ label: __('Open Till', 'doublescale'), value: proposal.open_till },
				{ label: __('Currency', 'doublescale'), value: proposal.currency },
			]}
			lineItems={proposal.line_items}
			currency={proposal.currency}
			subtotal={proposal.subtotal}
			discountType={proposal.discount_type}
			discountValue={proposal.discount_value}
			adjustment={proposal.adjustment}
			total={proposal.total}
		/>
	);
};

interface InvoiceDocumentPreviewProps {
	invoice: Invoice;
}

export const InvoiceDocumentPreview: React.FC<InvoiceDocumentPreviewProps> = ({
	invoice,
}) => {
	const billingLines = (invoice.billing_address || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const shippingLines = (invoice.shipping_address || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const contactName = invoice.contact
		? [invoice.contact.first_name, invoice.contact.last_name]
				.filter(Boolean)
				.join(' ') || invoice.contact.email
		: null;

	const parties = [
		{
			label: __('Bill To', 'doublescale'),
			lines: billingLines.length
				? billingLines
				: ([contactName].filter(Boolean) as string[]),
		},
	];
	if (shippingLines.length) {
		parties.push({
			label: __('Ship To', 'doublescale'),
			lines: shippingLines,
		});
	}

	const sections: { title: string; body: string }[] = [];
	if (invoice.client_note) {
		sections.push({
			title: __('Client Note', 'doublescale'),
			body: invoice.client_note,
		});
	}
	if (invoice.terms) {
		sections.push({
			title: __('Terms', 'doublescale'),
			body: invoice.terms,
		});
	}

	return (
		<DocumentDesign
			template={normalizeTemplateId(invoice.template)}
			accentColor={invoice.template_color ?? null}
			docType="invoice"
			number={invoice.invoice_number}
			subject={contactName}
			from={getCompanyFrom()}
			statusBadges={[
				{
					label: INVOICE_STATUS_LABELS[invoice.status] || invoice.status,
					className: invoiceStatusClass(invoice.status),
				},
			]}
			parties={parties}
			dates={[
				{
					label: __('Invoice Date', 'doublescale'),
					value: invoice.invoice_date,
				},
				{ label: __('Due Date', 'doublescale'), value: invoice.due_date },
				{ label: __('Currency', 'doublescale'), value: invoice.currency },
			]}
			lineItems={invoice.line_items}
			currency={invoice.currency}
			showTax
			subtotal={invoice.subtotal}
			totalTax={invoice.total_tax}
			discountType={invoice.discount_type}
			discountValue={invoice.discount_value}
			adjustment={invoice.adjustment}
			total={invoice.total}
			amountPaid={invoice.amount_paid}
			sections={sections}
		/>
	);
};

export interface ContractPreviewData {
	contract_number: string;
	subject: string;
	status: string;
	contract_value: number;
	currency: string;
	start_date: string | null;
	end_date: string | null;
	description: string;
	contract_type: { id: number; name: string } | null;
	is_expired: boolean;
}

interface ContractDocumentPreviewProps {
	contract: ContractPreviewData;
}

export interface CreditNotePreviewData {
	credit_note_number: string;
	status: string;
	credit_note_date?: string | null;
	reason?: string | null;
	currency: string;
	discount_type: string;
	discount_value: number;
	line_items: LineItem[];
	subtotal: number;
	total_tax: number;
	adjustment: number;
	total: number;
	amount_applied: number;
	remaining: number;
	billing_address?: string | null;
	client_note?: string | null;
	terms?: string | null;
	contact?: {
		first_name?: string | null;
		last_name?: string | null;
	} | null;
}

const CREDIT_NOTE_STATUS_LABELS: Record<string, string> = {
	open: __('Open', 'doublescale'),
	partially_applied: __('Partially Applied', 'doublescale'),
	applied: __('Applied', 'doublescale'),
	void: __('Void', 'doublescale'),
};

const creditNoteStatusClass = (status: string): string =>
	`ds-sales-doc__status ds-sales-doc__status--${status}`;

interface CreditNoteDocumentPreviewProps {
	creditNote: CreditNotePreviewData;
}

export const CreditNoteDocumentPreview: React.FC<CreditNoteDocumentPreviewProps> = ({
	creditNote,
}) => {
	const billingLines = (creditNote.billing_address || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const contactName = creditNote.contact
		? [creditNote.contact.first_name, creditNote.contact.last_name]
				.filter(Boolean)
				.join(' ')
		: null;
	const computed = computeLineItemsTotals(
		creditNote.line_items,
		creditNote.discount_type,
		creditNote.discount_value,
		creditNote.adjustment
	);

	return (
		<DocumentShell designId={1}>
			<div className="ds-sales-doc__header">
				<div className="ds-sales-doc__title-block">
					<p className="ds-sales-doc__doc-type">{__('Credit Note', 'doublescale')}</p>
					<h2 className="ds-sales-doc__number">{creditNote.credit_note_number}</h2>
					{creditNote.reason ? (
						<p className="ds-sales-doc__subject">{creditNote.reason}</p>
					) : contactName ? (
						<p className="ds-sales-doc__subject">{contactName}</p>
					) : null}
				</div>
				<div className="ds-sales-doc__status-group">
					<span className={creditNoteStatusClass(creditNote.status)}>
						{CREDIT_NOTE_STATUS_LABELS[creditNote.status] || creditNote.status}
					</span>
				</div>
			</div>

			<div className="ds-sales-doc__meta">
				<PartyBlock
					label={__('Bill To', 'doublescale')}
					lines={billingLines.length ? billingLines : contactName ? [contactName] : []}
				/>
				<div className="ds-sales-doc__dates">
					<DateRow label={__('Date', 'doublescale')} value={creditNote.credit_note_date} />
					<DateRow label={__('Currency', 'doublescale')} value={creditNote.currency} />
				</div>
			</div>

			<LineItemsTable items={creditNote.line_items} currency={creditNote.currency} showTax />

			<div className="ds-sales-doc__footer">
				<div className="ds-sales-doc__totals">
					<table>
						<tbody>
							<tr>
								<th>{__('Subtotal', 'doublescale')}</th>
								<td>{formatMoney(creditNote.subtotal, creditNote.currency)}</td>
							</tr>
							{computed.discount > 0 ? (
								<tr>
									<th>{__('Discount', 'doublescale')}</th>
									<td>-{formatMoney(computed.discount, creditNote.currency)}</td>
								</tr>
							) : null}
							{creditNote.total_tax > 0 ? (
								<tr>
									<th>{__('Tax', 'doublescale')}</th>
									<td>{formatMoney(creditNote.total_tax, creditNote.currency)}</td>
								</tr>
							) : null}
							{creditNote.adjustment !== 0 ? (
								<tr>
									<th>{__('Adjustment', 'doublescale')}</th>
									<td>{formatMoney(creditNote.adjustment, creditNote.currency)}</td>
								</tr>
							) : null}
							<tr className="is-total-bar">
								<th>{__('Credit Total', 'doublescale')}</th>
								<td>{formatMoney(creditNote.total, creditNote.currency)}</td>
							</tr>
							<tr>
								<th>{__('Applied', 'doublescale')}</th>
								<td>{formatMoney(creditNote.amount_applied, creditNote.currency)}</td>
							</tr>
							<tr className="is-balance">
								<th>{__('Remaining Credit', 'doublescale')}</th>
								<td>{formatMoney(creditNote.remaining, creditNote.currency)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{creditNote.client_note ? (
				<div className="ds-sales-doc__section">
					<h4 className="ds-sales-doc__section-title">
						{__('Client Note', 'doublescale')}
					</h4>
					<p className="ds-sales-doc__section-body">{creditNote.client_note}</p>
				</div>
			) : null}

			{creditNote.terms ? (
				<div className="ds-sales-doc__section">
					<h4 className="ds-sales-doc__section-title">{__('Terms', 'doublescale')}</h4>
					<p className="ds-sales-doc__section-body">{creditNote.terms}</p>
				</div>
			) : null}
		</DocumentShell>
	);
};

export const ContractDocumentPreview: React.FC<ContractDocumentPreviewProps> = ({
	contract,
}) => {
	const statusKey = contract.status as ContractStatus;
	const statusLabel =
		CONTRACT_STATUS_LABELS[statusKey] || contract.status;

	return (
		<DocumentShell designId={1}>
			<div className="ds-sales-doc__header">
				<div className="ds-sales-doc__title-block">
					<p className="ds-sales-doc__doc-type">{__('Contract', 'doublescale')}</p>
					<h2 className="ds-sales-doc__number">{contract.contract_number}</h2>
					{contract.subject ? (
						<p className="ds-sales-doc__subject">{contract.subject}</p>
					) : null}
				</div>
				<div className="ds-sales-doc__status-group">
					<span className={contractStatusClass(contract.status)}>
						{statusLabel}
					</span>
					{contract.is_expired ? (
						<span className="ds-sales-doc__status ds-sales-doc__status--expired">
							{__('Expired', 'doublescale')}
						</span>
					) : null}
				</div>
			</div>

			<div className="ds-sales-doc__meta">
				<div className="ds-sales-doc__party">
					<h5 className="ds-sales-doc__party-label">
						{__('Contract Details', 'doublescale')}
					</h5>
					{contract.contract_type ? (
						<p className="ds-sales-doc__party-line">
							{__('Type', 'doublescale')}: {contract.contract_type.name}
						</p>
					) : null}
					<p className="ds-sales-doc__party-line">
						{__('Value', 'doublescale')}:{' '}
						{formatMoney(contract.contract_value, contract.currency)}
					</p>
					<p className="ds-sales-doc__party-line">
						{__('Currency', 'doublescale')}: {contract.currency}
					</p>
				</div>
				<div className="ds-sales-doc__dates">
					<DateRow label={__('Start Date', 'doublescale')} value={contract.start_date} />
					<DateRow label={__('End Date', 'doublescale')} value={contract.end_date} />
				</div>
			</div>

			{contract.description ? (
				<div className="ds-sales-doc__section">
					<h4 className="ds-sales-doc__section-title">
						{__('Description', 'doublescale')}
					</h4>
					<div
						className="ds-sales-doc__section-body"
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: contract.description }}
					/>
				</div>
			) : null}
		</DocumentShell>
	);
};
