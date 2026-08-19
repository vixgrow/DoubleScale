/**
 * Payment receipt preview.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { useNavigate, getToLink } from '@doublescale/navigation';
import {
	CalendarIcon,
	CurrencyIcon,
	PaymentModeIcon,
	UserIcon,
} from '@doublescale/components';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';
import { formatMoney } from '@/constants/currencies';
import type { PaymentDetail } from '@/types/sales';

const formatDetailAmount = formatMoney;
const formatTableAmount = formatMoney;

const modeLabel = (mode: string | null): string => {
	if (!mode) {
		return '—';
	}
	return PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode;
};

const contactDisplayName = (payment: PaymentDetail): string => {
	const c = payment.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

const DetailRow: React.FC<{
	icon: React.ReactNode;
	label: string;
	value: string;
}> = ({ icon, label, value }) => (
	<div className="flex items-center gap-2.5">
		<span className="shrink-0 text-muted-foreground">{icon}</span>
		<p className="min-w-0 text-sm text-foreground">
			<span className="font-medium">{label}:</span>{' '}
			<span className="text-muted-foreground">{value}</span>
		</p>
	</div>
);

interface PaymentReceiptPreviewProps {
	payment: PaymentDetail;
}

export const PaymentReceiptPreview: React.FC<PaymentReceiptPreviewProps> = ({
	payment,
}) => {
	const navigate = useNavigate();
	const currency = payment.invoice?.currency || 'USD';
	const contactId = payment.contact?.id;
	const customerName = contactDisplayName(payment);
	const customerEmail = payment.contact?.email || '';

	const companyAddress = payment.company?.address?.trim() || '';
	const companyRegistration = payment.company?.registration_number?.trim() || '';
	const companyTaxVat = payment.company?.tax_vat_number?.trim() || '';

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 border-b border-border pb-6">
				<div className="rounded-xl bg-[#F7F8FA] border border-border p-6">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0 space-y-1">
							<div className="text-base font-semibold text-foreground">
								{payment.company?.name || ''}
							</div>
							{payment.company?.url ? (
								<div className="text-sm text-muted-foreground">
									{payment.company.url}
								</div>
							) : null}
							{companyAddress ? (
								<div className="whitespace-pre-line text-sm text-muted-foreground">
									{companyAddress}
								</div>
							) : null}
							{companyRegistration ? (
								<div className="text-sm text-muted-foreground">
									{__('Registration:', 'doublescale')} {companyRegistration}
								</div>
							) : null}
							{companyTaxVat ? (
								<div className="text-sm text-muted-foreground">
									{__('Tax/VAT:', 'doublescale')} {companyTaxVat}
								</div>
							) : null}
						</div>

						<div className="flex min-w-0 items-start gap-3 sm:max-w-[240px] sm:justify-start">
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground">
								<UserIcon width={20} height={20} />
							</span>
							<div className="min-w-0 text-left">
								{contactId ? (
									<button
										type="button"
										className="text-left text-sm font-semibold text-primary hover:underline"
										onClick={() =>
											navigate(getToLink(`contacts/${contactId}`))
										}
									>
										{customerName}
									</button>
								) : (
									<div className="text-sm font-semibold text-foreground">
										{customerName}
									</div>
								)}
								{customerEmail ? (
									<div className="text-sm text-muted-foreground">
										{customerEmail}
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-border bg-[#F7F8FA] p-6">
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="space-y-4">
							<h4 className="text-base font-semibold text-foreground">
								{__('Payment Details', 'doublescale')}
							</h4>
							<DetailRow
								icon={<CalendarIcon width={18} height={18} />}
								label={__('Payment Date', 'doublescale')}
								value={payment.payment_date || '—'}
							/>
							<DetailRow
								icon={<PaymentModeIcon width={18} height={18} />}
								label={__('Payment Mode', 'doublescale')}
								value={modeLabel(payment.payment_mode)}
							/>
						</div>
						<div className="space-y-4 sm:text-left">
							<h4 className="text-base font-semibold text-foreground">
								{__('Amount', 'doublescale')}
							</h4>
							<div className="sm:flex sm:justify-start">
								<DetailRow
									icon={<CurrencyIcon width={18} height={18} />}
									label={__('Total Amount', 'doublescale')}
									value={formatDetailAmount(payment.amount, currency)}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h3 className="mb-4 text-lg font-semibold text-foreground">
					{__('Payment For', 'doublescale')}
				</h3>
				<div className="overflow-hidden rounded-xl border border-border bg-white">
					<Table>
						<TableHeader className="bg-[#F8F8F8]">
							<TableRow>
								<TableHead className="text-muted-foreground">
									{__('Invoice Number', 'doublescale')}
								</TableHead>
								<TableHead className="text-muted-foreground">
									{__('Invoice Date', 'doublescale')}
								</TableHead>
								<TableHead className="text-right text-muted-foreground">
									{__('Invoice Amount', 'doublescale')}
								</TableHead>
								<TableHead className="text-right text-muted-foreground">
									{__('Payment Amount', 'doublescale')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">
									{payment.invoice?.invoice_number ||
										`#${payment.invoice_id}`}
								</TableCell>
								<TableCell>
									{payment.invoice?.invoice_date || '—'}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatTableAmount(
										payment.invoice?.total ?? 0,
										currency
									)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatTableAmount(payment.amount, currency)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
};
