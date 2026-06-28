/**
 * Knowledge Base — article editor. Reuses the Lexical editor (rich toolbar via
 * type="email") for the body; title / status / group / tags / members-only /
 * excerpt round-trip through the `knowledgebase/articles` REST surface.
 *
 * Built on the shared design system (`@/components/ui/*`) so it matches the rest
 * of the admin (Inbox, Templates, …) rather than hand-rolled HTML.
 */

import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useParams, getToLink } from '@doublescale/navigation';
import { X, Search, History } from 'lucide-react';

import Editor from '@/components/booking/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import {
	createArticle,
	getArticle,
	getSettings,
	listArticles,
	listGroups,
	listRevisions,
	restoreRevision,
	updateArticle,
	type KbArticleFull,
	type KbArticleSummary,
	type KbGroup,
	type KbRevision,
} from './api';

/** Minimal WP media frame typing (wp.media is enqueued by AdminLoader). */
type MediaFrame = { on: (e: string, cb: () => void) => void; open: () => void; state: () => { get: (k: string) => { first: () => { toJSON: () => { id: number; url: string } } } } };
type WpMedia = (opts: Record<string, unknown>) => MediaFrame;

/** Visibility ranks — higher is more restrictive (mirrors PHP Services\Visibility). */
const VIS_RANK: Record<string, number> = { public: 0, members: 1, internal: 2 };

type EffectiveVisibility = 'draft' | 'public' | 'members' | 'internal';

const EFFECTIVE_LABEL: Record<EffectiveVisibility, string> = {
	draft: __('Draft — not shown on the front end', 'doublescale'),
	public: __('Everyone (public)', 'doublescale'),
	members: __('Logged-in users + staff', 'doublescale'),
	internal: __('Staff only', 'doublescale'),
};

/** Sentinel for the "no group" option — Radix Select cannot use an empty-string value. */
const NO_GROUP = '0';

