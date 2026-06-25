/**
 * Knowledge Base — article editor. Reuses the Lexical editor (rich toolbar via
 * type="email") for the body; title / status / group / tags / members-only /
 * excerpt round-trip through the `knowledgebase/articles` REST surface.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useParams, getToLink } from '@doublescale/navigation';

import Editor from '@/components/booking/editor';

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
		return <p className="p-6 text-sm text-gray-500">{__('Loading…', 'doublescale')}</p>;
	}

	return (
		<div className="p-6 space-y-4 max-w-4xl">
			<div className="flex items-center justify-between">
				<button
					type="button"
					className="text-sm text-primary hover:underline"
					onClick={() => navigate(getToLink('knowledgebase'))}
				>
					← {__('Back', 'doublescale')}
				</button>
				<button
					type="button"
					disabled={saving}
					className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
					onClick={save}
				>
					{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
				</button>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder={__('Article title', 'doublescale')}
				className="w-full rounded-md border px-3 py-2 text-lg font-semibold"
			/>

			<div className="grid grid-cols-2 gap-4">
				<label className="text-sm">
					<span className="mb-1 block text-gray-500">{__('Status', 'doublescale')}</span>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as 'publish' | 'draft' | 'private')}
						className="w-full rounded-md border px-3 py-2"
					>
						<option value="draft">{__('Draft', 'doublescale')}</option>
						<option value="publish">{__('Published', 'doublescale')}</option>
						<option value="private">{__('Internal (staff only)', 'doublescale')}</option>
					</select>
				</label>
				<label className="text-sm">
					<span className="mb-1 block text-gray-500">{__('Group', 'doublescale')}</span>
					<select
						value={groupId}
						onChange={(e) => setGroupId(Number(e.target.value))}
						className="w-full rounded-md border px-3 py-2"
					>
						<option value={0}>{__('— None —', 'doublescale')}</option>
						{groups.map((g) => (
							<option key={g.id} value={g.id}>
								{g.name}
							</option>
						))}
					</select>
				</label>
			</div>

			<label className="block text-sm">
				<span className="mb-1 block text-gray-500">{__('Tags (comma separated)', 'doublescale')}</span>
				<input
					type="text"
					value={tags}
					onChange={(e) => setTags(e.target.value)}
					className="w-full rounded-md border px-3 py-2"
				/>
			</label>

			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={membersOnly}
					onChange={(e) => setMembersOnly(e.target.checked)}
				/>
				{__('Members only (logged-in users + staff)', 'doublescale')}
			</label>

			<div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
				<span>
					{__('Who can see this:', 'doublescale')}{' '}
					<strong className="text-gray-800">{EFFECTIVE_LABEL[effectiveVisibility]}</strong>
				</span>
				{groupTightensVisibility && (
					<span className="ml-1 text-amber-700">
						{__('— restricted by its group, not the toggle above.', 'doublescale')}
					</span>
				)}
				<span className="mt-1 block text-gray-500">
					{__(
						'Effective visibility is the strictest of the status, this toggle, and the article’s group. A “private” status or an internal/members group overrides a more open choice here.',
						'doublescale'
					)}
				</span>
			</div>

			<label className="block text-sm">
				<span className="mb-1 block text-gray-500">{__('Excerpt', 'doublescale')}</span>
				<textarea
					value={excerpt}
					onChange={(e) => setExcerpt(e.target.value)}
					rows={2}
					className="w-full rounded-md border px-3 py-2"
				/>
			</label>

			<div className="text-sm">
				<span className="mb-1 block text-gray-500">{__('Body', 'doublescale')}</span>
				<div className="rounded-md border">
					<Editor message={content} onChange={setContent} type="email" />
				</div>
			</div>
		</div>
	);
};

export default ArticleEditor;
