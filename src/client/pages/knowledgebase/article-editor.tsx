/**
 * Knowledge Base — article editor. Reuses the Lexical editor (rich toolbar via
 * type="email") for the body; title / status / group / tags / members-only /
 * excerpt round-trip through the `knowledgebase/articles` REST surface.
 *
 * Built on the shared design system (`@/components/ui/*`) so it matches the rest
 * of the admin (Inbox, Templates, …) rather than hand-rolled HTML.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useParams, getToLink } from '@doublescale/navigation';

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
	listGroups,
	updateArticle,
	type KbGroup,
} from './api';

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
	const [groups, setGroups] = useState<KbGroup[]>([]);
	const [loading, setLoading] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

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

	useEffect(() => {
		if (isNew) {
			return;
		}
		setLoading(true);
		getArticle(Number(id))
			.then((a) => {
				setTitle(a.title);
				setContent(a.content);
				setExcerpt(a.excerpt);
				setStatus(a.status);
				setGroupId(a.group_ids[0] || 0);
				setTags((a.tags || []).join(', '));
				setMembersOnly(a.members_only);
			})
			.catch((e) => setError((e as { message?: string })?.message || __('Failed to load.', 'doublescale')))
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

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
				<Button disabled={saving} onClick={save}>
					{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
				</Button>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

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
					<Editor message={content} onChange={setContent} type="email" />
				</div>
			</div>
		</div>
	);
};

export default ArticleEditor;
