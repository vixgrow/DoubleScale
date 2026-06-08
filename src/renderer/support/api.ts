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

const postPortalAttachment = async (
	path: string,
	file: File
): Promise<AttachmentUploadResult> => {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(path, {
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
	file: File
): Promise<AttachmentUploadResult> =>
	postPortalAttachment(
		`/wp-json/doublescale/v1/support/portal/tickets/${ticketId}/attachments`,
		file
	);

/**
 * Upload a file BEFORE the customer's ticket exists (first-ticket composer).
 * Returns a hash passed as `attachment_hashes` to `createPortalTicket`.
 */
export const uploadPortalAttachmentTemp = (
	file: File
): Promise<AttachmentUploadResult> =>
	postPortalAttachment(
		'/wp-json/doublescale/v1/support/portal/attachments',
		file
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
