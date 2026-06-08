/**
 * Support module API hooks.
 *
 * Mirrors the shape of `src/hooks/booking/api/` — a small `useApi` callback
 * wrapper around `@wordpress/api-fetch`, plus domain-specific hooks for the
 * support REST endpoints.
 *
 * `apiFetch` automatically attaches the `_wpnonce` REST cookie, so the hooks
 * authenticate as whoever the WP admin is logged in as. No manual nonce
 * plumbing needed.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

import { NAMESPACE } from '@/constants/support';
import type {
	AgentSummary,
	AttachmentLimits,
	AttachmentUploadResult,
	ConversationItem,
	CreateTicketPayload,
	Mailbox,
	PaginatedResponse,
	ReportBreakdown,
	ReportFilters,
	ReportSummary,
	Ticket,
	TicketFilters,
	TicketsOverTimeReport,
	UpdateTicketPayload,
	AgentReportRow,
	MailboxReportRow,
} from '@/types/support';

interface ApiOptions<TData> {
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	data?: TData;
	onSuccess?: (response: unknown) => void;
	onError?: (error: string) => void;
}

export const formatRestError = (err: unknown): string => {
	if (err instanceof Error && err.message.trim()) {
		return err.message.trim();
	}
	const e = err as {
		message?: string;
		data?: { message?: string };
	};
	if (typeof e?.message === 'string' && e.message.trim()) {
		return e.message.trim();
	}
	if (typeof e?.data?.message === 'string' && e.data.message.trim()) {
		return e.data.message.trim();
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

/**
 * Low-level `useApi` for one-off calls. Most callers should reach for the
 * domain-specific hooks below.
 */
