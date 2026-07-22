/**
 * Shared building blocks for document designs.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { computeAmount, computeLineItemsTotals } from '../../line-items-editor';
import type { LineItem } from '@/types/sales';
import type { DocumentDesignDateRow, DocumentDesignParty } from './types';

export const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

export const LineItemsTable: React.FC<{
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

export const TotalsBlock: React.FC<{
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

export const PartyBlock: React.FC<DocumentDesignParty> = ({ label, lines }) => (
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

export const DateRow: React.FC<DocumentDesignDateRow> = ({ label, value }) => (
	<div className="ds-sales-doc__date-row">
		<span className="ds-sales-doc__date-label">{label}:</span>
		{value || '—'}
	</div>
);

export const DocumentShell: React.FC<{
	designId: number;
	showAccent?: boolean;
	children: React.ReactNode;
}> = ({ designId, showAccent = true, children }) => (
	<div className={`ds-sales-doc ds-sales-doc--design-${designId}`}>
		{showAccent ? <div className="ds-sales-doc__accent" aria-hidden="true" /> : null}
		{children}
	</div>
);

export const DesignHeader: React.FC<{
	docTypeLabel: string;
	number: string;
	subject?: string | null;
	statusBadges: { label: string; className: string }[];
}> = ({ docTypeLabel, number, subject, statusBadges }) => (
	<div className="ds-sales-doc__header">
		<div className="ds-sales-doc__title-block">
			<p className="ds-sales-doc__doc-type">{docTypeLabel}</p>
			<h2 className="ds-sales-doc__number">{number}</h2>
			{subject ? <p className="ds-sales-doc__subject">{subject}</p> : null}
		</div>
		<div className="ds-sales-doc__status-group">
			{statusBadges.map((badge) => (
				<span key={badge.label} className={badge.className}>
					{badge.label}
				</span>
			))}
		</div>
	</div>
);

export const DesignMeta: React.FC<{
	parties: DocumentDesignParty[];
	dates: DocumentDesignDateRow[];
}> = ({ parties, dates }) => (
	<div className="ds-sales-doc__meta">
		{parties.map((party) => (
			<PartyBlock key={party.label} {...party} />
		))}
		<div className="ds-sales-doc__dates">
			{dates.map((date) => (
				<DateRow key={date.label} {...date} />
			))}
		</div>
	</div>
);

export const DesignSections: React.FC<{
	sections?: { title: string; body: string }[];
}> = ({ sections }) => (
	<>
		{(sections || []).map((section) => (
			<div key={section.title} className="ds-sales-doc__section">
				<h4 className="ds-sales-doc__section-title">{section.title}</h4>
				<p className="ds-sales-doc__section-body">{section.body}</p>
			</div>
		))}
	</>
);

export const docTypeLabel = (docType: 'invoice' | 'proposal') =>
	docType === 'invoice'
		? __('Invoice', 'doublescale')
		: __('Proposal', 'doublescale');
