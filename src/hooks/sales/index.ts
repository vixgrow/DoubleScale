/**
 * Sales module API hooks.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

import { NAMESPACE } from '@/constants/sales';
import { downloadAdminPdf } from '@/utils/download-admin-pdf';
import type {
	ContactInvoicePayment,
	PaymentFilters,
	PaymentDetail,
	PaymentListItem,
	ConvertProposalResponse,
	CreateInvoicePayload,
	CreateContractPayload,
	CreateProposalPayload,
	Invoice,
	InvoiceFilters,
	InvoiceOnlineInitResponse,
	InvoicePayment,
	InvoiceSummary,
	OnlinePaymentGatewayStatus,
	PaginatedResponse,
	Proposal,
	ProposalComment,
	ProposalFilters,
	ProposalSignature,
	Contract,
	ContractAttachment,
	ContractAttachmentLimits,
	ContractFilters,
	ContractSignature,
	ContractSummary,
	ContractType,
	RecordPaymentPayload,
	SalesAssignableUser,
	SalesSettings,
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

export const useContracts = (filters: ContractFilters = {}) => {
	const [data, setData] = useState<PaginatedResponse<Contract> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filterKey = JSON.stringify(filters);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		const url = addQueryArgs(`${NAMESPACE}/contracts`, filters as Record<string, unknown>);
		return apiFetch<PaginatedResponse<Contract>>({ path: url })
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

export const useContract = (id: number | null) => {
	const [data, setData] = useState<Contract | null>(null);
	const [loading, setLoading] = useState(Boolean(id));
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!id) {
			return Promise.resolve(null);
		}
		setLoading(true);
		setError(null);
		return apiFetch<Contract>({ path: `${NAMESPACE}/contracts/${id}` })
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

export const useContractSummary = () => {
	const [data, setData] = useState<ContractSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		return apiFetch<ContractSummary>({ path: `${NAMESPACE}/contracts/summary` })
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

export const createContract = (payload: CreateContractPayload) =>
	apiFetch<Contract>({
		path: `${NAMESPACE}/contracts`,
		method: 'POST',
		data: payload,
	});

export const updateContract = (id: number, payload: Partial<CreateContractPayload>) =>
	apiFetch<Contract>({
		path: `${NAMESPACE}/contracts/${id}`,
		method: 'PUT',
		data: payload,
	});

export const deleteContract = (id: number) =>
	apiFetch<{ deleted: boolean }>({
		path: `${NAMESPACE}/contracts/${id}`,
		method: 'DELETE',
	});

export const sendContract = (contractId: number, message = '') =>
	apiFetch<{ sent: boolean; contract: Contract }>({
		path: `${NAMESPACE}/contracts/${contractId}/send`,
		method: 'POST',
		data: { message },
	});

export const fetchContractSignature = (contractId: number) =>
	apiFetch<ContractSignature>({
		path: `${NAMESPACE}/contracts/${contractId}/signature`,
	});

export const downloadContractPdf = (contractId: number, filename: string) =>
	downloadAdminPdf(`${NAMESPACE}/contracts/${contractId}/pdf`, filename);

export const useContractTypes = () => {
	const [data, setData] = useState<ContractType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		return apiFetch<ContractType[]>({ path: `${NAMESPACE}/contract-types` })
			.then((response) => {
				const items = Array.isArray(response) ? response : [];
				setData(items);
				return items;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const createContractType = (payload: Pick<ContractType, 'name'>) =>
	apiFetch<ContractType>({
		path: `${NAMESPACE}/contract-types`,
		method: 'POST',
		data: payload,
	});

export const updateContractType = (typeId: number, payload: Partial<Pick<ContractType, 'name'>>) =>
	apiFetch<ContractType>({
		path: `${NAMESPACE}/contract-types/${typeId}`,
		method: 'PUT',
		data: payload,
	});

export const deleteContractType = (typeId: number) =>
	apiFetch<{ deleted: boolean }>({
		path: `${NAMESPACE}/contract-types/${typeId}`,
		method: 'DELETE',
	});

const restRoot = (): string => {
	const root =
		(window as { wpApiSettings?: { root?: string } }).wpApiSettings?.root ||
		'/wp-json/';
	return root.endsWith('/') ? root : `${root}/`;
};

export const useContractAttachments = (contractId: number | null, enabled = true) => {
	const [data, setData] = useState<ContractAttachment[]>([]);
	const [limits, setLimits] = useState<ContractAttachmentLimits | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!contractId || !enabled) {
			setData([]);
			setLimits(null);
			return Promise.resolve([]);
		}
		setLoading(true);
		setError(null);
		return apiFetch<{ data: ContractAttachment[]; limits?: ContractAttachmentLimits }>({
			path: `${NAMESPACE}/contracts/${contractId}/attachments`,
		})
			.then((response) => {
				const items = Array.isArray(response?.data) ? response.data : [];
				setData(items);
				setLimits(response?.limits ?? null);
				return items;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => {
				setLoading(false);
			});
	}, [contractId, enabled]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, limits, loading, error, refetch };
};

export const uploadContractAttachment = (contractId: number, file: File) => {
	const formData = new FormData();
	formData.append('file', file);

	// Multipart uploads bypass apiFetch; build an absolute URL without a leading
	// slash after restRoot() — `/wp-json//doublescale/...` 404s in REST routing.
	const route = `${NAMESPACE.replace(/^\//, '')}/contracts/${contractId}/attachments`;

	return fetch(`${restRoot()}${route}`, {
		method: 'POST',
		body: formData,
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': (window as { wpApiSettings?: { nonce?: string } }).wpApiSettings
				?.nonce as string,
		},
	}).then(async (response) => {
		if (!response.ok) {
			const err = (await response.json()) as { message?: string };
			throw new Error(err.message || __('Upload failed.', 'doublescale'));
		}
		return response.json() as Promise<ContractAttachment>;
	});
};

export const deleteContractAttachment = (contractId: number, fileHash: string) =>
	apiFetch<{ deleted: boolean }>({
		path: `${NAMESPACE}/contracts/${contractId}/attachments/${fileHash}`,
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

export const usePayments = (filters: PaymentFilters = {}) => {
	const [data, setData] = useState<PaginatedResponse<PaymentListItem> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filterKey = JSON.stringify(filters);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		const url = addQueryArgs(`${NAMESPACE}/payments`, filters as Record<string, unknown>);
		return apiFetch<PaginatedResponse<PaymentListItem>>({ path: url })
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

export const usePayment = (paymentId: number | null) => {
	const [data, setData] = useState<PaymentDetail | null>(null);
	const [loading, setLoading] = useState(Boolean(paymentId));
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!paymentId) {
			return Promise.resolve(null);
		}
		setLoading(true);
		setError(null);
		return apiFetch<{ payment: PaymentDetail }>({
			path: `${NAMESPACE}/payments/${paymentId}`,
		})
			.then((response) => {
				const payment = response?.payment ?? null;
				setData(payment);
				return payment;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => setLoading(false));
	}, [paymentId]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const deletePayment = (paymentId: number) =>
	apiFetch<{ deleted: boolean; invoice_id: number }>({
		path: `${NAMESPACE}/payments/${paymentId}`,
		method: 'DELETE',
	});

export const updatePayment = (paymentId: number, payload: RecordPaymentPayload) =>
	apiFetch<{ payment: PaymentDetail }>({
		path: `${NAMESPACE}/payments/${paymentId}`,
		method: 'PUT',
		data: payload,
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

export interface InvoiceStripeInitResponse extends InvoiceOnlineInitResponse {}

export interface SalesStripeStatus {
	available: boolean;
	configured: boolean;
}

export const useSalesOnlinePaymentGateways = () => {
	const [data, setData] = useState<OnlinePaymentGatewayStatus[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		apiFetch<{ gateways: OnlinePaymentGatewayStatus[] }>({ path: `${NAMESPACE}/payment-gateways` })
			.then((response) => setData(Array.isArray(response?.gateways) ? response.gateways : []))
			.catch(() => setData([]))
			.finally(() => setLoading(false));
	}, []);

	return { data, loading };
};

/** @deprecated Use useSalesOnlinePaymentGateways */
export const useSalesStripeStatus = () => {
	const { data: gateways, loading } = useSalesOnlinePaymentGateways();
	const stripe = gateways.find((g) => g.slug === 'stripe');
	return {
		data: stripe
			? { available: stripe.available, configured: stripe.configured }
			: ({ available: false, configured: false } as SalesStripeStatus),
		loading,
	};
};

