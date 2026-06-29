/**
 * Editable payment form.
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { OFFLINE_PAYMENT_MODES, PAYMENT_MODE_LABELS } from '@/constants/sales';
import type { PaymentDetail, RecordPaymentPayload } from '@/types/sales';

const RequiredMark = () => (
	<span className="text-red-500 ml-0.5" aria-hidden="true">
		*
	</span>
);

interface PaymentFormProps {
	payment: PaymentDetail;
	busy?: boolean;
	error?: string | null;
	readOnly?: boolean;
	onSubmit: (payload: RecordPaymentPayload) => void | Promise<void>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
	payment,
	busy = false,
	error = null,
	readOnly = false,
	onSubmit,
}) => {
	const currency = payment.invoice?.currency || 'USD';
	const maxAmount = useMemo(() => {
		const total = payment.invoice?.total ?? 0;
		const paid = payment.invoice?.amount_paid ?? 0;
		return Math.max(0, total - paid + payment.amount);
	}, [payment]);

	const modeOptions = useMemo(() => {
		const modes = new Set<string>([...OFFLINE_PAYMENT_MODES]);
		if (payment.payment_mode) {
			modes.add(payment.payment_mode);
		}
		return [...modes].map((mode) => ({
			value: mode,
			label: PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode,
		}));
	}, [payment.payment_mode]);

	const [amount, setAmount] = useState(String(payment.amount));
	const [paymentMode, setPaymentMode] = useState(
		payment.payment_mode || modeOptions[0]?.value || 'bank_transfer'
	);
	const [paymentDate, setPaymentDate] = useState(payment.payment_date || '');
	const [transactionId, setTransactionId] = useState(payment.transaction_id || '');
	const [note, setNote] = useState(payment.note || '');

	useEffect(() => {
		setAmount(String(payment.amount));
		setPaymentMode(payment.payment_mode || modeOptions[0]?.value || 'bank_transfer');
		setPaymentDate(payment.payment_date || '');
		setTransactionId(payment.transaction_id || '');
		setNote(payment.note || '');
	}, [payment, modeOptions]);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (readOnly) {
			return;
		}
		const parsed = parseFloat(amount);
		if (!parsed || parsed <= 0) {
			return;
		}
		void onSubmit({
			amount: parsed,
			payment_mode: paymentMode,
			payment_date: paymentDate,
			transaction_id: transactionId.trim() || undefined,
			note: note.trim() || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{readOnly ? (
				<div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
					{__(
						'Recorded payments cannot be edited. Contact a sales manager if changes are needed.',
						'doublescale'
					)}
				</div>
			) : null}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label htmlFor="payment-amount">
						{__('Amount Received', 'doublescale')}
						<RequiredMark />
					</Label>
					<Input
						id="payment-amount"
						type="number"
						min="0"
						step="0.01"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						disabled={readOnly}
						readOnly={readOnly}
						required
					/>
					<p className="text-xs text-muted-foreground">
						{__('Maximum:', 'doublescale')}{' '}
						{new Intl.NumberFormat(undefined, {
							style: 'currency',
							currency,
						}).format(maxAmount)}
					</p>
				</div>

				<div className="space-y-2">
					<Label>
						{__('Payment Date', 'doublescale')}
						<RequiredMark />
					</Label>
					<DatePicker value={paymentDate} onChange={setPaymentDate} disabled={readOnly} />
				</div>

				<div className="space-y-2">
					<Label>{__('Payment Mode', 'doublescale')}</Label>
					<Select value={paymentMode} onValueChange={setPaymentMode} disabled={readOnly}>
						<SelectTrigger disabled={readOnly}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{modeOptions.map((mode) => (
								<SelectItem key={mode.value} value={mode.value}>
									{mode.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="payment-transaction-id">{__('Transaction ID', 'doublescale')}</Label>
					<Input
						id="payment-transaction-id"
						value={transactionId}
						onChange={(e) => setTransactionId(e.target.value)}
						disabled={readOnly}
						readOnly={readOnly}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="payment-note">{__('Note', 'doublescale')}</Label>
				<Textarea
					id="payment-note"
					value={note}
					onChange={(e) => setNote(e.target.value)}
					disabled={readOnly}
					readOnly={readOnly}
					rows={4}
				/>
			</div>

			{error ? (
				<div
					className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					role="alert"
				>
					{error}
				</div>
			) : null}

			{!readOnly ? (
				<div className="flex justify-end">
					<Button type="submit" disabled={busy}>
						{busy ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
					</Button>
				</div>
			) : null}
		</form>
	);
};