const ArticleEditor = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isNew = !id || id === 'new';

	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [excerpt, setExcerpt] = useState('');
	const [status, setStatus] = useState<'publish' | 'draft' | 'private'>('draft');
	const [groupId, setGroupId] = useState(0);
	const [tags, setTags] = useState('');
	const [membersOnly, setMembersOnly] = useState(false);
	const [related, setRelated] = useState<Array<{ id: number; title: string }>>([]);
	const [featuredImageId, setFeaturedImageId] = useState(0);
	const [featuredImageUrl, setFeaturedImageUrl] = useState('');
	const [groups, setGroups] = useState<KbGroup[]>([]);
	const [loading, setLoading] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	// Bumped to force the Lexical editor to re-mount with new body content
	// (it reads `message` only on mount), e.g. after restoring a revision.
	const [editorKey, setEditorKey] = useState(0);

	// Revision history panel state.
	const [showRevisions, setShowRevisions] = useState(false);
	const [revisions, setRevisions] = useState<KbRevision[]>([]);
	const [revLoading, setRevLoading] = useState(false);
	const [previewRevId, setPreviewRevId] = useState(0);

	// Related-article picker search state.
	const [relQuery, setRelQuery] = useState('');
	const [relResults, setRelResults] = useState<KbArticleSummary[]>([]);
	const relRequestId = useRef(0);

	useEffect(() => {
		listGroups()
			.then((res) => setGroups(res.data))
			.catch(() => undefined);
	}, []);

	// New articles inherit the "Default new-article visibility" setting as the
	// starting position of the Members-only toggle (the author can still override).
	useEffect(() => {
		if (!isNew) {
			return;
		}
		getSettings()
			.then((s) => setMembersOnly(s.default_visibility === 'members'))
			.catch(() => undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isNew]);

	const groupById = useMemo(() => {
		const map: Record<number, KbGroup> = {};
		groups.forEach((g) => {
			map[g.id] = g;
		});
		return map;
	}, [groups]);

	// Effective visibility = the STRICTEST of status, the members-only flag, and
	// the selected group folded through its ancestors (mirrors PHP Visibility).
	const effectiveVisibility = useMemo((): EffectiveVisibility => {
		if (status === 'draft') {
			return 'draft';
		}
		if (status === 'private') {
			return 'internal';
		}
		let rank = membersOnly ? VIS_RANK.members : VIS_RANK.public;
		const seen = new Set<number>();
		let cursor: KbGroup | undefined = groupId ? groupById[groupId] : undefined;
		while (cursor && !seen.has(cursor.id)) {
			seen.add(cursor.id);
			rank = Math.max(rank, VIS_RANK[cursor.visibility] ?? 0);
			cursor = cursor.parent ? groupById[cursor.parent] : undefined;
		}
		return rank >= VIS_RANK.internal ? 'internal' : rank === VIS_RANK.members ? 'members' : 'public';
	}, [status, membersOnly, groupId, groupById]);

	// True when the group (or an ancestor) restricts further than the article's
	// own status/toggle — the author can't see why from the toggle alone.
	const groupTightensVisibility = useMemo(() => {
		if (status !== 'publish') {
			return false;
		}
		const ownRank = membersOnly ? VIS_RANK.members : VIS_RANK.public;
		return VIS_RANK[effectiveVisibility] > ownRank;
	}, [status, membersOnly, effectiveVisibility]);

	// Apply a full article payload to the editor fields. Shared by the initial
	// load and by revision-restore (which returns the refreshed article).
	const applyArticle = (a: KbArticleFull) => {
		setTitle(a.title);
		setContent(a.content);
		setExcerpt(a.excerpt);
		setStatus(a.status);
		setGroupId(a.group_ids[0] || 0);
		setTags((a.tags || []).join(', '));
		setMembersOnly(a.members_only);
		setFeaturedImageId(a.featured_image || 0);
		setFeaturedImageUrl(a.featured_image_url || '');
		const titleById: Record<number, string> = {};
		(a.related || []).forEach((r) => {
			titleById[r.id] = r.title;
		});
		setRelated((a.related_ids || []).map((rid) => ({ id: rid, title: titleById[rid] || `#${rid}` })));
		setEditorKey((k) => k + 1);
	};

	useEffect(() => {
		if (isNew) {
			return;
		}
		setLoading(true);
		getArticle(Number(id))
			.then(applyArticle)
			.catch((e) => setError((e as { message?: string })?.message || __('Failed to load.', 'doublescale')))
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	// Debounced search for the related-article picker (published articles only).
	useEffect(() => {
		const q = relQuery.trim();
		if (q.length < 2) {
			setRelResults([]);
			return;
		}
		const reqId = ++relRequestId.current;
		const timer = setTimeout(() => {
			listArticles({ search: q, status: 'publish' })
				.then((res) => {
					if (reqId === relRequestId.current) {
						setRelResults(res.data || []);
					}
				})
				.catch(() => {
					if (reqId === relRequestId.current) {
						setRelResults([]);
					}
				});
		}, 300);
		return () => clearTimeout(timer);
	}, [relQuery]);

	const addRelated = (a: KbArticleSummary) => {
		setRelated((prev) => (prev.some((r) => r.id === a.id) ? prev : [...prev, { id: a.id, title: a.title }]));
		setRelQuery('');
		setRelResults([]);
	};

	const removeRelated = (rid: number) =>
		setRelated((prev) => prev.filter((r) => r.id !== rid));

	// Open the WordPress media frame to choose a featured image (attachment ID).
	const openMediaFrame = () => {
		const wp = (window as { wp?: { media?: WpMedia } }).wp;
		if (!wp?.media) {
			return;
		}
		const frame = wp.media({
			title: __('Select featured image', 'doublescale'),
			button: { text: __('Use this image', 'doublescale') },
			multiple: false,
			library: { type: 'image' },
		});
		frame.on('select', () => {
			const attachment = frame.state().get('selection').first().toJSON();
			setFeaturedImageId(attachment.id);
			setFeaturedImageUrl(attachment.url);
		});
		frame.open();
	};

	const currentId = isNew ? 0 : Number(id);
	const relCandidates = relResults.filter(
		(a) => a.id !== currentId && !related.some((r) => r.id === a.id)
	);

	// Revision history: list, open the panel, and restore a prior version.
	const loadRevisions = () => {
		setRevLoading(true);
		listRevisions(Number(id))
			.then((res) => setRevisions(res.data || []))
			.catch(() => setRevisions([]))
			.finally(() => setRevLoading(false));
	};

	const toggleRevisions = () => {
		const next = !showRevisions;
		setShowRevisions(next);
		if (next) {
			loadRevisions();
		}
	};

	const onRestore = async (revId: number) => {
		// eslint-disable-next-line no-alert
		if (!window.confirm(__('Restore this revision? Unsaved changes will be lost.', 'doublescale'))) {
			return;
		}
		setError('');
		try {
			const restored = await restoreRevision(Number(id), revId);
			applyArticle(restored);
			setShowRevisions(false);
			setPreviewRevId(0);
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to restore revision.', 'doublescale'));
		}
	};

	// post_modified_gmt arrives as "YYYY-MM-DD HH:MM:SS" (UTC, no zone marker).
	const formatRevDate = (raw: string): string => {
		const parsed = new Date(`${raw.replace(' ', 'T')}Z`);
		return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleString();
	};

	const save = async () => {
		setSaving(true);
		setError('');
		const payload = {
			title,
			content,
			excerpt,
			status,
			group_ids: groupId ? [groupId] : [],
			tags: tags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
			members_only: membersOnly,
			related: related.map((r) => r.id),
			featured_image_id: featuredImageId,
		};
		try {
			if (isNew) {
				await createArticle(payload);
			} else {
				await updateArticle(Number(id), payload);
			}
			navigate(getToLink('knowledgebase'));
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to save.', 'doublescale'));
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <p className="p-6 text-sm text-muted-foreground">{__('Loading…', 'doublescale')}</p>;
	}

	return (
		<div className="p-6 space-y-4 max-w-4xl">
			<div className="flex items-center justify-between">
				<Button variant="ghost" size="sm" onClick={() => navigate(getToLink('knowledgebase'))}>
					← {__('Back', 'doublescale')}
				</Button>
				<div className="flex items-center gap-2">
					{!isNew && (
						<Button variant="outline" size="sm" onClick={toggleRevisions}>
							<History width={14} height={14} className="mr-1" />
							{__('Revisions', 'doublescale')}
						</Button>
					)}
					<Button disabled={saving} onClick={save}>
						{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
					</Button>
				</div>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			{showRevisions && (
				<Card>
					<CardContent className="space-y-2 py-4">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{__('Revision history', 'doublescale')}</p>
							<Button variant="ghost" size="sm" onClick={() => setShowRevisions(false)}>
								<X width={14} height={14} />
							</Button>
						</div>
						{revLoading ? (
							<p className="text-sm text-muted-foreground">{__('Loading…', 'doublescale')}</p>
						) : revisions.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{__('No revisions yet. WordPress saves one each time you update the article.', 'doublescale')}
							</p>
						) : (
							<ul className="divide-y divide-border">
								{revisions.map((rev) => (
									<li key={rev.id} className="py-2">
										<div className="flex items-center justify-between gap-2">
											<button
												type="button"
												className="text-left text-sm hover:underline"
												onClick={() => setPreviewRevId(previewRevId === rev.id ? 0 : rev.id)}
											>
												<span className="font-medium">{formatRevDate(rev.date)}</span>
												<span className="text-muted-foreground"> · {rev.author}</span>
												{rev.autosave && (
													<span className="ml-1 text-xs text-amber-600">
														{__('(autosave)', 'doublescale')}
													</span>
												)}
											</button>
											<Button variant="outline" size="sm" onClick={() => onRestore(rev.id)}>
												{__('Restore', 'doublescale')}
											</Button>
										</div>
										{previewRevId === rev.id && (
											<div
												className="prose prose-sm mt-2 max-h-64 max-w-none overflow-y-auto rounded border border-border bg-muted/30 p-3 text-sm"
												// Revision body is the article's own sanitised content.
												dangerouslySetInnerHTML={{ __html: rev.content }}
											/>
										)}
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			)}

			<Input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder={__('Article title', 'doublescale')}
				className="h-12 text-lg font-semibold"
			/>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label>{__('Status', 'doublescale')}</Label>
					<Select
						value={status}
						onValueChange={(value) => setStatus(value as 'publish' | 'draft' | 'private')}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="draft">{__('Draft', 'doublescale')}</SelectItem>
							<SelectItem value="publish">{__('Published', 'doublescale')}</SelectItem>
							<SelectItem value="private">{__('Internal (staff only)', 'doublescale')}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<Label>{__('Group', 'doublescale')}</Label>
					<Select
						value={String(groupId)}
						onValueChange={(value) => setGroupId(Number(value))}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NO_GROUP}>{__('— None —', 'doublescale')}</SelectItem>
							{groups.map((g) => (
								<SelectItem key={g.id} value={String(g.id)}>
									{g.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="kb-tags">{__('Tags (comma separated)', 'doublescale')}</Label>
				<Input
					id="kb-tags"
					type="text"
					value={tags}
					onChange={(e) => setTags(e.target.value)}
				/>
			</div>

			<div className="space-y-1.5">
				<Label>{__('Featured image', 'doublescale')}</Label>
				{featuredImageUrl ? (
					<div className="flex items-center gap-3">
						<img
							src={featuredImageUrl}
							alt=""
							className="h-16 w-16 rounded border object-cover"
						/>
						<Button type="button" variant="outline" size="sm" onClick={openMediaFrame}>
							{__('Replace', 'doublescale')}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => {
								setFeaturedImageId(0);
								setFeaturedImageUrl('');
							}}
						>
							{__('Remove', 'doublescale')}
						</Button>
					</div>
				) : (
					<Button type="button" variant="outline" size="sm" onClick={openMediaFrame}>
						{__('Set featured image', 'doublescale')}
					</Button>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="kb-related">{__('Related articles', 'doublescale')}</Label>
				{related.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{related.map((r) => (
							<span
								key={r.id}
								className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
							>
								{r.title}
								<button
									type="button"
									onClick={() => removeRelated(r.id)}
									className="text-muted-foreground hover:text-foreground"
									aria-label={__('Remove related article', 'doublescale')}
								>
									<X width={12} height={12} />
								</button>
							</span>
						))}
					</div>
				)}
				<div className="relative">
					<Search
						width={14}
						height={14}
						className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						id="kb-related"
						type="text"
						value={relQuery}
						onChange={(e) => setRelQuery(e.target.value)}
						placeholder={__('Search articles to link…', 'doublescale')}
						className="pl-7"
					/>
					{relCandidates.length > 0 && (
						<div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
							<ul className="max-h-48 overflow-y-auto">
								{relCandidates.map((a) => (
									<li key={a.id}>
										<button
											type="button"
											onClick={() => addRelated(a)}
											className="block w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
											title={a.title}
										>
											{a.title || __('(untitled)', 'doublescale')}
										</button>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
				<p className="text-xs text-muted-foreground">
					{__('Leave empty to auto-suggest same-group articles.', 'doublescale')}
				</p>
			</div>

			<div className="flex items-center gap-3">
				<Switch
					id="kb-members-only"
					checked={membersOnly}
					onCheckedChange={setMembersOnly}
				/>
				<Label htmlFor="kb-members-only" className="font-normal">
					{__('Members only (logged-in users + staff)', 'doublescale')}
				</Label>
			</div>

			<Card>
				<CardContent className="py-3 text-xs text-muted-foreground">
					<span>
						{__('Who can see this:', 'doublescale')}{' '}
						<strong className="text-foreground">{EFFECTIVE_LABEL[effectiveVisibility]}</strong>
					</span>
					{groupTightensVisibility && (
						<span className="ml-1 text-amber-700">
							{__('— restricted by its group, not the toggle above.', 'doublescale')}
						</span>
					)}
					<span className="mt-1 block">
						{__(
							'Effective visibility is the strictest of the status, this toggle, and the article’s group. A “private” status or an internal/members group overrides a more open choice here.',
							'doublescale'
						)}
					</span>
				</CardContent>
			</Card>

			<div className="space-y-1.5">
				<Label htmlFor="kb-excerpt">{__('Excerpt', 'doublescale')}</Label>
				<Textarea
					id="kb-excerpt"
					value={excerpt}
					onChange={(e) => setExcerpt(e.target.value)}
					rows={2}
				/>
			</div>

			<div className="space-y-1.5">
				<Label>{__('Body', 'doublescale')}</Label>
				<div className="rounded-lg border">
					<Editor key={editorKey} message={content} onChange={setContent} type="email" />
				</div>
			</div>
		</div>
	);
};

export default ArticleEditor;
