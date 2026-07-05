/**
 * Status pills for sales documents.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	INVOICE_STATUS_LABELS,
	PROPOSAL_STATUS_LABELS,
	CONTRACT_STATUS_LABELS,
	type InvoiceStatus,
	type ProposalStatus,
	type ContractStatus,
} from '@/constants/sales';

const proposalClasses: Record<ProposalStatus, string> = {
	draft: 'bg-slate-100 text-slate-700',
	sent: 'bg-sky-100 text-sky-700',
	open: 'bg-gray-100 text-gray-700',
	declined: 'bg-red-100 text-destructive',
	accepted: 'bg-green-100 text-green-700',
};

const invoiceClasses: Record<InvoiceStatus, string> = {
	draft: 'bg-[#ECECEC] text-[#6B6C76]',
	unpaid: 'bg-[#FAEADF] text-[#CB5301]',
	partially_paid: 'bg-[#F7F4C3] text-[#896900]',
	paid: 'bg-[#E4FAEC] text-[#16A34A]',
	overdue: 'bg-[#FBE8E8] text-[#C30A0A]',
};

const contractClasses: Record<ContractStatus, string> = {
	draft: 'bg-[#ECECEC] text-[#6B6C76]',
	sent: 'bg-[#E4FAEC] text-[#16A34A]',
	signed: 'bg-[#F7F4C3] text-[#896900]',
	active: 'bg-[#E4FAEC] text-[#16A34A]',
	expired: 'bg-[#FAEADF] text-[#CB5301]',
};

export const ProposalStatusPill: React.FC<{
	status: ProposalStatus;
	expired?: boolean;
}> = ({ status, expired = false }) => (
	<span className="inline-flex items-center gap-1.5">
		<span
			className={`inline-flex items-center rounded-lg px-2 py-1 text-sm font-medium ${proposalClasses[status] || proposalClasses.draft}`}
		>
			{PROPOSAL_STATUS_LABELS[status] || status}
		</span>
		{expired ? (
			<span className="inline-flex items-center rounded-lg px-2 py-1 text-sm font-medium bg-amber-100 text-amber-800">
				{__('Expired', 'doublescale')}
			</span>
		) : null}
	</span>
);

export const ContractStatusPill: React.FC<{
	status: ContractStatus;
	expired?: boolean;
	aboutToExpire?: boolean;
}> = ({ status, expired = false, aboutToExpire = false }) => (
	<span className="inline-flex items-center gap-1.5">
		<span
			className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${contractClasses[status] || contractClasses.draft}`}
		>
			{CONTRACT_STATUS_LABELS[status] || status}
		</span>
		{expired ? (
			<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
				{__('Expired', 'doublescale')}
			</span>
		) : null}
		{aboutToExpire && !expired ? (
			<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
				{__('Expiring Soon', 'doublescale')}
			</span>
		) : null}
	</span>
);

export const InvoiceStatusPill: React.FC<{ status: InvoiceStatus }> = ({
	status,
}) => (
	<span
		className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${invoiceClasses[status] || invoiceClasses.draft}`}
	>
		{INVOICE_STATUS_LABELS[status] || status}
	</span>
);
