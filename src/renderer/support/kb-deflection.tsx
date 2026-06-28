/**
 * Knowledge Base ticket deflection.
 *
 * As a customer types a ticket subject we live-search the public KB and offer
 * "before you submit, did one of these help?" suggestions. The goal is
 * deflection: let self-serve answers resolve the issue without a ticket.
 *
 * This is an *open* read (the `knowledgebase/public/articles` endpoint is
 * `__return_true` and visibility-filtered server-side), so it uses raw `fetch`
 * like the rest of the guest/public surface — not the nonce'd apiFetch path.
 *
 * Defensive by design: if the KB module is disabled, the endpoint 404s, or the
 * site has no published articles, every failure resolves to "no suggestions"
 * and the ticket form behaves exactly as before. KB must never block a ticket.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BookOpen, ExternalLink } from 'lucide-react';

import { getSupportPortalConfig } from './config';

/** Minimal shape we consume from the public article summary. */
export interface KbDeflectionArticle {
	id: number;
	title: string;
	excerpt: string;
	url: string;
	reading_time: number;
}

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 3;
const MAX_SUGGESTIONS = 4;

/** Resolve the KB public endpoint from the localized REST root (subdir-safe). */
const kbSearchUrl = (query: string): string => {
	const config = getSupportPortalConfig();
	const root = config?.rest_root || '/wp-json/';
	const base = root.endsWith('/') ? root : `${root}/`;
	const params = new URLSearchParams({
		search: query,
		limit: String(MAX_SUGGESTIONS),
	});
	return `${base}doublescale/v1/knowledgebase/public/articles?${params.toString()}`;
};

/**
 * Debounced live search of the public KB. Returns suggestions for the current
 * query; any error (KB off, endpoint missing, network) yields an empty list so
 * the host form is never disrupted.
 */
export const useKbDeflection = (query: string): KbDeflectionArticle[] => {
	const [results, setResults] = useState<KbDeflectionArticle[]>([]);
	// Guards against out-of-order responses: only the latest request may commit.
	const requestId = useRef(0);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < MIN_QUERY_LENGTH) {
			setResults([]);
			return;
		}

		const id = ++requestId.current;
		const timer = setTimeout(() => {
			fetch(kbSearchUrl(trimmed), {
				headers: { Accept: 'application/json' },
			})
				.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
				.then((body: { data?: KbDeflectionArticle[] }) => {
					if (id === requestId.current) {
						setResults(Array.isArray(body.data) ? body.data : []);
					}
				})
				.catch(() => {
					if (id === requestId.current) {
						setResults([]);
					}
				});
		}, SEARCH_DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [query]);

	return results;
};

interface SuggestionsProps {
	articles: KbDeflectionArticle[];
}

/**
 * Presentational deflection block. Renders nothing when there are no matches,
 * so callers can mount it unconditionally above the submit button.
 */
export const KbDeflectionSuggestions = ({ articles }: SuggestionsProps) => {
	if (articles.length === 0) {
		return null;
	}

	return (
		<div className="rounded-md border border-primary/20 bg-primary/5 p-3">
			<p className="m-0 mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
				<BookOpen width={15} height={15} className="text-primary" />
				{__('These articles might answer your question', 'doublescale')}
			</p>
			<ul className="m-0 space-y-1.5 p-0">
				{articles.map((article) => (
					<li key={article.id} className="list-none">
						<a
							href={article.url}
							target="_blank"
							rel="noreferrer"
							className="group flex items-start justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-background"
						>
							<span className="min-w-0">
								<span className="block truncate font-medium text-primary group-hover:underline">
									{article.title}
								</span>
								{article.excerpt && (
									<span className="mt-0.5 block truncate text-xs text-muted-foreground">
										{article.excerpt}
									</span>
								)}
							</span>
							<ExternalLink
								width={13}
								height={13}
								className="mt-1 shrink-0 text-muted-foreground"
							/>
						</a>
					</li>
				))}
			</ul>
		</div>
	);
};
