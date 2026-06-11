/**
 * Dialog to record a payment against an invoice.
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import { PAYMENT_MODES, PAYMENT_MODE_LABELS } from '@/constants/sales';
import type { Invoice, RecordPaymentPayload } from '@/types/sales';

const today = () => new Date().toISOString().slice(0, 10);

interface RecordPaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoice: Invoice;
	busy?: boolean;
	onSubmit: (payload: RecordPaymentPayload) => void | Promise<void>;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
	open,
	onOpenChange,
	invoice,
	busy = false,
	onSubmit,
}) => {
	const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);

	const modeOptions = useMemo(() => {
		const allowed = invoice.allowed_payment_modes?.filter(Boolean) ?? [];
		if (allowed.length > 0) {
			return allowed.map((mode) => ({
				value: mode,
				label:
					PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode,
			}));
		}
		return PAYMENT_MODES.map((mode) => ({
			value: mode,
			label: PAYMENT_MODE_LABELS[mode],
		}));
	}, [invoice.allowed_payment_modes]);

	const [amount, setAmount] = useState(String(balanceDue));
	const [paymentMode, setPaymentMode] = useState(modeOptions[0]?.value ?? 'bank_transfer');
	const [paymentDate, setPaymentDate] = useState(today());
	const [transactionId, setTransactionId] = useState('');
	const [note, setNote] = useState('');

	useEffect(() => {
		if (open) {
			setAmount(String(balanceDue));
			setPaymentMode(modeOptions[0]?.value ?? 'bank_transfer');
			setPaymentDate(today());
			setTransactionId('');
			setNote('');
		}
	}, [open, balanceDue, modeOptions]);

	const handleSubmit = () => {
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{__('Record Payment', 'doublescale')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{__('Amount', 'doublescale')}</Label>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							{__('Balance due:', 'doublescale')}{' '}
							{new Intl.NumberFormat(undefined, {
								style: 'currency',
								currency: invoice.currency,
							}).format(balanceDue)}
						</p>
					</div>

					<div className="space-y-2">
						<Label>{__('Payment Mode', 'doublescale')}</Label>
						<Select value={paymentMode} onValueChange={setPaymentMode}>
							<SelectTrigger>
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
						<Label>{__('Payment Date', 'doublescale')}</Label>
						<DatePicker value={paymentDate} onChange={setPaymentDate} />
					</div>

					<div className="space-y-2">
						<Label>{__('Transaction ID', 'doublescale')}</Label>
						<Input
							value={transactionId}
							onChange={(e) => setTransactionId(e.target.value)}
							placeholder={__('Optional', 'doublescale')}
						/>
					</div>

					<div className="space-y-2">
						<Label>{__('Note', 'doublescale')}</Label>
						<Textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							rows={3}
							placeholder={__('Optional', 'doublescale')}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button onClick={handleSubmit} disabled={busy}>
						{busy ? __('Saving…', 'doublescale') : __('Record Payment', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
