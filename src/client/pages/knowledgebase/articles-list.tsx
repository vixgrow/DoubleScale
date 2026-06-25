/**
 * Knowledge Base — articles list (v1 table view; the Kanban board is a later
 * enhancement, the plan's named fallback). Group filter + search + status,
 * with duplicate / delete row actions.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, getToLink } from '@doublescale/navigation';

import {
	deleteArticle,
	duplicateArticle,
	listArticles,
	listGroups,
	type KbArticleSummary,
	type KbGroup,
} from './api';

const STATUS_LABEL: Record<string, string> = {
	publish: __('Published', 'doublescale'),
	draft: __('Draft', 'doublescale'),
	private: __('Internal', 'doublescale'),
};

const ArticlesList = () => {
	const navigate = useNavigate();
	const [articles, setArticles] = useState<KbArticleSummary[]>([]);
	const [groups, setGroups] = useState<KbGroup[]>([]);
	const [search, setSearch] = useState('');
	const [group, setGroup] = useState(0);
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const load = async () => {
		setLoading(true);
		setError('');
		try {
			const res = await listArticles({
				search: search || undefined,
				group: group || undefined,
				status: status || undefined,
			});
			setArticles(res.data);
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to load articles.', 'doublescale'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		listGroups()
			.then((res) => setGroups(res.data))
			.catch(() => undefined);
	}, []);

	useEffect(() => {
		const t = setTimeout(load, 250);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, group, status]);

	const groupName = useMemo(() => {
		const map: Record<number, string> = {};
		groups.forEach((g) => {
			map[g.id] = g.name;
		});
		return map;
	}, [groups]);

	const onDuplicate = async (id: number) => {
		await duplicateArticle(id);
		load();
	};

	const onDelete = async (id: number) => {
		// eslint-disable-next-line no-alert
		if (!window.confirm(__('Delete this article permanently?', 'doublescale'))) {
			return;
		}
		await deleteArticle(id);
		load();
	};

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{__('Knowledge Base', 'doublescale')}</h1>
				<div className="flex gap-2">
					<button
						type="button"
						className="rounded-md border px-3 py-2 text-sm"
						onClick={() => navigate(getToLink('knowledgebase/groups'))}
					>
						{__('Groups', 'doublescale')}
					</button>
					<button
						type="button"
						className="rounded-md border px-3 py-2 text-sm"
						onClick={() => navigate(getToLink('knowledgebase/settings'))}
					>
						{__('Settings', 'doublescale')}
					</button>
					<button
						type="button"
						className="rounded-md bg-primary px-3 py-2 text-sm text-white"
						onClick={() => navigate(getToLink('knowledgebase/article/new'))}
					>
						{__('New article', 'doublescale')}
					</button>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<input
					type="search"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={__('Search…', 'doublescale')}
					className="rounded-md border px-3 py-2 text-sm"
				/>
				<select
					value={group}
					onChange={(e) => setGroup(Number(e.target.value))}
					className="rounded-md border px-3 py-2 text-sm"
				>
					<option value={0}>{__('All groups', 'doublescale')}</option>
					{groups.map((g) => (
						<option key={g.id} value={g.id}>
							{g.name}
						</option>
					))}
				</select>
				<select
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="rounded-md border px-3 py-2 text-sm"
				>
					<option value="">{__('All statuses', 'doublescale')}</option>
					<option value="publish">{STATUS_LABEL.publish}</option>
					<option value="draft">{STATUS_LABEL.draft}</option>
					<option value="private">{STATUS_LABEL.private}</option>
				</select>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}
			{loading && <p className="text-sm text-gray-500">{__('Loading…', 'doublescale')}</p>}

			{!loading && articles.length === 0 && (
				<p className="text-sm text-gray-500">{__('No articles yet.', 'doublescale')}</p>
			)}

			{!loading && articles.length > 0 && (
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr className="border-b text-left text-gray-500">
							<th className="py-2">{__('Title', 'doublescale')}</th>
							<th className="py-2">{__('Group', 'doublescale')}</th>
							<th className="py-2">{__('Status', 'doublescale')}</th>
							<th className="py-2">{__('Views', 'doublescale')}</th>
							<th className="py-2" />
						</tr>
					</thead>
					<tbody>
						{articles.map((a) => (
							<tr key={a.id} className="border-b hover:bg-gray-50">
								<td className="py-2">
									<button
										type="button"
										className="font-medium text-primary hover:underline"
										onClick={() => navigate(getToLink(`knowledgebase/article/${a.id}`))}
									>
										{a.title || __('(untitled)', 'doublescale')}
									</button>
									{a.members_only && (
										<span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
											{__('Members', 'doublescale')}
										</span>
									)}
								</td>
								<td className="py-2">{groupName[a.group_id] || '—'}</td>
								<td className="py-2">{STATUS_LABEL[a.status] || a.status}</td>
								<td className="py-2">{a.views}</td>
								<td className="py-2 text-right">
									<button
										type="button"
										className="mr-3 text-xs text-gray-500 hover:underline"
										onClick={() => onDuplicate(a.id)}
									>
										{__('Duplicate', 'doublescale')}
									</button>
									<button
										type="button"
										className="text-xs text-red-600 hover:underline"
										onClick={() => onDelete(a.id)}
									>
										{__('Delete', 'doublescale')}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};

export default ArticlesList;
