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

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{__('Name', 'doublescale')}</TableHead>
							<TableHead>{__('Parent', 'doublescale')}</TableHead>
							<TableHead className="text-right">{__('Articles', 'doublescale')}</TableHead>
							<TableHead>{__('Colour', 'doublescale')}</TableHead>
							<TableHead>{__('Visibility', 'doublescale')}</TableHead>
							<TableHead className="w-20 text-right">{__('Order', 'doublescale')}</TableHead>
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
							ordered.map(({ group: g, depth }) => (
								<TableRow key={g.id}>
									<TableCell>
										<div style={{ paddingLeft: `${depth * 20}px` }}>
											{/* Uncontrolled + keyed on the value so a successful rename
											    re-seeds the field on the next reload. Commits on blur. */}
											<Input
												key={`name-${g.id}-${g.name}`}
												defaultValue={g.name}
												onBlur={(e) => {
													const v = e.target.value.trim();
													if (v && v !== g.name) {
														patch(g.id, { name: v });
													}
												}}
												className="h-8 font-medium"
											/>
										</div>
									</TableCell>
									<TableCell>
										<Select
											value={String(g.parent)}
											onValueChange={(v) => patch(g.id, { parent: Number(v) })}
										>
											<SelectTrigger className="h-8 w-40">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={TOP_LEVEL}>
													{__('— Top level —', 'doublescale')}
												</SelectItem>
												{parentOptions(g.id)}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell className="text-right tabular-nums text-muted-foreground">
										{g.count}
									</TableCell>
									<TableCell>
										<input
											type="color"
											value={g.color || '#6d78d8'}
											onChange={(e) => patch(g.id, { color: e.target.value })}
											className="h-7 w-9 cursor-pointer rounded border"
											title={__('Colour', 'doublescale')}
										/>
									</TableCell>
									<TableCell>
										<Select
											value={g.visibility}
											onValueChange={(value) =>
												patch(g.id, { visibility: value as KbGroup['visibility'] })
											}
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
										<Input
											key={`order-${g.id}-${g.order}`}
											type="number"
											defaultValue={g.order}
											onBlur={(e) => {
												const v = Number(e.target.value);
												if (!Number.isNaN(v) && v !== g.order) {
													patch(g.id, { order: v });
												}
											}}
											className="h-8 w-16 text-right tabular-nums"
										/>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											className="text-destructive hover:text-destructive"
											onClick={() => remove(g.id)}
										>
											{__('Delete', 'doublescale')}
										</Button>
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

export default Groups;
