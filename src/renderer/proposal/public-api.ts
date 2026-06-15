/**
 * Public proposal API (hash-authenticated, no login).
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import type { PublicProposal, PublicProposalComment } from './types';

const formatError = (err: unknown): string => {
	if (err instanceof Error && err.message) {
		return err.message;
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

const getPublicBase = (): string => {
	const config = window.doublescale_proposal_config;
	return config?.public_rest_url || '/wp-json/doublescale/v1/sales/public/proposals';
};

const parseError = async (res: Response): Promise<never> => {
	const body = (await res.json().catch(() => ({}))) as { message?: string };
	throw new Error(body.message || __('Request failed.', 'doublescale'));
};

export const usePublicProposal = (hash: string | null) => {
	const [data, setData] = useState<PublicProposal | null>(null);
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
		fetch(`${getPublicBase()}/${hash}`)
			.then(async (res) => {
				if (!res.ok) {
					return parseError(res);
				}
				return res.json() as Promise<PublicProposal>;
			})
			.then((proposal) => setData(proposal))
			.catch((err) => setError(formatError(err)))
			.finally(() => setLoading(false));
	}, [hash]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export interface AcceptProposalPayload {
	signed_name?: string;
	signature?: string;
}

export const acceptPublicProposal = (hash: string, payload: AcceptProposalPayload = {}) =>
	fetch(`${getPublicBase()}/${hash}/accept`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	}).then(async (res) => {
		if (!res.ok) {
			return parseError(res);
		}
		return res.json() as Promise<PublicProposal>;
	});

export const declinePublicProposal = (hash: string, reason = '') =>
	fetch(`${getPublicBase()}/${hash}/decline`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ reason }),
	}).then(async (res) => {
		if (!res.ok) {
			return parseError(res);
		}
		return res.json() as Promise<PublicProposal>;
	});

export const getPublicProposalPdfUrl = (hash: string) => `${getPublicBase()}/${hash}/pdf`;

export const usePublicProposalComments = (hash: string | null, enabled: boolean) => {
	const [data, setData] = useState<PublicProposalComment[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!hash || !enabled) {
			setData([]);
			return Promise.resolve([]);
		}
		setLoading(true);
		setError(null);
		return fetch(`${getPublicBase()}/${hash}/comments`)
			.then(async (res) => {
				if (!res.ok) {
					return parseError(res);
				}
				const body = (await res.json()) as { data?: PublicProposalComment[] };
				const comments = Array.isArray(body.data) ? body.data : [];
				setData(comments);
				return comments;
			})
			.catch((err) => {
				setError(formatError(err));
				throw err;
			})
			.finally(() => setLoading(false));
	}, [hash, enabled]);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const postPublicProposalComment = (
	hash: string,
	payload: { author_name?: string; content: string }
) =>
	fetch(`${getPublicBase()}/${hash}/comments`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	}).then(async (res) => {
		if (!res.ok) {
			return parseError(res);
		}
		return res.json() as Promise<PublicProposalComment>;
	});
