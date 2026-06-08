/**
 * Guest/public support API (hash-authenticated, no login).
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import type { PaginatedResponse } from '@/types/support';
import type { PortalConversationItem, PublicTicket } from './types';

const formatError = (err: unknown): string => {
	if (err instanceof Error && err.message) {
		return err.message;
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

const getPublicBase = (): string => {
	const config = window.doublescale_support_portal_config;
	return config?.public_rest_url || '/wp-json/doublescale/v1/support/public';
};

export const usePublicTicket = (hash: string | null) => {
	const [data, setData] = useState<PublicTicket | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!hash) {
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		fetch(`${getPublicBase()}/tickets/${hash}`)
			.then(async (res) => {
				if (!res.ok) {
					const body = (await res.json()) as { message?: string };
					throw new Error(body.message || 'Not found');
				}
				return res.json() as Promise<PublicTicket>;
			})
			.then((ticket) => setData(ticket))
			.catch((err) => setError(formatError(err)))
			.finally(() => setLoading(false));
	}, [hash]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const usePublicConversation = (hash: string | null) => {
	const [data, setData] =
		useState<PaginatedResponse<PortalConversationItem> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!hash) {
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		fetch(`${getPublicBase()}/tickets/${hash}/conversation`)
			.then(async (res) => {
				if (!res.ok) {
					const body = (await res.json()) as { message?: string };
					throw new Error(body.message || 'Failed to load');
				}
				return res.json() as Promise<
					PaginatedResponse<PortalConversationItem>
				>;
			})
			.then((response) => setData(response))
			.catch((err) => setError(formatError(err)))
			.finally(() => setLoading(false));
	}, [hash]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const addPublicReply = (
	hash: string,
	content: string,
	attachment_hashes?: string[]
) =>
	fetch(`${getPublicBase()}/tickets/${hash}/replies`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			content,
			attachment_hashes,
		}),
	}).then(async (res) => {
		if (!res.ok) {
			const body = (await res.json()) as { message?: string };
			throw new Error(body.message || 'Reply failed');
		}
		return res.json() as Promise<PortalConversationItem>;
	});
