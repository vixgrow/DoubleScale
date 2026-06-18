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
import { computeAmount, computeLineItemsTotals } from './line-items-editor';
import type { Invoice, LineItem, Proposal } from '@/types/sales';

import './document-preview.scss';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const proposalStatusClass = (status: ProposalStatus): string =>
	`ds-sales-doc__status ds-sales-doc__status--${status}`;

const invoiceStatusClass = (status: InvoiceStatus): string =>
	`ds-sales-doc__status ds-sales-doc__status--${status}`;

const contractStatusClass = (status: string): string =>
	`ds-sales-doc__status ds-sales-doc__status--${status}`;

const DocumentShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="ds-sales-doc">
		<div className="ds-sales-doc__accent" aria-hidden="true" />
		{children}
	</div>
);

const LineItemsTable: React.FC<{
	items: LineItem[];
	currency: string;
	showTax?: boolean;
}> = ({ items, currency, showTax = false }) => {
	const rows = items.filter((item) => !item.optional);
	const colSpan = showTax ? 5 : 4;

	return (
		<div className="ds-sales-doc__items">
			<table>
				<thead>
					<tr>
						<th>{__('Item', 'doublescale')}</th>
						<th className="is-right">{__('Qty', 'doublescale')}</th>
						<th className="is-right">{__('Rate', 'doublescale')}</th>
						{showTax ? (
							<th className="is-right">{__('Tax', 'doublescale')}</th>
						) : null}
						<th className="is-right">{__('Amount', 'doublescale')}</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td colSpan={colSpan} className="ds-sales-doc__items-empty">
								{__('No line items.', 'doublescale')}
							</td>
						</tr>
					) : (
						rows.map((item, index) => (
							<tr key={index}>
								<td>
									<div className="ds-sales-doc__items-name">
										{item.description || '—'}
									</div>
									{item.long_description ? (
										<div className="ds-sales-doc__items-desc">
											{item.long_description}
										</div>
									) : null}
								</td>
								<td className="is-right">{item.qty}</td>
								<td className="is-right">{formatMoney(item.rate, currency)}</td>
								{showTax ? (
									<td className="is-right">
										{(item.tax || [])
											.map((t) => `${t.name} (${t.rate}%)`)
											.join(', ') || '—'}
									</td>
								) : null}
								<td className="is-right">
									{formatMoney(computeAmount(item), currency)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

const TotalsBlock: React.FC<{
	subtotal: number;
	totalTax?: number;
	discountType: string;
	discountValue: number;
	adjustment: number;
	total: number;
	amountPaid?: number;
	currency: string;
	lineItems: LineItem[];
}> = ({
	subtotal,
	totalTax = 0,
	discountType,
	discountValue,
	adjustment,
	total,
	amountPaid,
	currency,
	lineItems,
}) => {
	const computed = computeLineItemsTotals(lineItems, discountType, discountValue, adjustment);
	const balance =
		amountPaid !== undefined ? Math.max(0, total - amountPaid) : undefined;

	return (
		<div className="ds-sales-doc__footer">
			<div className="ds-sales-doc__totals">
				<table>
					<tbody>
						<tr>
							<th>{__('Subtotal', 'doublescale')}</th>
							<td>{formatMoney(subtotal, currency)}</td>
						</tr>
						{totalTax > 0 ? (
							<tr>
								<th>{__('Tax', 'doublescale')}</th>
								<td>{formatMoney(totalTax, currency)}</td>
							</tr>
						) : null}
						{computed.discount > 0 ? (
							<tr>
								<th>{__('Discount', 'doublescale')}</th>
								<td>-{formatMoney(computed.discount, currency)}</td>
							</tr>
						) : null}
						{adjustment !== 0 ? (
							<tr>
								<th>{__('Adjustment', 'doublescale')}</th>
								<td>{formatMoney(adjustment, currency)}</td>
							</tr>
						) : null}
						<tr className="is-total-bar">
							<th>{__('Total', 'doublescale')}</th>
							<td>{formatMoney(total, currency)}</td>
						</tr>
						{amountPaid !== undefined ? (
							<>
								<tr>
									<th>{__('Amount Paid', 'doublescale')}</th>
									<td>{formatMoney(amountPaid, currency)}</td>
								</tr>
								<tr className="is-balance">
									<th>{__('Balance Due', 'doublescale')}</th>
									<td>{formatMoney(balance ?? 0, currency)}</td>
								</tr>
							</>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const PartyBlock: React.FC<{ label: string; lines: string[] }> = ({ label, lines }) => (
	<div className="ds-sales-doc__party">
		<h5 className="ds-sales-doc__party-label">{label}</h5>
		{lines.length ? (
			lines.map((line, index) => (
				<p key={`${line}-${index}`} className="ds-sales-doc__party-line">
					{line}
				</p>
			))
		) : (
			<p className="ds-sales-doc__party-line">—</p>
		)}
	</div>
);

const DateRow: React.FC<{ label: string; value: string | null | undefined }> = ({
	label,
	value,
}) => (
	<div className="ds-sales-doc__date-row">
		<span className="ds-sales-doc__date-label">{label}:</span>
		{value || '—'}
	</div>
);

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

	return (
		<DocumentShell>
			<div className="ds-sales-doc__header">
				<div className="ds-sales-doc__title-block">
					<p className="ds-sales-doc__doc-type">{__('Proposal', 'doublescale')}</p>
					<h2 className="ds-sales-doc__number">{proposal.proposal_number}</h2>
					{proposal.subject ? (
						<p className="ds-sales-doc__subject">{proposal.subject}</p>
					) : null}
				</div>
				<div className="ds-sales-doc__status-group">
					<span className={proposalStatusClass(proposal.status)}>
						{PROPOSAL_STATUS_LABELS[proposal.status] || proposal.status}
					</span>
					{proposal.is_expired ? (
						<span className="ds-sales-doc__status ds-sales-doc__status--expired">
							{__('Expired', 'doublescale')}
						</span>
					) : null}
				</div>
			</div>

			<div className="ds-sales-doc__meta">
				<PartyBlock label={__('To', 'doublescale')} lines={partyLines} />
				<div className="ds-sales-doc__dates">
					<DateRow label={__('Date', 'doublescale')} value={proposal.date} />
					<DateRow label={__('Open Till', 'doublescale')} value={proposal.open_till} />
					<DateRow label={__('Currency', 'doublescale')} value={proposal.currency} />
				</div>
			</div>

			<LineItemsTable items={proposal.line_items} currency={proposal.currency} />

			<TotalsBlock
				subtotal={proposal.subtotal}
				discountType={proposal.discount_type}
				discountValue={proposal.discount_value}
				adjustment={proposal.adjustment}
				total={proposal.total}
				currency={proposal.currency}
				lineItems={proposal.line_items}
			/>
		</DocumentShell>
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

	return (
		<DocumentShell>
			<div className="ds-sales-doc__header">
				<div className="ds-sales-doc__title-block">
					<p className="ds-sales-doc__doc-type">{__('Invoice', 'doublescale')}</p>
					<h2 className="ds-sales-doc__number">{invoice.invoice_number}</h2>
					{contactName ? (
						<p className="ds-sales-doc__subject">{contactName}</p>
					) : null}
				</div>
				<div className="ds-sales-doc__status-group">
					<span className={invoiceStatusClass(invoice.status)}>
						{INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
					</span>
				</div>
			</div>

			<div className="ds-sales-doc__meta">
				<PartyBlock label={__('Bill To', 'doublescale')} lines={billingLines} />
				<div className="ds-sales-doc__dates">
					<DateRow label={__('Invoice Date', 'doublescale')} value={invoice.invoice_date} />
					<DateRow label={__('Due Date', 'doublescale')} value={invoice.due_date} />
					<DateRow label={__('Currency', 'doublescale')} value={invoice.currency} />
				</div>
			</div>

			{shippingLines.length ? (
				<div className="ds-sales-doc__meta">
					<PartyBlock label={__('Ship To', 'doublescale')} lines={shippingLines} />
				</div>
			) : null}

			<LineItemsTable items={invoice.line_items} currency={invoice.currency} showTax />

			<TotalsBlock
				subtotal={invoice.subtotal}
				totalTax={invoice.total_tax}
				discountType={invoice.discount_type}
				discountValue={invoice.discount_value}
				adjustment={invoice.adjustment}
				total={invoice.total}
				amountPaid={invoice.amount_paid}
				currency={invoice.currency}
				lineItems={invoice.line_items}
			/>

			{invoice.client_note ? (
				<div className="ds-sales-doc__section">
					<h4 className="ds-sales-doc__section-title">
						{__('Client Note', 'doublescale')}
					</h4>
					<p className="ds-sales-doc__section-body">{invoice.client_note}</p>
				</div>
			) : null}

			{invoice.terms ? (
				<div className="ds-sales-doc__section">
					<h4 className="ds-sales-doc__section-title">{__('Terms', 'doublescale')}</h4>
					<p className="ds-sales-doc__section-body">{invoice.terms}</p>
				</div>
			) : null}
		</DocumentShell>
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

export const ContractDocumentPreview: React.FC<ContractDocumentPreviewProps> = ({
	contract,
}) => {
	const statusKey = contract.status as ContractStatus;
	const statusLabel =
		CONTRACT_STATUS_LABELS[statusKey] || contract.status;

	return (
		<DocumentShell>
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
