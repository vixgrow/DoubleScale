/**
 * Knowledge Base — articles list (v1 table view; the Kanban board is a later
 * enhancement, the plan's named fallback). Group filter + search + status,
 * with duplicate / delete row actions.
 *
 * Built on the shared design system (`@/components/ui/*`) so it matches the rest
 * of the admin (Inbox, Templates, …) rather than hand-rolled HTML.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, getToLink } from '@doublescale/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

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

/** Status → Badge styling. Greens/ambers are semantic, applied via className on the Badge primitive. */
const STATUS_BADGE: Record<string, string> = {
	publish: 'border-transparent bg-emerald-100 text-emerald-700',
	draft: 'border-transparent bg-gray-100 text-gray-600',
	private: 'border-transparent bg-amber-100 text-amber-700',
};

/** Sentinel for the "All statuses" option — Radix Select cannot use an empty-string value. */
const ALL_STATUSES = 'all';

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
					<Button variant="outline" onClick={() => navigate(getToLink('knowledgebase/groups'))}>
						{__('Groups', 'doublescale')}
					</Button>
					<Button variant="outline" onClick={() => navigate(getToLink('knowledgebase/settings'))}>
						{__('Settings', 'doublescale')}
					</Button>
					<Button onClick={() => navigate(getToLink('knowledgebase/article/new'))}>
						{__('New article', 'doublescale')}
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Input
					type="search"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={__('Search…', 'doublescale')}
					className="w-56"
				/>
				<Select
					value={String(group)}
					onValueChange={(value) => setGroup(Number(value))}
				>
					<SelectTrigger className="w-44">
						<SelectValue placeholder={__('All groups', 'doublescale')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0">{__('All groups', 'doublescale')}</SelectItem>
						{groups.map((g) => (
							<SelectItem key={g.id} value={String(g.id)}>
								{g.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={status || ALL_STATUSES}
					onValueChange={(value) => setStatus(value === ALL_STATUSES ? '' : value)}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder={__('All statuses', 'doublescale')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_STATUSES}>{__('All statuses', 'doublescale')}</SelectItem>
						<SelectItem value="publish">{STATUS_LABEL.publish}</SelectItem>
						<SelectItem value="draft">{STATUS_LABEL.draft}</SelectItem>
						<SelectItem value="private">{STATUS_LABEL.private}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{__('Title', 'doublescale')}</TableHead>
							<TableHead>{__('Group', 'doublescale')}</TableHead>
							<TableHead>{__('Status', 'doublescale')}</TableHead>
							<TableHead className="text-right">{__('Views', 'doublescale')}</TableHead>
							<TableHead className="w-px" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={`s-${i}`}>
									<TableCell colSpan={5}>
										<Skeleton className="h-6 w-full" />
									</TableCell>
								</TableRow>
							))
						) : articles.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground">
									{__('No articles yet.', 'doublescale')}
								</TableCell>
							</TableRow>
						) : (
							articles.map((a) => (
								<TableRow key={a.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											<button
												type="button"
												className="font-medium text-primary hover:underline"
												onClick={() => navigate(getToLink(`knowledgebase/article/${a.id}`))}
											>
												{a.title || __('(untitled)', 'doublescale')}
											</button>
											{a.members_only && (
												<Badge className="border-transparent bg-amber-100 text-amber-700">
													{__('Members', 'doublescale')}
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{groupName[a.group_id] || '—'}
									</TableCell>
									<TableCell>
										<Badge className={STATUS_BADGE[a.status]}>
											{STATUS_LABEL[a.status] || a.status}
										</Badge>
									</TableCell>
									<TableCell className="text-right tabular-nums">{a.views}</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-1">
											<Button variant="ghost" size="sm" onClick={() => onDuplicate(a.id)}>
												{__('Duplicate', 'doublescale')}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-destructive hover:text-destructive"
												onClick={() => onDelete(a.id)}
											>
												{__('Delete', 'doublescale')}
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
};

export default ArticlesList;
