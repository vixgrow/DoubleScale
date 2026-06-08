/**
 * Customer portal API hooks.
 *
 * Mirrors `src/hooks/support/` but targets the `/support/portal/*` namespace
 * and explicitly registers the apiFetch middleware. WP admin auto-bootstraps
 * apiFetch with the REST root + nonce; storefront pages do not, so we wire
 * those from `window.doublescale_support_portal_config` (set by
 * `PortalFrontendHandler::maybe_enqueue()`).
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

import type {
	AttachmentUploadResult,
	PaginatedResponse,
	TicketFilters,
} from '@/types/support';
import type { PortalConfig, PortalConversationItem, PortalTicket } from './types';

const config = window.doublescale_support_portal_config as PortalConfig | undefined;

if (config) {
	apiFetch.use(apiFetch.createRootURLMiddleware(config.rest_root));
	apiFetch.use(apiFetch.createNonceMiddleware(config.nonce));
}

const PORTAL = '/doublescale/v1/support/portal';

const formatRestError = (err: unknown): string => {
	const e = err as { message?: string };
	if (typeof e?.message === 'string' && e.message.trim()) {
		return e.message.trim();
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

export const usePortalTickets = (filters: TicketFilters = {}) => {
	const [data, setData] = useState<PaginatedResponse<PortalTicket> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const filterKey = JSON.stringify(filters);

	const refetch = useCallback(() => {
		setLoading(true);
		setError(null);
		const url = addQueryArgs(`${PORTAL}/tickets`, filters as Record<string, unknown>);
		apiFetch<PaginatedResponse<PortalTicket>>({ path: url })
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

export const usePortalTicket = (ticketId: number | null) => {
	const [data, setData] = useState<PortalTicket | null>(null);
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
		apiFetch<PortalTicket>({ path: `${PORTAL}/tickets/${ticketId}` })
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

export const usePortalConversation = (ticketId: number | null) => {
	const [data, setData] = useState<PaginatedResponse<PortalConversationItem> | null>(
		null
	);
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
		apiFetch<PaginatedResponse<PortalConversationItem>>({
			path: `${PORTAL}/tickets/${ticketId}/conversation?per_page=100`,
		})
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

export interface CreatePortalTicketPayload {
	title: string;
	content: string;
	mailbox_id?: number;
	priority?: string;
	custom_data?: Record<string, unknown>;
	attachment_hashes?: string[];
}

/**
 * Resolve the WordPress REST API root for raw `fetch()` uploads. File uploads
 * send `multipart/form-data`, which `apiFetch` can't carry, so we build the
 * absolute URL from the `rest_root` the portal handler localized (it comes from
 * `rest_url()`, so it already includes any sub-directory install path). A
 * hardcoded `/wp-json/` would resolve against the document root and return the
 * site's 404 HTML (the `Unexpected token '<'` JSON error).
 */
const restRoot = (): string => {
	const root = config?.rest_root || '/wp-json/';
	return root.endsWith('/') ? root : `${root}/`;
};

const postPortalAttachment = async (
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
			'X-WP-Nonce': config?.nonce || '',
		},
	});

	if (!response.ok) {
		const err = (await response.json()) as { message?: string };
		throw new Error(err.message || 'Upload failed');
	}

	return response.json() as Promise<AttachmentUploadResult>;
};

export const uploadPortalAttachment = (
	ticketId: number,
	file: File,
	pendingCount = 0
): Promise<AttachmentUploadResult> =>
	postPortalAttachment(
		`doublescale/v1/support/portal/tickets/${ticketId}/attachments`,
		file,
		pendingCount
	);

/**
 * Upload a file BEFORE the customer's ticket exists (first-ticket composer).
 * Returns a hash passed as `attachment_hashes` to `createPortalTicket`.
 */
export const uploadPortalAttachmentTemp = (
	file: File,
	pendingCount = 0
): Promise<AttachmentUploadResult> =>
	postPortalAttachment(
		'doublescale/v1/support/portal/attachments',
		file,
		pendingCount
	);

export const createPortalTicket = (payload: CreatePortalTicketPayload) =>
	apiFetch<PortalTicket>({
		path: `${PORTAL}/tickets`,
		method: 'POST',
		data: payload as unknown as Record<string, unknown>,
	});

export const addPortalReply = (
	ticketId: number,
	content: string,
	attachment_hashes?: string[]
) =>
	apiFetch<PortalConversationItem>({
		path: `${PORTAL}/tickets/${ticketId}/replies`,
		method: 'POST',
		data: { content, attachment_hashes },
	});

export interface PortalMailbox {
	id: number;
	slug: string;
	email: string;
	name: string;
	is_default: boolean;
}

export const usePortalMailboxes = () => {
	const [data, setData] = useState<PortalMailbox[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		apiFetch<{ data: PortalMailbox[] }>({ path: `${PORTAL}/mailboxes` })
			.then((response) => {
				setData(response.data || []);
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
