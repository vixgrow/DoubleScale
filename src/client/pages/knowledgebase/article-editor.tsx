/**
 * Knowledge Base — article editor. Reuses the Lexical editor (rich toolbar via
 * type="email") for the body; title / status / group / tags / members-only /
 * excerpt round-trip through the `knowledgebase/articles` REST surface.
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useParams, getToLink } from '@doublescale/navigation';

import Editor from '@/components/booking/editor';

import {
	createArticle,
	getArticle,
	listGroups,
	updateArticle,
	type KbGroup,
} from './api';

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
