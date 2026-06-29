/**
 * Approval status banner for sales documents.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import type { DocumentApproval } from '@/types/sales';

const statusClasses: Record<DocumentApproval['status'], string> = {
	pending: 'bg-amber-50 text-amber-900 border-amber-200',
	approved: 'bg-green-50 text-green-900 border-green-200',
	rejected: 'bg-red-50 text-red-900 border-red-200',
};

export const ApprovalStatusBanner: React.FC<{
	approval?: DocumentApproval | null;
	showReapprovalWarning?: boolean;
}> = ({ approval, showReapprovalWarning = false }) => {
	if (!approval || !approval.status) {
		return null;
	}

	const className = statusClasses[approval.status] ?? statusClasses.pending;
	let message = approval.status_label;

	if (approval.status === 'rejected' && approval.rejection_reason) {
		message = `${approval.status_label} — ${approval.rejection_reason}`;
	}

	if (approval.status === 'pending') {
		message = __('Pending Approval', 'doublescale');
	}

	return (
		<div className={`rounded-lg border px-4 py-3 text-sm ${className}`}>
			<span className="font-medium">{message}</span>
			{approval.status === 'pending' ? (
				<p className="mt-1 text-xs opacity-90">
					{__(
						'This document is locked until a manager approves it.',
						'doublescale'
					)}
				</p>
			) : null}
			{showReapprovalWarning && approval.status === 'approved' ? (
				<p className="mt-1 text-xs opacity-90">
					{__(
						'Saving changes will require manager approval again before you can send this document.',
						'doublescale'
					)}
				</p>
			) : null}
		</div>
	);
};
