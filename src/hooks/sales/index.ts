/**
 * Sales module API hooks.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

import { NAMESPACE } from '@/constants/sales';
import type {
	ContactInvoicePayment,
	ConvertProposalResponse,
	CreateInvoicePayload,
	CreateProposalPayload,
	Invoice,
	InvoiceFilters,
	InvoicePayment,
	InvoiceSummary,
	PaginatedResponse,
	Proposal,
	ProposalFilters,
	RecordPaymentPayload,
	SalesAssignableUser,
	SalesTax,
} from '@/types/sales';

export const formatRestError = (err: unknown): string => {
	if (err instanceof Error && err.message.trim()) {
		return err.message.trim();
	}
	const e = err as { message?: string; data?: { message?: string } };
	if (typeof e?.message === 'string' && e.message.trim()) {
		return e.message.trim();
	}
	if (typeof e?.data?.message === 'string' && e.data.message.trim()) {
		return e.data.message.trim();
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

export const useProposals = (filters: ProposalFilters = {}) => {
	const [data, setData] = useState<PaginatedResponse<Proposal> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filterKey = JSON.stringify(filters);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		const url = addQueryArgs(`${NAMESPACE}/proposals`, filters as Record<string, unknown>);
		return apiFetch<PaginatedResponse<Proposal>>({ path: url })
			.then((response) => {
				setData(response);
				return response;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, [filterKey]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const useProposal = (id: number | null) => {
	const [data, setData] = useState<Proposal | null>(null);
	const [loading, setLoading] = useState(Boolean(id));
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!id) {
			return Promise.resolve(null);
		}
		setLoading(true);
		setError(null);
		return apiFetch<Proposal>({ path: `${NAMESPACE}/proposals/${id}` })
			.then((response) => {
				setData(response);
				return response;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, [id]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const createProposal = (payload: CreateProposalPayload) =>
	apiFetch<Proposal>({
		path: `${NAMESPACE}/proposals`,
		method: 'POST',
		data: payload,
	});

export const updateProposal = (id: number, payload: Partial<CreateProposalPayload>) =>
	apiFetch<Proposal>({
		path: `${NAMESPACE}/proposals/${id}`,
		method: 'PUT',
		data: payload,
	});

export const deleteProposal = (id: number) =>
	apiFetch<{ deleted: boolean }>({
		path: `${NAMESPACE}/proposals/${id}`,
		method: 'DELETE',
	});

export const useInvoices = (filters: InvoiceFilters = {}) => {
	const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filterKey = JSON.stringify(filters);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		const url = addQueryArgs(`${NAMESPACE}/invoices`, filters as Record<string, unknown>);
		return apiFetch<PaginatedResponse<Invoice>>({ path: url })
			.then((response) => {
				setData(response);
				return response;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, [filterKey]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const useInvoice = (id: number | null) => {
	const [data, setData] = useState<Invoice | null>(null);
	const [loading, setLoading] = useState(Boolean(id));
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!id) {
			return Promise.resolve(null);
		}
		setLoading(true);
		setError(null);
		return apiFetch<Invoice>({ path: `${NAMESPACE}/invoices/${id}` })
			.then((response) => {
				setData(response);
				return response;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, [id]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const useInvoiceSummary = () => {
	const [data, setData] = useState<InvoiceSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		return apiFetch<InvoiceSummary>({ path: `${NAMESPACE}/invoices/summary` })
			.then((response) => {
				setData(response);
				return response;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const createInvoice = (payload: CreateInvoicePayload) =>
	apiFetch<Invoice>({
		path: `${NAMESPACE}/invoices`,
		method: 'POST',
		data: payload,
	});

export const updateInvoice = (id: number, payload: Partial<CreateInvoicePayload>) =>
	apiFetch<Invoice>({
		path: `${NAMESPACE}/invoices/${id}`,
		method: 'PUT',
		data: payload,
	});

export const deleteInvoice = (id: number) =>
	apiFetch<{ deleted: boolean }>({
		path: `${NAMESPACE}/invoices/${id}`,
		method: 'DELETE',
	});

export const useAssignableSalesUsers = () => {
	const [data, setData] = useState<SalesAssignableUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		apiFetch<SalesAssignableUser[]>({ path: `${NAMESPACE}/assignable-users` })
			.then((response) => {
				setData(Array.isArray(response) ? response : []);
			})
			.catch((err: unknown) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { data, loading, error };
};

export const useInvoicePayments = (invoiceId: number | null) => {
	const [data, setData] = useState<InvoicePayment[]>([]);
	const [loading, setLoading] = useState(Boolean(invoiceId));
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!invoiceId) {
			return Promise.resolve([]);
		}
		setLoading(true);
		setError(null);
		return apiFetch<{ data: InvoicePayment[] }>({
			path: `${NAMESPACE}/invoices/${invoiceId}/payments`,
		})
			.then((response) => {
				const payments = Array.isArray(response?.data) ? response.data : [];
				setData(payments);
				return payments;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, [invoiceId]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const recordInvoicePayment = (invoiceId: number, payload: RecordPaymentPayload) =>
	apiFetch<{ payment: InvoicePayment; invoice: Invoice }>({
		path: `${NAMESPACE}/invoices/${invoiceId}/payments`,
		method: 'POST',
		data: payload,
	});

export const deleteInvoicePayment = (invoiceId: number, paymentId: number) =>
	apiFetch<{ deleted: boolean; invoice: Invoice }>({
		path: `${NAMESPACE}/invoices/${invoiceId}/payments/${paymentId}`,
		method: 'DELETE',
	});

export const useContactSalesPayments = (contactId: number | null, page = 1, perPage = 10) => {
	const [data, setData] = useState<PaginatedResponse<ContactInvoicePayment> | null>(null);
	const [loading, setLoading] = useState(Boolean(contactId));
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!contactId) {
			return Promise.resolve(null);
		}
		setLoading(true);
		setError(null);
		const url = addQueryArgs(`${NAMESPACE}/contacts/${contactId}/payments`, {
			page,
			per_page: perPage,
		});
		return apiFetch<PaginatedResponse<ContactInvoicePayment>>({ path: url })
			.then((response) => {
				setData(response);
				return response;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, [contactId, page, perPage]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export interface InvoiceStripeInitResponse {
	client_secret?: string;
	publishable_key: string;
	amount: number;
	currency: string;
	already_paid?: boolean;
	pi_status?: string;
	invoice?: Invoice;
}

export interface SalesStripeStatus {
	available: boolean;
	configured: boolean;
}

export const useSalesStripeStatus = () => {
	const [data, setData] = useState<SalesStripeStatus | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		apiFetch<SalesStripeStatus>({ path: `${NAMESPACE}/stripe/status` })
			.then((response) => setData(response))
			.catch(() => setData({ available: false, configured: false }))
			.finally(() => setLoading(false));
	}, []);

	return { data, loading };
};

export const initInvoiceStripePayment = (invoiceId: number) =>
	apiFetch<InvoiceStripeInitResponse>({
		path: `${NAMESPACE}/invoices/${invoiceId}/stripe/init`,
		method: 'POST',
	});

export const confirmInvoiceStripePayment = (invoiceId: number) =>
	apiFetch<{ pi_status: string; invoice: Invoice }>({
		path: `${NAMESPACE}/invoices/${invoiceId}/stripe/confirm`,
		method: 'POST',
	});

export const convertProposalToInvoice = (proposalId: number) =>
	apiFetch<ConvertProposalResponse>({
		path: `${NAMESPACE}/proposals/${proposalId}/convert-to-invoice`,
		method: 'POST',
	});

export interface SendProposalResponse {
	sent: boolean;
	proposal: Proposal;
}

export const sendProposal = (proposalId: number, message = '') =>
	apiFetch<SendProposalResponse>({
		path: `${NAMESPACE}/proposals/${proposalId}/send`,
		method: 'POST',
		data: message ? { message } : {},
	});

export interface SendInvoiceResponse {
	sent: boolean;
	invoice: Invoice;
}

export const sendInvoice = (invoiceId: number, message = '') =>
	apiFetch<SendInvoiceResponse>({
		path: `${NAMESPACE}/invoices/${invoiceId}/send`,
		method: 'POST',
		data: message ? { message } : {},
	});

export const useSalesTaxes = () => {
	const [data, setData] = useState<SalesTax[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		apiFetch<SalesTax[]>({ path: `${NAMESPACE}/taxes` })
			.then((response) => {
				setData(Array.isArray(response) ? response : []);
			})
			.catch((err: unknown) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { data, loading, error };
};
