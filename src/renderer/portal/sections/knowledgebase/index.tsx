/**
 * Knowledge Base portal section — browse + search published articles and read
 * them inline. Backed by the public KB REST (`knowledgebase/public`), which the
 * Knowledge Base module injects as `knowledgebase_rest_url`. A logged-in portal
 * read is attributed to the contact server-side (Tier 3).
 */

import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

import { getPortalConfig } from '../../config';
import { useAsync } from '../../api';
import { EmptyState, ErrorState, Spinner } from '../../shared/ui';

interface KbArticleSummary {
	id: number;
	title: string;
	slug: string;
	excerpt: string;
	reading_time: number;
}

interface TocEntry {
	level: number;
	text: string;
	anchor: string;
}

interface KbArticleFull extends KbArticleSummary {
	content: string;
	content_html: string;
	show_toc?: boolean;
	toc?: TocEntry[];
	breadcrumbs: Array<{ label: string; url: string }>;
	related?: KbArticleSummary[];
	tags: string[];
	feedback_enabled?: boolean;
	helpful?: number;
	not_helpful?: number;
}

const KB_BASE = '/doublescale/v1/knowledgebase/public';

const fetchArticles = (search: string): Promise<{ data: KbArticleSummary[] }> =>
	apiFetch<{ data: KbArticleSummary[] }>({
		path: addQueryArgs(`${KB_BASE}/articles`, search ? { search } : {}),
	});

const fetchArticle = (slug: string): Promise<KbArticleFull> =>
	apiFetch<KbArticleFull>({ path: `${KB_BASE}/articles/${slug}` });

const submitFeedback = (slug: string, helpful: boolean): Promise<unknown> =>
	apiFetch({
		path: `${KB_BASE}/articles/${slug}/feedback`,
		method: 'POST',
		data: { helpful },
	});

/** "Was this helpful?" control shown under a portal article when enabled. */
const FeedbackControl = ({ slug }: { slug: string }) => {
	const [voted, setVoted] = useState(false);

	const vote = (helpful: boolean) => {
		setVoted(true);
		submitFeedback(slug, helpful).catch(() => undefined);
	};

	if (voted) {
		return (
			<p className="text-sm text-muted-foreground">
				{__('Thanks for your feedback!', 'doublescale')}
			</p>
		);
	}

	return (
		<div className="flex items-center gap-3 border-t border-border pt-4">
			<span className="text-sm text-foreground">
				{__('Was this article helpful?', 'doublescale')}
			</span>
			<button
				type="button"
				onClick={() => vote(true)}
				className="rounded border border-border px-3 py-1 text-sm hover:border-primary"
			>
				{__('👍 Yes', 'doublescale')}
			</button>
			<button
				type="button"
				onClick={() => vote(false)}
				className="rounded border border-border px-3 py-1 text-sm hover:border-primary"
			>
				{__('👎 No', 'doublescale')}
			</button>
		</div>
	);
};

const ArticleReader = ({
	slug,
	onBack,
	onOpen,
}: {
	slug: string;
	onBack: () => void;
	onOpen: (slug: string) => void;
}) => {
	const { data, loading, error } = useAsync(() => fetchArticle(slug), [slug]);

	if (loading) {
		return <Spinner />;
	}
	if (error) {
		return <ErrorState message={error} />;
	}
	if (!data) {
		return null;
	}

	const toc = data.toc || [];
	const related = data.related || [];
	const tags = data.tags || [];

	return (
		<div className="space-y-4">
			<button
				type="button"
				onClick={onBack}
				className="text-sm font-medium text-primary hover:underline"
			>
				← {__('Back to articles', 'doublescale')}
			</button>

			{/* Breadcrumbs are plain labels here: the portal has no group-archive
			    route, so linking out to the public taxonomy archive would eject the
			    user from the portal. */}
			{data.breadcrumbs && data.breadcrumbs.length > 0 && (
				<nav
					className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
					aria-label={__('Breadcrumb', 'doublescale')}
				>
					{data.breadcrumbs.map((crumb, i) => (
						<span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
							{i > 0 && <span aria-hidden="true">›</span>}
							<span>{crumb.label}</span>
						</span>
					))}
				</nav>
			)}

			<h1 className="text-2xl font-semibold text-foreground">{data.title}</h1>
			<p className="text-xs uppercase tracking-wide text-muted-foreground">
				{/* translators: %d: estimated reading time in minutes. */}
				{data.reading_time} {__('min read', 'doublescale')}
			</p>

			{data.show_toc && toc.length > 0 && (
				<nav
					className="rounded-lg border border-border bg-muted/30 p-4"
					aria-label={__('Table of contents', 'doublescale')}
				>
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{__('On this page', 'doublescale')}
					</p>
					<ul className="space-y-1">
						{toc.map((item) => (
							<li
								key={item.anchor}
								className={item.level >= 3 ? 'pl-4 text-sm' : 'text-sm'}
							>
								<a href={`#${item.anchor}`} className="text-primary hover:underline">
									{item.text}
								</a>
							</li>
						))}
					</ul>
				</nav>
			)}

			{/* Body HTML is sanitised server-side via wp_kses_post() on save;
			    content_html adds heading anchors so the TOC links resolve. */}
			<div
				className="doublescale-kb-article prose max-w-none"
				dangerouslySetInnerHTML={{ __html: data.content_html || data.content }}
			/>

			{tags.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{tags.map((tag) => (
						<span
							key={tag}
							className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
						>
							{tag}
						</span>
					))}
				</div>
			)}

			{related.length > 0 && (
				<section className="border-t border-border pt-4">
					<h2 className="mb-2 text-base font-semibold text-foreground">
						{__('Related articles', 'doublescale')}
					</h2>
					<ul className="space-y-1.5">
						{related.map((item) => (
							<li key={item.id}>
								<button
									type="button"
									onClick={() => onOpen(item.slug)}
									className="text-left text-sm font-medium text-primary hover:underline"
								>
									{item.title}
								</button>
							</li>
						))}
					</ul>
				</section>
			)}

			{data.feedback_enabled && <FeedbackControl slug={data.slug} />}
		</div>
	);
};

const KnowledgeBase = () => {
	const config = getPortalConfig();
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<string | null>(null);

	const available = useMemo(
		() => Boolean(config?.knowledgebase_rest_url),
		[config]
	);

	const { data, loading, error } = useAsync(
		() => fetchArticles(search),
		[search]
	);

	if (!available) {
		return (
			<EmptyState
				title={__('Knowledge base unavailable', 'doublescale')}
				description={__(
					'The knowledge base is not enabled for this account.',
					'doublescale'
				)}
			/>
		);
	}

	if (selected) {
		return (
			<ArticleReader
				slug={selected}
				onBack={() => setSelected(null)}
				onOpen={(s) => setSelected(s)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<input
				type="search"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder={__('Search articles…', 'doublescale')}
				className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm"
			/>

			{loading && <Spinner />}
			{error && <ErrorState message={error} />}

			{!loading && !error && data && data.data.length === 0 && (
				<EmptyState
					title={__('No articles found', 'doublescale')}
					description={__('Try a different search term.', 'doublescale')}
				/>
			)}

			{!loading && !error && data && data.data.length > 0 && (
				<ul className="space-y-2">
					{data.data.map((article) => (
						<li key={article.id}>
							<button
								type="button"
								onClick={() => setSelected(article.slug)}
								className="block w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary"
							>
								<p className="font-semibold text-foreground">
									{article.title}
								</p>
								{article.excerpt && (
									<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
										{article.excerpt}
									</p>
								)}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default KnowledgeBase;