export const initInvoiceOnlinePayment = (invoiceId: number, gateway: string) =>
	apiFetch<InvoiceOnlineInitResponse>({
		path: `${NAMESPACE}/invoices/${invoiceId}/pay/${gateway}/init`,
		method: 'POST',
	});

export const confirmInvoiceOnlinePayment = (invoiceId: number, gateway: string) =>
	apiFetch<{ pi_status: string; invoice: Invoice; gateway?: string }>({
		path: `${NAMESPACE}/invoices/${invoiceId}/pay/${gateway}/confirm`,
		method: 'POST',
	});

export const initInvoiceStripePayment = (invoiceId: number) =>
	initInvoiceOnlinePayment(invoiceId, 'stripe');

export const confirmInvoiceStripePayment = (invoiceId: number) =>
	confirmInvoiceOnlinePayment(invoiceId, 'stripe');

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

export const duplicateProposal = (proposalId: number) =>
	apiFetch<Proposal>({
		path: `${NAMESPACE}/proposals/${proposalId}/duplicate`,
		method: 'POST',
	});

export const downloadProposalPdf = (proposalId: number, filename: string) =>
	downloadAdminPdf(`${NAMESPACE}/proposals/${proposalId}/pdf`, filename);

export const downloadInvoicePdf = (invoiceId: number, filename: string) =>
	downloadAdminPdf(`${NAMESPACE}/invoices/${invoiceId}/pdf`, filename);

