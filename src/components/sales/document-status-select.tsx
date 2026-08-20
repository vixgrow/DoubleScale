/**
 * Clickable status pills for invoice and proposal lists and detail headers.
 *
 * Invoice "Paid" is not a status flip: it opens the record-payment flow so
 * `amount_paid` stays the source of truth.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@doublescale/components/ui/dropdown-menu';
import { InvoiceStatusPill, ProposalStatusPill } from './status-pill';
import {
	INVOICE_STATUS_LABELS,
	MANUAL_INVOICE_STATUSES,
	PROPOSAL_STATUS_LABELS,
	PROPOSAL_STATUSES,
	type InvoiceStatus,
	type ProposalStatus,
} from '@/constants/sales';
import type { Invoice } from '@/types/sales';

export const getInvoiceBalanceDue = (
	invoice: Pick<Invoice, 'total' | 'amount_paid' | 'balance'>
): number => Math.max(0, invoice.balance ?? invoice.total - invoice.amount_paid);

export const invoiceCanMarkPaid = (invoice: Invoice): boolean =>
	invoice.status !== 'paid' &&
	invoice.status !== 'draft' &&
	getInvoiceBalanceDue(invoice) > 0;

const CheckMark: React.FC = () => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		className="ml-auto shrink-0"
	>
		<path
			d="M20 6L9 17L4 12"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

interface InvoiceStatusSelectProps {
	status: InvoiceStatus;
	disabled?: boolean;
	busy?: boolean;
	canMarkPaid?: boolean;
	onChange: (status: InvoiceStatus) => void;
	onMarkPaid?: () => void;
}

export const InvoiceStatusSelect: React.FC<InvoiceStatusSelectProps> = ({
	status,
	disabled = false,
	busy = false,
	canMarkPaid = false,
	onChange,
	onMarkPaid,
}) => {
	const showPaid = Boolean(canMarkPaid && onMarkPaid);
	const showManual = MANUAL_INVOICE_STATUSES.includes(status);
	const interactive = !disabled && (showManual || showPaid);

	if (!interactive) {
		return <InvoiceStatusPill status={status} />;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={busy}>
				<button
					type="button"
					className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label={__('Change status', 'doublescale')}
					onClick={(event) => event.stopPropagation()}
				>
					<InvoiceStatusPill status={status} interactive />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				onClick={(event) => event.stopPropagation()}
			>
				{showManual
					? MANUAL_INVOICE_STATUSES.map((next) => (
							<DropdownMenuItem
								key={next}
								disabled={busy || next === status}
								onClick={() => {
									if (next !== status) {
										onChange(next);
									}
								}}
							>
								{INVOICE_STATUS_LABELS[next]}
								{next === status ? <CheckMark /> : null}
							</DropdownMenuItem>
						))
					: (
							<DropdownMenuItem disabled>
								{INVOICE_STATUS_LABELS[status]}
								<CheckMark />
							</DropdownMenuItem>
						)}
				{showPaid ? (
					<DropdownMenuItem
						disabled={busy}
						onClick={() => onMarkPaid?.()}
					>
						{INVOICE_STATUS_LABELS.paid}
					</DropdownMenuItem>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

interface ProposalStatusSelectProps {
	status: ProposalStatus;
	expired?: boolean;
	disabled?: boolean;
	busy?: boolean;
	onChange: (status: ProposalStatus) => void;
}

export const ProposalStatusSelect: React.FC<ProposalStatusSelectProps> = ({
	status,
	expired = false,
	disabled = false,
	busy = false,
	onChange,
}) => {
	if (disabled) {
		return <ProposalStatusPill status={status} expired={expired} />;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={busy}>
				<button
					type="button"
					className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label={__('Change status', 'doublescale')}
					onClick={(event) => event.stopPropagation()}
				>
					<ProposalStatusPill status={status} expired={expired} interactive />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				onClick={(event) => event.stopPropagation()}
			>
				{PROPOSAL_STATUSES.map((next) => (
					<DropdownMenuItem
						key={next}
						disabled={busy || next === status}
						onClick={() => {
							if (next !== status) {
								onChange(next);
							}
						}}
					>
						{PROPOSAL_STATUS_LABELS[next]}
						{next === status ? <CheckMark /> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
