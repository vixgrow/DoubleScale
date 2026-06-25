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

interface KbArticleFull extends KbArticleSummary {
	content: string;
	breadcrumbs: Array<{ label: string; url: string }>;
	tags: string[];
}

const KB_BASE = '/doublescale/v1/knowledgebase/public';

const fetchArticles = (search: string): Promise<{ data: KbArticleSummary[] }> =>
	apiFetch<{ data: KbArticleSummary[] }>({
		path: addQueryArgs(`${KB_BASE}/articles`, search ? { search } : {}),
	});

const fetchArticle = (slug: string): Promise<KbArticleFull> =>
	apiFetch<KbArticleFull>({ path: `${KB_BASE}/articles/${slug}` });

const ArticleReader = ({
	slug,
	onBack,
}: {
	slug: string;
	onBack: () => void;
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

	return (
		<div className="space-y-4">
			<button
				type="button"
				onClick={onBack}
				className="text-sm font-medium text-primary hover:underline"
			>
				← {__('Back to articles', 'doublescale')}
			</button>
			<h1 className="text-2xl font-semibold text-foreground">{data.title}</h1>
			<p className="text-xs uppercase tracking-wide text-muted-foreground">
				{/* translators: %d: estimated reading time in minutes. */}
				{data.reading_time} {__('min read', 'doublescale')}
			</p>
			{/* Body HTML is sanitised server-side via wp_kses_post() on save. */}
			<div
				className="doublescale-kb-article prose max-w-none"
				dangerouslySetInnerHTML={{ __html: data.content }}
			/>
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
		return <ArticleReader slug={selected} onBack={() => setSelected(null)} />;
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
