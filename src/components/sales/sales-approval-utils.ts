/**
 * Helpers for the sales document approval workflow.
 */

import config from '@doublescale/config';
import type { DocumentApproval, SalesSettings } from '@/types/sales';

type RestishError = {
	code?: string;
	message?: string;
	data?: { status?: number };
};

export type SalesApprovalDocumentType = 'proposal' | 'invoice' | 'contract' | 'credit_note';

/** Server-shaped document fields from the approval workflow filter. */
export type ApprovalDocumentContext = {
	approval_workflow_enabled?: boolean;
	can_bypass_sales_approval?: boolean;
	can_edit_sales_document?: boolean;
	can_withdraw_sales_approval?: boolean;
	approval?: DocumentApproval | null;
};

const SUBMITTABLE_STATUSES: Record<SalesApprovalDocumentType, readonly string[]> = {
	proposal: ['draft', 'sent', 'open', 'accepted'],
	invoice: ['draft', 'unpaid', 'partially_paid', 'overdue'],
	contract: ['draft', 'sent', 'active', 'signed'],
	credit_note: ['draft', 'open', 'partially_applied'],
};

const bootWorkflowEnabled = (): boolean => {
	if (typeof window === 'undefined') {
		return false;
	}
	return Boolean(
		(window.doublescaleConfig as { salesApprovalWorkflowEnabled?: boolean } | undefined)
			?.salesApprovalWorkflowEnabled
	);
};

const salesCaps = (): Record<string, boolean> =>
	(config.getUserCapabilities() as Record<string, boolean>) ?? {};

/**
 * Mirrors server {@see Capabilities::can_approve_sales()} /
 * {@see Capabilities::can_manage_all_sales()} bypass rules.
 */
export const canBypassApprovalWorkflow = (
	document?: ApprovalDocumentContext | null
): boolean => {
	if (typeof document?.can_bypass_sales_approval === 'boolean') {
		return document.can_bypass_sales_approval;
	}

	const caps = salesCaps();
	return Boolean(
		caps.doublescale_approve_sales ||
			caps.doublescale_manage_all_sales ||
			caps.doublescale_manage
	);
};

/** @deprecated Prefer {@link canBypassApprovalWorkflow} for workflow gating. */
export const isSalesRepOnly = (): boolean => {
	const caps = salesCaps();
	return Boolean(
		caps.doublescale_manage_own_sales &&
			!caps.doublescale_manage_all_sales &&
			!caps.doublescale_approve_sales &&
			!caps.doublescale_manage
	);
};

export const canApproveSalesDocuments = (): boolean => canBypassApprovalWorkflow();

export const isApprovalLocked = (
	approval?: DocumentApproval | null,
	document?: ApprovalDocumentContext | null
): boolean => approval?.status === 'pending' && !canBypassApprovalWorkflow(document);

/**
 * Whether the current user may edit this document (server flag preferred).
 */
export const canEditSalesDocument = (
	workflowEnabled: boolean,
	approval?: DocumentApproval | null,
	document?: ApprovalDocumentContext | null
): boolean => {
	if (!workflowEnabled) {
		return true;
	}

	if (typeof document?.can_edit_sales_document === 'boolean') {
		return document.can_edit_sales_document;
	}

	return !isApprovalLocked(approval, document);
};

export const canWithdrawApproval = (document?: ApprovalDocumentContext | null): boolean => {
	if (typeof document?.can_withdraw_sales_approval === 'boolean') {
		return document.can_withdraw_sales_approval;
	}

	return false;
};

/** Approved documents must be submitted for approval again after any edit. */
export const requiresReapprovalAfterEdit = (
	workflowEnabled: boolean,
	approval?: DocumentApproval | null,
	document?: ApprovalDocumentContext | null
): boolean =>
	workflowEnabled &&
	!canBypassApprovalWorkflow(document) &&
	approval?.status === 'approved';

/**
 * Prefer the server-shaped document flag, then REST settings, then admin bootstrap.
 */
export const isApprovalWorkflowEnabled = (
	settings?: SalesSettings | null,
	document?: ApprovalDocumentContext | null
): boolean => {
	if (typeof document?.approval_workflow_enabled === 'boolean') {
		return document.approval_workflow_enabled;
	}

	if (settings != null && Object.prototype.hasOwnProperty.call(settings, 'approval_workflow_enabled')) {
		return Boolean(settings.approval_workflow_enabled);
	}

	return bootWorkflowEnabled();
};

export const documentAllowsApprovalSubmission = (
	documentType: SalesApprovalDocumentType,
	documentStatus: string
): boolean => SUBMITTABLE_STATUSES[documentType]?.includes(documentStatus) ?? false;

export const canSubmitForApproval = (
	workflowEnabled: boolean,
	documentType: SalesApprovalDocumentType,
	documentStatus: string,
	approval?: DocumentApproval | null,
	document?: ApprovalDocumentContext | null
): boolean => {
	if (!workflowEnabled || canBypassApprovalWorkflow(document)) {
		return false;
	}
	if (approval?.status === 'pending' || approval?.status === 'approved') {
		return false;
	}
	if (approval?.status === 'rejected') {
		return true;
	}
	return documentAllowsApprovalSubmission(documentType, documentStatus);
};

export const showDirectSendAction = (
	workflowEnabled: boolean,
	documentType: SalesApprovalDocumentType,
	documentStatus: string,
	approval?: DocumentApproval | null,
	blockedStatus = false,
	document?: ApprovalDocumentContext | null
): boolean => {
	if (blockedStatus) {
		return false;
	}
	if (!workflowEnabled) {
		return true;
	}
	if (canBypassApprovalWorkflow(document)) {
		return documentStatus !== 'declined';
	}
	if (canSubmitForApproval(workflowEnabled, documentType, documentStatus, approval, document)) {
		return false;
	}
	return approval?.status === 'approved' && documentStatus !== 'declined';
};

/** Whether open credit can be applied to invoices (requires approval for sales reps). */
export const canApplyCreditNote = (
	workflowEnabled: boolean,
	approval?: DocumentApproval | null,
	hasRemaining = true,
	document?: ApprovalDocumentContext | null
): boolean => {
	if (!hasRemaining) {
		return false;
	}
	if (!workflowEnabled) {
		return true;
	}
	if (canBypassApprovalWorkflow(document)) {
		return true;
	}
	return approval?.status === 'approved';
};

/** @deprecated Use {@link showDirectSendAction} — kept for any external imports. */
export const shouldUseApprovalSendGate = (
	workflowEnabled: boolean,
	approval?: DocumentApproval | null,
	document?: ApprovalDocumentContext | null
): boolean => {
	if (!workflowEnabled || canBypassApprovalWorkflow(document)) {
		return false;
	}
	return approval?.status === 'approved';
};

/**
 * Human-readable REST errors for sales document actions.
 */
export const formatSalesRestError = (
	err: unknown,
	fallback: string,
	overrides: Record<string, string> = {}
): string => {
	const e = err as RestishError;
	const code = typeof e?.code === 'string' ? e.code : '';

	if (overrides[code]) {
		return overrides[code];
	}

	if (code === 'approval_required') {
		return overrides.approval_required ?? fallback;
	}

	if (code === 'approval_pending') {
		return overrides.approval_pending ?? fallback;
	}

	if (code === 'not_withdrawable') {
		return overrides.not_withdrawable ?? fallback;
	}

	const message = typeof e?.message === 'string' ? e.message.trim() : '';
	return message || fallback;
};
