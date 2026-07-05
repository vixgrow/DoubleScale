/**
 * Invoice payments table with per-row delete.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { DeleteIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';
import { formatSalesAmount } from './line-items-editor';
import { ConfirmDialog } from './confirm-dialog';
import type { Invoice, InvoicePayment } from '@/types/sales';

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
		<div className="space-y-4">
			<h2 className="text-base font-semibold text-accent-foreground">
				{__('Payments', 'doublescale')}
			</h2>

			<div className="overflow-hidden rounded-lg border border-border bg-white">
				<Table>
					<TableHeader className="bg-[#F8F8F8]">
						<TableRow>
							<TableHead>{__('Date', 'doublescale')}</TableHead>
							<TableHead>{__('Mode', 'doublescale')}</TableHead>
							<TableHead>{__('Transaction', 'doublescale')}</TableHead>
							<TableHead className="text-right">
								{__('Amount', 'doublescale')}
							</TableHead>
							<TableHead className="w-16 text-center">
								{__('Actions', 'doublescale')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="py-8 text-center text-muted-foreground"
								>
									{__('Loading…', 'doublescale')}
								</TableCell>
							</TableRow>
						) : payments.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="py-8 text-center text-muted-foreground"
								>
									{__('No payments recorded.', 'doublescale')}
								</TableCell>
							</TableRow>
						) : (
							payments.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell>{payment.payment_date || '—'}</TableCell>
									<TableCell>{modeLabel(payment.payment_mode)}</TableCell>
									<TableCell>{payment.transaction_id || '—'}</TableCell>
									<TableCell className="text-right font-medium">
										{formatSalesAmount(payment.amount, invoice.currency)}
									</TableCell>
									<TableCell>
										<div className="flex items-center justify-center">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive"
												onClick={() => setDeleteId(payment.id)}
												aria-label={__('Delete payment', 'doublescale')}
											>
												<DeleteIcon width={18} height={18} />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
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
