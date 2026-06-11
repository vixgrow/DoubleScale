/**
 * Contact tab: proposals, invoices, and payments.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus } from 'lucide-react';

import { getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import { InvoiceStatusPill, ProposalStatusPill } from '@/components/sales';
import {
	useContactSalesPayments,
	useInvoices,
	useProposals,
} from '@/hooks/sales';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';

interface ContactSalesProps {
	contact_id: number;
	navigate?: (path: string) => void;
}

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const modeLabel = (mode: string | null): string => {
	if (!mode) {
		return '—';
	}
	return PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode;
};

const ContactSales: React.FC<ContactSalesProps> = ({ contact_id, navigate }) => {
	const go = (path: string) => {
		if (navigate) {
			navigate(getToLink(path));
		}
	};

	const { data: proposalsData, loading: proposalsLoading } = useProposals({
		contact_id,
		per_page: 10,
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const { data: invoicesData, loading: invoicesLoading } = useInvoices({
		contact_id,
		per_page: 10,
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const [paymentsPage] = useState(1);
	const { data: paymentsData, loading: paymentsLoading } = useContactSalesPayments(
		contact_id,
		paymentsPage,
		10
	);

	const proposals = proposalsData?.data ?? [];
	const invoices = invoicesData?.data ?? [];
	const payments = paymentsData?.data ?? [];

	return (
		<div className="space-y-8">
			<section className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<h3 className="text-base font-semibold">{__('Proposals', 'doublescale')}</h3>
					<Button size="sm" variant="outline" onClick={() => go('sales/proposals/new')}>
						<Plus className="h-4 w-4 mr-1" />
						{__('New Proposal', 'doublescale')}
					</Button>
				</div>
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 border-b">
							<tr>
								<th className="text-left px-4 py-2">{__('Number', 'doublescale')}</th>
								<th className="text-left px-4 py-2">{__('Subject', 'doublescale')}</th>
								<th className="text-right px-4 py-2">{__('Total', 'doublescale')}</th>
								<th className="text-left px-4 py-2">{__('Status', 'doublescale')}</th>
							</tr>
						</thead>
						<tbody>
							{proposalsLoading ? (
								<tr>
									<td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
										{__('Loading…', 'doublescale')}
									</td>
								</tr>
							) : proposals.length === 0 ? (
								<tr>
									<td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
										{__('No proposals for this contact.', 'doublescale')}
									</td>
								</tr>
							) : (
								proposals.map((proposal) => (
									<tr
										key={proposal.id}
										className="border-b hover:bg-slate-50 cursor-pointer"
										onClick={() => go(`sales/proposals/${proposal.id}`)}
									>
										<td className="px-4 py-2 font-medium">{proposal.proposal_number}</td>
										<td className="px-4 py-2">{proposal.subject}</td>
										<td className="px-4 py-2 text-right">
											{formatMoney(proposal.total, proposal.currency)}
										</td>
										<td className="px-4 py-2">
											<ProposalStatusPill
												status={proposal.status}
												expired={proposal.is_expired}
											/>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<h3 className="text-base font-semibold">{__('Invoices', 'doublescale')}</h3>
					<Button size="sm" variant="outline" onClick={() => go('sales/invoices/new')}>
						<Plus className="h-4 w-4 mr-1" />
						{__('New Invoice', 'doublescale')}
					</Button>
				</div>
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 border-b">
							<tr>
								<th className="text-left px-4 py-2">{__('Number', 'doublescale')}</th>
								<th className="text-right px-4 py-2">{__('Total', 'doublescale')}</th>
								<th className="text-right px-4 py-2">{__('Paid', 'doublescale')}</th>
								<th className="text-left px-4 py-2">{__('Status', 'doublescale')}</th>
							</tr>
						</thead>
						<tbody>
							{invoicesLoading ? (
								<tr>
									<td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
										{__('Loading…', 'doublescale')}
									</td>
								</tr>
							) : invoices.length === 0 ? (
								<tr>
									<td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
										{__('No invoices for this contact.', 'doublescale')}
									</td>
								</tr>
							) : (
								invoices.map((invoice) => (
									<tr
										key={invoice.id}
										className="border-b hover:bg-slate-50 cursor-pointer"
										onClick={() => go(`sales/invoices/${invoice.id}`)}
									>
										<td className="px-4 py-2 font-medium">{invoice.invoice_number}</td>
										<td className="px-4 py-2 text-right">
											{formatMoney(invoice.total, invoice.currency)}
										</td>
										<td className="px-4 py-2 text-right">
											{formatMoney(invoice.amount_paid, invoice.currency)}
										</td>
										<td className="px-4 py-2">
											<InvoiceStatusPill status={invoice.status} />
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			<section className="space-y-3">
				<h3 className="text-base font-semibold">{__('Payments', 'doublescale')}</h3>
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 border-b">
							<tr>
								<th className="text-left px-4 py-2">{__('Date', 'doublescale')}</th>
								<th className="text-left px-4 py-2">{__('Invoice', 'doublescale')}</th>
								<th className="text-left px-4 py-2">{__('Mode', 'doublescale')}</th>
								<th className="text-right px-4 py-2">{__('Amount', 'doublescale')}</th>
							</tr>
						</thead>
						<tbody>
							{paymentsLoading ? (
								<tr>
									<td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
										{__('Loading…', 'doublescale')}
									</td>
								</tr>
							) : payments.length === 0 ? (
								<tr>
									<td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
										{__('No payments recorded for this contact.', 'doublescale')}
									</td>
								</tr>
							) : (
								payments.map((payment) => (
									<tr
										key={payment.id}
										className="border-b hover:bg-slate-50 cursor-pointer"
										onClick={() => go(`sales/invoices/${payment.invoice_id}`)}
									>
										<td className="px-4 py-2">{payment.payment_date || '—'}</td>
										<td className="px-4 py-2">
											{payment.invoice?.invoice_number || `#${payment.invoice_id}`}
										</td>
										<td className="px-4 py-2">{modeLabel(payment.payment_mode)}</td>
										<td className="px-4 py-2 text-right">
											{formatMoney(
												payment.amount,
												payment.invoice?.currency || 'USD'
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
};

export default ContactSales;
