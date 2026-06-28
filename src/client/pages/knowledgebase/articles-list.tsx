/**
 * Knowledge Base — articles list (v1 table view; the Kanban board is a later
 * enhancement, the plan's named fallback). Group filter + search + status,
 * with duplicate / delete row actions.
 *
 * When filtered to a single group (and not searching), rows become drag-sortable
 * so editors can curate article order — the public listing, portal reader, and
 * themed archive all sort by `menu_order`. Ordering is only meaningful within one
 * group, so drag is disabled in the "All groups" / search views.
 *
 * Built on the shared design system (`@/components/ui/*`) so it matches the rest
 * of the admin (Inbox, Templates, …) rather than hand-rolled HTML.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useParams, getToLink } from '@doublescale/navigation';
import type { ReactNode } from 'react';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

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
	reorderArticles,
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

interface ArticleCellsProps {
	article: KbArticleSummary;
	groupLabel: string;
	onOpen: (id: number) => void;
	onOpenGroup: (groupId: number) => void;
	onDuplicate: (id: number) => void;
	onDelete: (id: number) => void;
}

/** The article's data cells, shared by the plain and drag-sortable row variants. */
const ArticleCells = ({
	article: a,
	groupLabel,
	onOpen,
	onOpenGroup,
	onDuplicate,
	onDelete,
}: ArticleCellsProps) => (
	<>
		<TableCell>
			<div className="flex items-center gap-2">
				<button
					type="button"
					className="font-medium text-primary hover:underline"
					onClick={() => onOpen(a.id)}
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
		<TableCell>
			{a.group_id > 0 ? (
				<button
					type="button"
					className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:underline"
					onClick={() => onOpenGroup(a.group_id)}
					title={__('Filter to this group', 'doublescale')}
				>
					{a.group_color && (
						<span
							aria-hidden="true"
							className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
							style={{ backgroundColor: a.group_color }}
						/>
					)}
					{groupLabel || __('(group)', 'doublescale')}
				</button>
			) : (
				<span className="text-muted-foreground">—</span>
			)}
		</TableCell>
		<TableCell>
			<Badge className={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status] || a.status}</Badge>
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
	</>
);

/** A drag-sortable row: handle-only listeners keep the inline title/actions clickable. */
const SortableArticleRow = ({ id, children }: { id: number; children: ReactNode }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};
	return (
		<TableRow ref={setNodeRef} style={style}>
			<TableCell className="w-8 pr-0">
				<button
					type="button"
					className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
					aria-label={__('Drag to reorder', 'doublescale')}
					{...attributes}
					{...listeners}
				>
					<GripVertical className="h-4 w-4" />
				</button>
			</TableCell>
			{children}
		</TableRow>
	);
};

const ArticlesList = () => {
	const navigate = useNavigate();
	const { groupId } = useParams<{ groupId?: string }>();
	const [articles, setArticles] = useState<KbArticleSummary[]>([]);
	const [groups, setGroups] = useState<KbGroup[]>([]);
	const [search, setSearch] = useState('');
	const [group, setGroup] = useState(groupId ? Number(groupId) : 0);
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Drilling in from the Groups page (or navigating between group links) seeds
	// the filter from the route param. We only follow the param when present so a
	// manual filter change on the base route isn't clobbered.
	useEffect(() => {
		if (groupId !== undefined) {
			setGroup(Number(groupId));
		}
	}, [groupId]);

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

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	// Article order (menu_order) is only meaningful within one group, so drag is
	// enabled only when a single group is selected and there's no active search.
	const canReorder = group !== 0 && search.trim() === '';
	const colCount = canReorder ? 6 : 5;

	const onDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			return;
		}
		const from = articles.findIndex((a) => a.id === Number(active.id));
		const to = articles.findIndex((a) => a.id === Number(over.id));
		if (from === -1 || to === -1 || from === to) {
			return;
		}

		const next = arrayMove(articles, from, to);
		setArticles(next); // Optimistic — the list is already the single-group set.
		setError('');
		try {
			await reorderArticles(next.map((a, i) => ({ id: a.id, order: i })));
		} catch (e) {
			setError(
				(e as { message?: string })?.message || __('Failed to reorder articles.', 'doublescale')
			);
			load(); // Reconcile to server truth, reverting the optimistic move.
		}
	};

	const onOpen = (id: number) => navigate(getToLink(`knowledgebase/article/${id}`));
	const onOpenGroup = (gid: number) => navigate(getToLink(`knowledgebase/group/${gid}`));

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
			{groupId !== undefined && (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-2 w-fit"
					onClick={() => navigate(getToLink('knowledgebase'))}
				>
					← {__('Back to articles', 'doublescale')}
				</Button>
			)}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{__('Knowledge Base', 'doublescale')}</h1>
				<div className="flex gap-2">
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
				<Select value={String(group)} onValueChange={(value) => setGroup(Number(value))}>
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

			{group !== 0 && (
				<p className="text-sm text-muted-foreground">
					{canReorder
						? __('Drag the handle to reorder articles in this group.', 'doublescale')
						: __('Clear the search to drag-reorder articles in this group.', 'doublescale')}
				</p>
			)}

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							{canReorder && <TableHead className="w-8" />}
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
									<TableCell colSpan={colCount}>
										<Skeleton className="h-6 w-full" />
									</TableCell>
								</TableRow>
							))
						) : articles.length === 0 ? (
							<TableRow>
								<TableCell colSpan={colCount} className="text-center text-muted-foreground">
									{__('No articles yet.', 'doublescale')}
								</TableCell>
							</TableRow>
						) : canReorder ? (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								modifiers={[restrictToVerticalAxis]}
								onDragEnd={onDragEnd}
							>
								<SortableContext
									items={articles.map((a) => a.id)}
									strategy={verticalListSortingStrategy}
								>
									{articles.map((a) => (
										<SortableArticleRow key={a.id} id={a.id}>
											<ArticleCells
												article={a}
												groupLabel={groupName[a.group_id]}
												onOpen={onOpen}
												onOpenGroup={onOpenGroup}
												onDuplicate={onDuplicate}
												onDelete={onDelete}
											/>
										</SortableArticleRow>
									))}
								</SortableContext>
							</DndContext>
						) : (
							articles.map((a) => (
								<TableRow key={a.id}>
									<ArticleCells
										article={a}
										groupLabel={groupName[a.group_id]}
										onOpen={onOpen}
										onOpenGroup={onOpenGroup}
										onDuplicate={onDuplicate}
										onDelete={onDelete}
									/>
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
