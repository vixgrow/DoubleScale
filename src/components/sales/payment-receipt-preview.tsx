/**
 * Payment receipt preview (Perfex-style layout).
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';
import type { PaymentDetail } from '@/types/sales';

import './payment-receipt-preview.scss';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const modeLabel = (mode: string | null): string => {
	if (!mode) {
		return '—';
	}
	return PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode;
};

const linesFromText = (text: string | null | undefined): string[] =>
	(text || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

const contactLines = (payment: PaymentDetail): string[] => {
	const billing = linesFromText(payment.invoice?.billing_address);
	if (billing.length) {
		return billing;
	}
	const c = payment.contact;
	if (!c) {
		return [];
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return [name, c.email].filter(Boolean) as string[];
};

interface PaymentReceiptPreviewProps {
	payment: PaymentDetail;
}

export const PaymentReceiptPreview: React.FC<PaymentReceiptPreviewProps> = ({ payment }) => {
	const navigate = useNavigate();
	const currency = payment.invoice?.currency || 'USD';
	const companyLines = linesFromText(payment.company?.address);
	const customerLines = contactLines(payment);
	const contactId = payment.contact?.id;

	return (
		<div className="ds-payment-receipt">
			<div className="ds-payment-receipt__parties">
				<div className="ds-payment-receipt__party">
					<strong>{payment.company?.name || ''}</strong>
					{companyLines.map((line) => (
						<div key={line} className="ds-payment-receipt__muted">
							{line}
						</div>
					))}
					{payment.company?.url ? (
						<div className="ds-payment-receipt__muted">{payment.company.url}</div>
					) : null}
				</div>
				<div className="ds-payment-receipt__party ds-payment-receipt__party--right">
					{customerLines.map((line, index) =>
						index === 0 ? (
							contactId ? (
								<Button
									key={line}
									variant="link"
									className="ds-payment-receipt__customer h-auto p-0 font-bold"
									onClick={() => navigate(getToLink(`contacts/${contactId}`))}
								>
									{line}
								</Button>
							) : (
								<strong key={line} className="ds-payment-receipt__customer">
									{line}
								</strong>
							)
						) : (
							<div key={line} className="ds-payment-receipt__muted">
								{line}
							</div>
						)
					)}
				</div>
			</div>

			<h2 className="ds-payment-receipt__title">{__('PAYMENT RECEIPT', 'doublescale')}</h2>

			<div className="ds-payment-receipt__meta">
				<div>
					<span className="ds-payment-receipt__label">{__('Payment Date', 'doublescale')}</span>
					<div>{payment.payment_date || '—'}</div>
				</div>
				<div>
					<span className="ds-payment-receipt__label">{__('Payment Mode', 'doublescale')}</span>
					<div>{modeLabel(payment.payment_mode)}</div>
				</div>
			</div>

			<div className="ds-payment-receipt__total">
				<div className="ds-payment-receipt__total-label">{__('Total Amount', 'doublescale')}</div>
				<div className="ds-payment-receipt__total-value">
					{formatMoney(payment.amount, currency)}
				</div>
			</div>

			<h3 className="ds-payment-receipt__section-title">{__('Payment For', 'doublescale')}</h3>

			<div className="ds-payment-receipt__table-wrap">
				<table className="ds-payment-receipt__table">
					<thead>
						<tr>
							<th>{__('Invoice Number', 'doublescale')}</th>
							<th>{__('Invoice Date', 'doublescale')}</th>
							<th className="is-right">{__('Invoice Amount', 'doublescale')}</th>
							<th className="is-right">{__('Payment Amount', 'doublescale')}</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>{payment.invoice?.invoice_number || `#${payment.invoice_id}`}</td>
							<td>{payment.invoice?.invoice_date || '—'}</td>
							<td className="is-right">
								{formatMoney(payment.invoice?.total ?? 0, currency)}
							</td>
							<td className="is-right">{formatMoney(payment.amount, currency)}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
};
