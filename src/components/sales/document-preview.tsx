/**
 * Read-only document preview for proposals and invoices.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { computeLineItemsTotals } from './line-items-editor';
import { InvoiceStatusPill, ProposalStatusPill } from './status-pill';
import type { Invoice, LineItem, Proposal } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const formatAddress = (text: string | null | undefined): string => text?.trim() || '—';

const LineItemsTable: React.FC<{
	items: LineItem[];
	currency: string;
	showTax?: boolean;
}> = ({ items, currency, showTax = false }) => {
	const rows = items.filter((item) => !item.optional);

	return (
		<div className="border rounded-lg overflow-hidden">
			<table className="w-full text-sm">
				<thead className="bg-slate-50 border-b">
					<tr>
						<th className="text-left px-4 py-2">{__('Item', 'doublescale')}</th>
						<th className="text-right px-4 py-2">{__('Qty', 'doublescale')}</th>
						<th className="text-right px-4 py-2">{__('Rate', 'doublescale')}</th>
						{showTax ? (
							<th className="text-right px-4 py-2">{__('Tax', 'doublescale')}</th>
						) : null}
						<th className="text-right px-4 py-2">{__('Amount', 'doublescale')}</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td
								colSpan={showTax ? 5 : 4}
								className="px-4 py-6 text-center text-muted-foreground"
							>
								{__('No line items.', 'doublescale')}
							</td>
						</tr>
					) : (
						rows.map((item, index) => (
							<tr key={index} className="border-b">
								<td className="px-4 py-2">
									<div className="font-medium">{item.description || '—'}</div>
									{item.long_description ? (
										<div className="text-xs text-muted-foreground whitespace-pre-wrap">
											{item.long_description}
										</div>
									) : null}
								</td>
								<td className="px-4 py-2 text-right">{item.qty}</td>
								<td className="px-4 py-2 text-right">
									{formatMoney(item.rate, currency)}
								</td>
								{showTax ? (
									<td className="px-4 py-2 text-right text-xs text-muted-foreground">
										{(item.tax || [])
											.map((t) => `${t.name} (${t.rate}%)`)
											.join(', ') || '—'}
									</td>
								) : null}
								<td className="px-4 py-2 text-right">
									{formatMoney(item.amount, currency)}
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
		<div className="flex justify-end">
			<div className="w-full max-w-xs space-y-1 text-sm">
				<div className="flex justify-between">
					<span className="text-muted-foreground">{__('Subtotal', 'doublescale')}</span>
					<span>{formatMoney(subtotal, currency)}</span>
				</div>
				{totalTax > 0 ? (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{__('Tax', 'doublescale')}</span>
						<span>{formatMoney(totalTax, currency)}</span>
					</div>
				) : null}
				{computed.discount > 0 ? (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{__('Discount', 'doublescale')}</span>
						<span>-{formatMoney(computed.discount, currency)}</span>
					</div>
				) : null}
				{adjustment !== 0 ? (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{__('Adjustment', 'doublescale')}</span>
						<span>{formatMoney(adjustment, currency)}</span>
					</div>
				) : null}
				<div className="flex justify-between font-semibold border-t pt-2">
					<span>{__('Total', 'doublescale')}</span>
					<span>{formatMoney(total, currency)}</span>
				</div>
				{amountPaid !== undefined ? (
					<>
						<div className="flex justify-between">
							<span className="text-muted-foreground">{__('Amount Paid', 'doublescale')}</span>
							<span>{formatMoney(amountPaid, currency)}</span>
						</div>
						<div className="flex justify-between font-semibold text-red-700">
							<span>{__('Balance Due', 'doublescale')}</span>
							<span>{formatMoney(balance ?? 0, currency)}</span>
						</div>
					</>
				) : null}
			</div>
		</div>
	);
};

interface ProposalDocumentPreviewProps {
	proposal: Proposal;
}

export const ProposalDocumentPreview: React.FC<ProposalDocumentPreviewProps> = ({
	proposal,
}) => {
	const addressLines = [
		proposal.to_name,
		proposal.address,
		[proposal.city, proposal.state].filter(Boolean).join(', '),
		proposal.zip,
		proposal.country,
		proposal.email,
		proposal.phone,
	]
		.filter(Boolean)
		.join('\n');

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">{proposal.proposal_number}</h2>
					<p className="text-muted-foreground">{proposal.subject}</p>
				</div>
				<ProposalStatusPill status={proposal.status} expired={proposal.is_expired} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
				<div>
					<div className="font-medium mb-1">{__('To', 'doublescale')}</div>
					<pre className="whitespace-pre-wrap text-muted-foreground font-sans">
						{formatAddress(addressLines)}
					</pre>
				</div>
				<div className="space-y-1 text-right md:text-left md:ml-auto">
					<div>
						<span className="text-muted-foreground">{__('Date', 'doublescale')}: </span>
						{proposal.date || '—'}
					</div>
					<div>
						<span className="text-muted-foreground">{__('Open Till', 'doublescale')}: </span>
						{proposal.open_till || '—'}
					</div>
					<div>
						<span className="text-muted-foreground">{__('Currency', 'doublescale')}: </span>
						{proposal.currency}
					</div>
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
		</div>
	);
};

interface InvoiceDocumentPreviewProps {
	invoice: Invoice;
}

export const InvoiceDocumentPreview: React.FC<InvoiceDocumentPreviewProps> = ({
	invoice,
}) => (
	<div className="space-y-6">
		<div className="flex items-start justify-between gap-4">
			<div>
				<h2 className="text-xl font-semibold">{invoice.invoice_number}</h2>
				<p className="text-muted-foreground">
					{invoice.contact
						? [invoice.contact.first_name, invoice.contact.last_name]
								.filter(Boolean)
								.join(' ') || invoice.contact.email
						: null}
				</p>
			</div>
			<InvoiceStatusPill status={invoice.status} />
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
			<div>
				<div className="font-medium mb-1">{__('Bill To', 'doublescale')}</div>
				<pre className="whitespace-pre-wrap text-muted-foreground font-sans">
					{formatAddress(invoice.billing_address)}
				</pre>
			</div>
			<div className="space-y-1">
				<div>
					<span className="text-muted-foreground">{__('Invoice Date', 'doublescale')}: </span>
					{invoice.invoice_date || '—'}
				</div>
				<div>
					<span className="text-muted-foreground">{__('Due Date', 'doublescale')}: </span>
					{invoice.due_date || '—'}
				</div>
				<div>
					<span className="text-muted-foreground">{__('Currency', 'doublescale')}: </span>
					{invoice.currency}
				</div>
			</div>
		</div>

		{invoice.shipping_address ? (
			<div className="text-sm">
				<div className="font-medium mb-1">{__('Ship To', 'doublescale')}</div>
				<pre className="whitespace-pre-wrap text-muted-foreground font-sans">
					{formatAddress(invoice.shipping_address)}
				</pre>
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
			<div className="text-sm">
				<div className="font-medium mb-1">{__('Client Note', 'doublescale')}</div>
				<p className="text-muted-foreground whitespace-pre-wrap">{invoice.client_note}</p>
			</div>
		) : null}

		{invoice.terms ? (
			<div className="text-sm">
				<div className="font-medium mb-1">{__('Terms', 'doublescale')}</div>
				<p className="text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p>
			</div>
		) : null}
	</div>
);