export const useApi = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const callApi = useCallback(
		async <TData = unknown>({
			path,
			method = 'GET',
			data,
			onSuccess,
			onError,
		}: ApiOptions<TData>) => {
			setLoading(true);
			setError(null);
			try {
				const response = await apiFetch({
					path: path.startsWith('/') ? path : `${NAMESPACE}/${path}`,
					method,
					data: data as Record<string, unknown> | undefined,
				});
				onSuccess?.(response);
				return response;
			} catch (err: unknown) {
				const message = formatRestError(err);
				setError(message);
				onError?.(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	return { callApi, loading, error };
};

/**
 * Fetch the paginated ticket list with filters. Re-fetches whenever any
 * dependency in `filters` changes (compared by JSON identity).
 */
export const useTickets = (filters: TicketFilters = {}) => {
	const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filterKey = JSON.stringify(filters);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		const url = addQueryArgs(
			`${NAMESPACE}/tickets`,
			filters as Record<string, unknown>
		);
		apiFetch<PaginatedResponse<Ticket>>({ path: url })
			.then((response) => {
				setData(response);
			})
			.catch((err) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
		// filterKey is the serialized form of filters; including the object directly
		// would cause infinite re-renders since callers usually pass a new instance.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterKey]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

/**
 * Fetch one ticket by id (with `contact`, `agent`, `mailbox` relations loaded).
 */
export const useTicket = (ticketId: number | null) => {
	const [data, setData] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!ticketId) {
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		apiFetch<Ticket>({ path: `${NAMESPACE}/tickets/${ticketId}` })
			.then((response) => {
				setData(response);
			})
			.catch((err) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
	}, [ticketId]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

/**
 * Fetch the conversation thread for a ticket. `kinds` filters by activity kind
 * (defaults to all three — reply, note, event).
 */
export const useConversation = (
	ticketId: number | null,
	kinds?: Array<'reply' | 'note' | 'event'>
) => {
	const [data, setData] =
		useState<PaginatedResponse<ConversationItem> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const kindsKey = kinds ? kinds.join(',') : '';

	const refetch = useCallback(() => {
		if (!ticketId) {
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		const url = addQueryArgs(
			`${NAMESPACE}/tickets/${ticketId}/conversation`,
			{
				per_page: 100,
				kinds: kindsKey || undefined,
			}
		);
		apiFetch<PaginatedResponse<ConversationItem>>({ path: url })
			.then((response) => {
				setData(response);
			})
			.catch((err) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
	}, [ticketId, kindsKey]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

/**
 * Fetch all mailboxes (paginated, but for the inbox dropdown we read page 1
 * which covers up to 100 — far more than any real install would have).
 */
export const useMailboxes = () => {
	const [data, setData] = useState<Mailbox[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		apiFetch<PaginatedResponse<Mailbox>>({
			path: `${NAMESPACE}/mailboxes?per_page=100`,
		})
			.then((response) => {
				setData(response.data);
			})
			.catch((err) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { data, loading, error };
};

/**
 * A CRM user who can be assigned a ticket. Shape matches the flat array returned
 * by `/doublescale/v1/user-management/users` (the same source the Team page uses)
 * — NOT the support NAMESPACE, and NOT paginated.
 */
export interface AssignableAgent {
	id: number;
	name: string;
	email: string;
	role?: string;
	crm_role?: string;
}

/**
 * Fetch the CRM users that can be assigned as a ticket's agent. Read once and
 * cached in component state; the list is small (managers + reps).
 */
export const useAgents = () => {
	const [data, setData] = useState<AssignableAgent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		apiFetch<AssignableAgent[]>({
			path: '/doublescale/v1/user-management/users?per_page=100',
		})
			.then((response) => {
				setData(Array.isArray(response) ? response : []);
			})
			.catch((err) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { data, loading, error };
};

/**
 * Fetch the agents the current user may assign tickets to.
 *
 * The endpoint already scopes the list server-side: managers receive every
 * support-capable user, while Support Agents / Sales Reps receive only
 * themselves. The UI can therefore render whatever comes back without
 * re-deriving permissions.
 */
export const useAssignableAgents = () => {
	const [data, setData] = useState<AgentSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		apiFetch<AgentSummary[]>({ path: `${NAMESPACE}/tickets/agents` })
			.then((response) => {
				setData(response);
			})
			.catch((err) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { data, loading, error };
};

/**
 * Imperative mutations — return promises so the caller can chain.
 */
export const createTicket = (payload: CreateTicketPayload) =>
	apiFetch<Ticket>({
		path: `${NAMESPACE}/tickets`,
		method: 'POST',
		data: payload as unknown as Record<string, unknown>,
	});

export const updateTicket = (id: number, payload: UpdateTicketPayload) =>
	apiFetch<Ticket>({
		path: `${NAMESPACE}/tickets/${id}`,
		method: 'PUT',
		data: payload as unknown as Record<string, unknown>,
	});

export const deleteTicket = (id: number) =>
	apiFetch({
		path: `${NAMESPACE}/tickets/${id}`,
		method: 'DELETE',
	});

export interface ReplyPayload {
	content: string;
	attachment_hashes?: string[];
	/**
	 * CC recipients for this reply (agent-only). Forwarded as-is; the server
	 * validates/dedupes via TicketService::sanitize_cc_list. Notes ignore it.
	 */
	cc?: string[];
}

/**
 * Resolve the WordPress REST API root for raw `fetch()` uploads. File uploads
 * send `multipart/form-data`, which `apiFetch` can't carry, so we build the
 * absolute URL ourselves. Reading `wpApiSettings.root` (set by WP core in the
 * admin) is what makes this work on sub-directory installs — a hardcoded
 * `/wp-json/` would resolve against the document root, not the WP install path,
 * and return the site's 404 HTML (the `Unexpected token '<'` JSON error).
 */
const restRoot = (): string => {
	const settings = (window as { wpApiSettings?: { root?: string } })
		.wpApiSettings;
	const root = settings?.root || '/wp-json/';
	return root.endsWith('/') ? root : `${root}/`;
};

const postAttachment = async (
	route: string,
	file: File,
	pendingCount = 0
): Promise<AttachmentUploadResult> => {
	const formData = new FormData();
	formData.append('file', file);
	// Server-side count guard: how many files are already staged on this draft.
	formData.append('pending_count', String(pendingCount));

	const response = await fetch(`${restRoot()}${route}`, {
		method: 'POST',
		body: formData,
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': (window as { wpApiSettings?: { nonce?: string } })
				.wpApiSettings?.nonce as string,
		},
	});

	if (!response.ok) {
		const err = (await response.json()) as { message?: string };
		throw new Error(err.message || 'Upload failed');
	}

	return response.json() as Promise<AttachmentUploadResult>;
};

export const uploadAttachment = (
	ticketId: number,
	file: File,
	pendingCount = 0
): Promise<AttachmentUploadResult> =>
	postAttachment(
		`doublescale/v1/support/tickets/${ticketId}/attachments`,
		file,
		pendingCount
	);

/**
 * Upload a file BEFORE a ticket exists (new-ticket composer). Returns a hash
 * the caller passes as `attachment_hashes` to `createTicket`, which links it.
 */
export const uploadAttachmentTemp = (
	file: File,
	pendingCount = 0
): Promise<AttachmentUploadResult> =>
	postAttachment('doublescale/v1/support/attachments', file, pendingCount);

/**
 * Fetch the admin-configurable attachment limits (size + count). Sourced from
 * the mailbox-list `meta.attachment_limits` so no dedicated read endpoint is
 * needed. `refresh` lets the settings UI re-pull after a save.
 */
export const useAttachmentLimits = (): {
	limits: AttachmentLimits | null;
	loading: boolean;
	refresh: () => void;
} => {
	const [limits, setLimits] = useState<AttachmentLimits | null>(null);
	const [loading, setLoading] = useState(true);
	const [tick, setTick] = useState(0);

	useEffect(() => {
		let active = true;
		setLoading(true);
		apiFetch<{ meta?: { attachment_limits?: AttachmentLimits } }>({
			path: `${NAMESPACE}/mailboxes?per_page=1`,
		})
			.then((res) => {
				if (active) {
					setLimits(res?.meta?.attachment_limits ?? null);
				}
			})
			.catch(() => {
				if (active) {
					setLimits(null);
				}
			})
			.finally(() => {
				if (active) {
					setLoading(false);
				}
			});
		return () => {
			active = false;
		};
	}, [tick]);

	return { limits, loading, refresh: () => setTick((t) => t + 1) };
};

/**
 * Persist the attachment limits. Returns the stored (clamped) limits so the UI
 * can reflect any server-side clamping immediately.
 */
export const saveAttachmentLimits = (input: {
	max_file_size_mb: number;
	max_file_count: number;
}): Promise<{ attachment_limits: AttachmentLimits }> =>
	apiFetch<{ attachment_limits: AttachmentLimits }>({
		path: `${NAMESPACE}/mailboxes/attachment-settings`,
		method: 'POST',
		data: input,
	});

export const addReply = (ticketId: number, payload: ReplyPayload | string) => {
	const data =
		typeof payload === 'string' ? { content: payload } : payload;
	return apiFetch<ConversationItem>({
		path: `${NAMESPACE}/tickets/${ticketId}/replies`,
		method: 'POST',
		data,
	});
};

export const addNote = (ticketId: number, payload: ReplyPayload | string) => {
	const data =
		typeof payload === 'string' ? { content: payload } : payload;
	return apiFetch<ConversationItem>({
		path: `${NAMESPACE}/tickets/${ticketId}/notes`,
		method: 'POST',
		data,
	});
};

const useReportEndpoint = <T>(
	pathSuffix: string,
	filters: ReportFilters,
	extra?: Record<string, unknown>
) => {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filterKey = JSON.stringify({ filters, extra });

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		const queryPath = addQueryArgs(`${NAMESPACE}/reports/${pathSuffix}`, {
			...filters,
			...extra,
		} as Record<string, unknown>);
		apiFetch<T>({ path: queryPath })
			.then((response) => {
				setData(response);
			})
			.catch((err) => {
				setError(formatRestError(err));
			})
			.finally(() => {
				setLoading(false);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterKey]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const useReportSummary = (filters: ReportFilters) =>
	useReportEndpoint<ReportSummary>('summary', filters);

export const useTicketsOverTime = (filters: ReportFilters) =>
	useReportEndpoint<TicketsOverTimeReport>('tickets-over-time', filters, { bucket: 'auto' });

export const useReportBreakdown = (filters: ReportFilters) =>
	useReportEndpoint<ReportBreakdown>('breakdown', filters);

export const useAgentReport = (filters: ReportFilters) =>
	useReportEndpoint<{ data: AgentReportRow[] }>('agents', filters);

export const useMailboxReport = (filters: ReportFilters) =>
	useReportEndpoint<{ data: MailboxReportRow[] }>('mailboxes', filters);
