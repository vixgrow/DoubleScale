/**
 * Knowledge Base — group management (create / edit / delete) with full hierarchy,
 * ordering, colour, and per-group visibility. Rename / parent / order all
 * round-trip through the existing `updateGroup` (PUT /groups/{id}), which already
 * accepts name, parent, color, order, and visibility. Delete is blocked
 * server-side (409) when the group still holds articles; we surface that message.
 *
 * Built on the shared design system (`@/components/ui/*`) so it matches the rest
 * of the admin (Inbox, Templates, …) rather than hand-rolled HTML.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, getToLink } from '@doublescale/navigation';
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
import { Card } from '@/components/ui/card';
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
	createGroup,
	deleteGroup,
	listGroups,
	reorderGroups,
	updateGroup,
	type KbGroup,
} from './api';

const VISIBILITY_OPTIONS = [
	{ value: 'public', label: __('Public', 'doublescale') },
	{ value: 'members', label: __('Members only', 'doublescale') },
	{ value: 'internal', label: __('Internal (staff)', 'doublescale') },
];

/** Sentinel for "top level / no parent" — Radix Select cannot use an empty value. */
const TOP_LEVEL = '0';

interface SortableGroupRowProps {
	group: KbGroup;
	depth: number;
	parentOptions: (excludeId?: number) => ReactNode;
	onPatch: (id: number, data: Partial<KbGroup>) => void;
	onRemove: (id: number) => void;
	onOpenArticles: (groupId: number) => void;
}

/**
 * One draggable group row. Only the grip handle starts a drag — the dnd-kit
 * `listeners` are bound to the handle, not the row — so the inline name / parent
 * / colour / visibility / order controls all stay clickable. The row body is a
 * verbatim port of the previous inline markup; the handle cell is the only
 * addition.
 */
const SortableGroupRow = ({
	group: g,
	depth,
	parentOptions,
	onPatch,
	onRemove,
	onOpenArticles,
}: SortableGroupRowProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: g.id,
	});
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
			<TableCell>
				<div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
					{/* Colour swatch so the per-group colour is visible where it's set
					    (it otherwise only surfaces in the [doublescale_kb] shortcode). */}
					<span
						aria-hidden="true"
						className="h-3 w-3 shrink-0 rounded-full border border-border"
						style={{ backgroundColor: g.color || '#6d78d8' }}
					/>
					{/* Uncontrolled + keyed on the value so a successful rename
					    re-seeds the field on the next reload. Commits on blur. */}
					<Input
						key={`name-${g.id}-${g.name}`}
						defaultValue={g.name}
						onBlur={(e) => {
							const v = e.target.value.trim();
							if (v && v !== g.name) {
								onPatch(g.id, { name: v });
							}
						}}
						className="h-8 font-medium"
					/>
				</div>
			</TableCell>
			<TableCell>
				<Select value={String(g.parent)} onValueChange={(v) => onPatch(g.id, { parent: Number(v) })}>
					<SelectTrigger className="h-8 w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={TOP_LEVEL}>{__('— Top level —', 'doublescale')}</SelectItem>
						{parentOptions(g.id)}
					</SelectContent>
				</Select>
			</TableCell>
			<TableCell className="text-right tabular-nums">
				{g.count > 0 ? (
					<button
						type="button"
						className="text-primary hover:underline"
						onClick={() => onOpenArticles(g.id)}
						title={__('View articles in this group', 'doublescale')}
					>
						{g.count}
					</button>
				) : (
					<span className="text-muted-foreground">{g.count}</span>
				)}
			</TableCell>
			<TableCell>
				<input
					type="color"
					value={g.color || '#6d78d8'}
					onChange={(e) => onPatch(g.id, { color: e.target.value })}
					className="h-7 w-9 cursor-pointer rounded border"
					title={__('Colour', 'doublescale')}
				/>
			</TableCell>
			<TableCell>
				<Select
					value={g.visibility}
					onValueChange={(value) => onPatch(g.id, { visibility: value as KbGroup['visibility'] })}
				>
					<SelectTrigger className="h-8 w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{VISIBILITY_OPTIONS.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</TableCell>
			<TableCell className="text-right">
				<Button
					variant="ghost"
					size="sm"
					className="text-destructive hover:text-destructive"
					onClick={() => onRemove(g.id)}
				>
					{__('Delete', 'doublescale')}
				</Button>
			</TableCell>
		</TableRow>
	);
};