export const useSalesSettings = () => {
	const [data, setData] = useState<SalesSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		return apiFetch<SalesSettings>({ path: `${NAMESPACE}/settings` })
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

export const updateSalesSettings = (payload: Partial<SalesSettings>) =>
	apiFetch<SalesSettings>({
		path: `${NAMESPACE}/settings`,
		method: 'PUT',
		data: payload,
	});

export const useSalesTaxes = () => {
	const [data, setData] = useState<SalesTax[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		return apiFetch<SalesTax[]>({ path: `${NAMESPACE}/taxes` })
			.then((response) => {
				const items = Array.isArray(response) ? response : [];
				setData(items);
				return items;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const createSalesTax = (payload: Pick<SalesTax, 'name' | 'rate'>) =>
	apiFetch<SalesTax>({
		path: `${NAMESPACE}/taxes`,
		method: 'POST',
		data: payload,
	});

export const updateSalesTax = (taxId: number, payload: Partial<Pick<SalesTax, 'name' | 'rate'>>) =>
	apiFetch<SalesTax>({
		path: `${NAMESPACE}/taxes/${taxId}`,
		method: 'PUT',
		data: payload,
	});

export const deleteSalesTax = (taxId: number) =>
	apiFetch<{ deleted: boolean }>({
		path: `${NAMESPACE}/taxes/${taxId}`,
		method: 'DELETE',
	});

export const useProposalComments = (proposalId: number | null, enabled = true) => {
	const [data, setData] = useState<ProposalComment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!proposalId || !enabled) {
			setData([]);
			return Promise.resolve([]);
		}
		setLoading(true);
		setError(null);
		return apiFetch<{ data: ProposalComment[] }>({
			path: `${NAMESPACE}/proposals/${proposalId}/comments`,
		})
			.then((response) => {
				const items = Array.isArray(response?.data) ? response.data : [];
				setData(items);
				return items;
			})
			.catch((err: unknown) => {
				const message = formatRestError(err);
				setError(message);
				throw err;
			})
			.finally(() => {
				setLoading(false);
			});
	}, [proposalId, enabled]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const addProposalComment = (proposalId: number, content: string) =>
	apiFetch<ProposalComment>({
		path: `${NAMESPACE}/proposals/${proposalId}/comments`,
		method: 'POST',
		data: { content },
	});

export const fetchProposalSignature = (proposalId: number) =>
	apiFetch<ProposalSignature>({
		path: `${NAMESPACE}/proposals/${proposalId}/signature`,
	});
