/**
 * Agent helper — search the Knowledge Base and insert a link to a published
 * article into the reply composer. The deflection counterpart to the customer's
 * pre-submit suggestions: here the agent answers with a canonical article.
 *
 * Reuses the admin `knowledgebase/articles` list endpoint (gated on `can_read`,
 * which support agents satisfy via `doublescale_view_support`). Only published
 * articles are offered — drafts/internal notes aren't shareable with customers.
 *
 * Self-contained dropdown (state + outside-click) rather than a Radix popover:
 * the composer around it is all plain markup, and a portalled popover nested in
 * the custom ticket modal risks focus-trap/stacking quirks. KB being disabled
 * simply yields "no articles" — it never blocks the composer.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BookOpen, Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { listArticles, type KbArticleSummary } from '../../../knowledgebase/api';

interface Props {
	onInsert: (article: KbArticleSummary) => void;
	/** When set, auto-suggest published articles matching the ticket subject. */
	subject?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SUBJECT_LENGTH = 3;
const MAX_SUGGESTIONS = 3;

const KbArticleInserter = ({ onInsert, subject }: Props) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<KbArticleSummary[]>([]);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<KbArticleSummary[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	// Guards against out-of-order responses: only the latest request may commit.
	const requestId = useRef(0);
	const suggestRequestId = useRef(0);

	// Auto-suggest published articles matched on the ticket subject (the plan's
	// "suggested articles on a ticket" — feeds the same insert action).
	useEffect(() => {
		const q = (subject || '').trim();
		if (q.length < MIN_SUBJECT_LENGTH) {
			setSuggestions([]);
			return;
		}
		const id = ++suggestRequestId.current;
		const timer = setTimeout(() => {
			listArticles({ search: q, status: 'publish' })
				.then((res) => {
					if (id === suggestRequestId.current) {
						setSuggestions((res.data || []).slice(0, MAX_SUGGESTIONS));
					}
				})
				.catch(() => {
					if (id === suggestRequestId.current) {
						setSuggestions([]);
					}
				});
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [subject]);

	// Close the dropdown on any click outside of it.
	useEffect(() => {
		if (!open) {
			return;
		}
		const onDocClick = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	}, [open]);

	// Debounced search while the dropdown is open. Empty query lists recent
	// published articles so the agent has something to pick without typing.
	useEffect(() => {
		if (!open) {
			return;
		}
		const id = ++requestId.current;
		setLoading(true);
		const timer = setTimeout(() => {
			listArticles({ search: query.trim(), status: 'publish' })
				.then((res) => {
					if (id === requestId.current) {
						setResults(res.data || []);
					}
				})
				.catch(() => {
					if (id === requestId.current) {
						setResults([]);
					}
				})
				.finally(() => {
					if (id === requestId.current) {
						setLoading(false);
					}
				});
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [query, open]);

	const handlePick = (article: KbArticleSummary) => {
		onInsert(article);
		setOpen(false);
		setQuery('');
	};

	return (
		<div ref={containerRef} className="space-y-2">
			<div className="relative inline-block">
				<Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
					<BookOpen width={14} height={14} className="mr-1" />
					{__('Insert article', 'doublescale')}
				</Button>

				{open && (
					<div className="absolute z-10 mt-1 w-80 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg">
						<div className="relative mb-2">
							<Search
								width={14}
								height={14}
								className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								autoFocus
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder={__('Search articles…', 'doublescale')}
								className="h-9 pl-7"
							/>
						</div>
						<div className="max-h-60 overflow-y-auto">
							{loading ? (
								<p className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
									<Loader2 width={14} height={14} className="animate-spin" />
									{__('Searching…', 'doublescale')}
								</p>
							) : results.length === 0 ? (
								<p className="px-2 py-3 text-sm text-muted-foreground">
									{__('No articles found.', 'doublescale')}
								</p>
							) : (
								<ul className="space-y-0.5">
									{results.map((a) => (
										<li key={a.id}>
											<button
												type="button"
												onClick={() => handlePick(a)}
												className="block w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
												title={a.title}
											>
												{a.title || __('(untitled)', 'doublescale')}
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				)}
			</div>

			{suggestions.length > 0 && (
				<div className="rounded-md border border-border bg-muted/40 p-2">
					<p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
						<BookOpen width={13} height={13} />
						{__('Suggested for this ticket', 'doublescale')}
					</p>
					<div className="flex flex-wrap gap-1.5">
						{suggestions.map((a) => (
							<button
								key={a.id}
								type="button"
								onClick={() => onInsert(a)}
								className="rounded border border-border bg-background px-2 py-1 text-xs hover:border-primary"
								title={a.title}
							>
								{a.title || __('(untitled)', 'doublescale')}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default KbArticleInserter;
