/**
 * Invoice payments table with per-row delete.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';
import { ConfirmDialog } from './confirm-dialog';
import type { Invoice, InvoicePayment } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const modeLabel = (mode: string | null): string => {
	if (!mode) {
		return '—';
	}
	return PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode;
};

interface PaymentsListProps {
	invoice: Invoice;
	payments: InvoicePayment[];
	loading?: boolean;
	onDelete: (paymentId: number) => void | Promise<void>;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({
	invoice,
	payments,
	loading = false,
	onDelete,
}) => {
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);

	const confirmDelete = async () => {
		if (!deleteId) {
			return;
		}
		setDeleting(true);
		try {
			await onDelete(deleteId);
			setDeleteId(null);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="space-y-3">
			<h3 className="text-lg font-medium">{__('Payments', 'doublescale')}</h3>

			<div className="border rounded-lg overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-slate-50 border-b">
						<tr>
							<th className="text-left px-4 py-2">{__('Date', 'doublescale')}</th>
							<th className="text-left px-4 py-2">{__('Mode', 'doublescale')}</th>
							<th className="text-left px-4 py-2">{__('Transaction', 'doublescale')}</th>
							<th className="text-right px-4 py-2">{__('Amount', 'doublescale')}</th>
							<th className="w-12 px-2 py-2" />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</td>
							</tr>
						) : payments.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
									{__('No payments recorded.', 'doublescale')}
								</td>
							</tr>
						) : (
							payments.map((payment) => (
								<tr key={payment.id} className="border-b">
									<td className="px-4 py-2">{payment.payment_date || '—'}</td>
									<td className="px-4 py-2">{modeLabel(payment.payment_mode)}</td>
									<td className="px-4 py-2">{payment.transaction_id || '—'}</td>
									<td className="px-4 py-2 text-right">
										{formatMoney(payment.amount, invoice.currency)}
									</td>
									<td className="px-2 py-2">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-red-600 hover:text-red-700"
											onClick={() => setDeleteId(payment.id)}
											aria-label={__('Delete payment', 'doublescale')}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
				title={__('Delete Payment', 'doublescale')}
				description={__(
					'Are you sure you want to delete this payment? The invoice status will be updated.',
					'doublescale'
				)}
				confirmLabel={__('Delete', 'doublescale')}
				destructive
				busy={deleting}
				onConfirm={confirmDelete}
			/>
		</div>
	);
};