const Groups = () => {
	const navigate = useNavigate();
	const [groups, setGroups] = useState<KbGroup[]>([]);
	const [name, setName] = useState('');
	const [parent, setParent] = useState(0);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	const load = async () => {
		setLoading(true);
		try {
			const res = await listGroups();
			setGroups(res.data);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	// Depth-first walk, siblings ordered by (order, name) — mirrors the server's
	// GroupRepository::all() sort — so the table reads as an indented tree.
	const ordered = useMemo(() => {
		const byParent: Record<number, KbGroup[]> = {};
		groups.forEach((g) => {
			(byParent[g.parent] = byParent[g.parent] || []).push(g);
		});
		Object.values(byParent).forEach((list) =>
			list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
		);
		const out: Array<{ group: KbGroup; depth: number }> = [];
		const walk = (parentId: number, depth: number) => {
			(byParent[parentId] || []).forEach((g) => {
				out.push({ group: g, depth });
				walk(g.id, depth + 1);
			});
		};
		walk(0, 0);
		return out;
	}, [groups]);

	// A group cannot be reparented under itself or any of its descendants.
	const descendantsOf = (id: number): Set<number> => {
		const result = new Set<number>();
		const walk = (parentId: number) => {
			groups
				.filter((g) => g.parent === parentId)
				.forEach((g) => {
					result.add(g.id);
					walk(g.id);
				});
		};
		walk(id);
		return result;
	};

	// Indented <SelectItem>s for a parent picker, excluding a branch (self +
	// descendants) when editing an existing group.
	const parentOptions = (excludeId?: number) => {
		const excluded = excludeId
			? new Set<number>([excludeId, ...descendantsOf(excludeId)])
			: new Set<number>();
		return ordered
			.filter(({ group }) => !excluded.has(group.id))
			.map(({ group, depth }) => (
				<SelectItem key={group.id} value={String(group.id)}>
					{'  '.repeat(depth)}
					{group.name}
				</SelectItem>
			));
	};

	const add = async (e?: { preventDefault?: () => void }) => {
		// Wrapped in a <form>, so guard against the native submit reload and also
		// support pressing Enter in the name field (not only clicking "Add").
		e?.preventDefault?.();
		if (!name.trim()) {
			return;
		}
		setError('');
		try {
			await createGroup({ name: name.trim(), parent });
			setName('');
			setParent(0);
			load();
		} catch (e2) {
			setError((e2 as { message?: string })?.message || __('Failed to create group.', 'doublescale'));
		}
	};

	const patch = async (id: number, data: Partial<KbGroup>) => {
		setError('');
		try {
			await updateGroup(id, data);
			load();
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to update group.', 'doublescale'));
		}
	};

	const remove = async (id: number) => {
		setError('');
		try {
			await deleteGroup(id);
			load();
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to delete group.', 'doublescale'));
		}
	};

	// Pointer drag (4px threshold so clicks on inline controls don't start a drag)
	// plus keyboard reordering for accessibility.
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	// `order` is only meaningful among siblings of the same parent (the tree walk
	// sorts each sibling set by (order, name) independently). So a drag only
	// reorders within one parent: cross-parent drops are a no-op and reparenting
	// stays on the Parent select. We resequence the affected siblings to 0..n-1
	// and bulk-persist just those, optimistically updating local state first.
	const onDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			return;
		}

		const activeGroup = groups.find((grp) => grp.id === Number(active.id));
		const overGroup = groups.find((grp) => grp.id === Number(over.id));
		if (!activeGroup || !overGroup || activeGroup.parent !== overGroup.parent) {
			return;
		}

		const siblings = groups
			.filter((grp) => grp.parent === activeGroup.parent)
			.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
		const from = siblings.findIndex((grp) => grp.id === activeGroup.id);
		const to = siblings.findIndex((grp) => grp.id === overGroup.id);
		if (from === -1 || to === -1 || from === to) {
			return;
		}

		const resequenced = arrayMove(siblings, from, to).map((grp, i) => ({ ...grp, order: i }));
		const orderById = new Map(resequenced.map((grp) => [grp.id, grp.order]));
		setGroups((prev) =>
			prev.map((grp) =>
				orderById.has(grp.id) ? { ...grp, order: orderById.get(grp.id) ?? grp.order } : grp
			)
		);

		setError('');
		try {
			await reorderGroups(resequenced.map((grp) => ({ id: grp.id, order: grp.order })));
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to reorder groups.', 'doublescale'));
			load(); // Reconcile to server truth, reverting the optimistic move.
		}
	};

	return (
		<div className="p-6 space-y-4 max-w-4xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{__('Knowledge Base groups', 'doublescale')}</h1>
				<Button variant="ghost" size="sm" onClick={() => navigate(getToLink('knowledgebase'))}>
					← {__('Back to articles', 'doublescale')}
				</Button>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Card className="p-4">
				<form className="flex flex-wrap items-center gap-2" onSubmit={add}>
					<Input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={__('New group name', 'doublescale')}
						className="flex-1 min-w-48"
					/>
					<Select value={String(parent)} onValueChange={(v) => setParent(Number(v))}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder={__('Top level', 'doublescale')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={TOP_LEVEL}>{__('— Top level —', 'doublescale')}</SelectItem>
							{parentOptions()}
						</SelectContent>
					</Select>
					<Button type="submit" disabled={!name.trim()}>
						{__('Add', 'doublescale')}
					</Button>
				</form>
			</Card>

			<p className="text-sm text-muted-foreground">
				{__('Drag the handle to reorder groups within the same parent.', 'doublescale')}
			</p>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8" />
							<TableHead>{__('Name', 'doublescale')}</TableHead>
							<TableHead>{__('Parent', 'doublescale')}</TableHead>
							<TableHead className="text-right">{__('Articles', 'doublescale')}</TableHead>
							<TableHead>{__('Colour', 'doublescale')}</TableHead>
							<TableHead>{__('Visibility', 'doublescale')}</TableHead>
							<TableHead className="w-px" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</TableCell>
							</TableRow>
						) : ordered.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center text-muted-foreground">
									{__('No groups yet.', 'doublescale')}
								</TableCell>
							</TableRow>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								modifiers={[restrictToVerticalAxis]}
								onDragEnd={onDragEnd}
							>
								<SortableContext
									items={ordered.map(({ group: g }) => g.id)}
									strategy={verticalListSortingStrategy}
								>
									{ordered.map(({ group: g, depth }) => (
										<SortableGroupRow
											key={g.id}
											group={g}
											depth={depth}
											parentOptions={parentOptions}
											onPatch={patch}
											onRemove={remove}
											onOpenArticles={(groupId) =>
												navigate(getToLink(`knowledgebase/group/${groupId}`))
											}
										/>
									))}
								</SortableContext>
							</DndContext>
						)}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
};

export default Groups;
