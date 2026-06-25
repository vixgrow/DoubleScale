/**
 * Knowledge Base — group management (create / edit / delete + colour, order,
 * visibility). Delete is blocked server-side (409) when the group still holds
 * articles; we surface that message.
 *
 * Built on the shared design system (`@/components/ui/*`) so it matches the rest
 * of the admin (Inbox, Templates, …) rather than hand-rolled HTML.
 */

import { useEffect, useState } from '@wordpress/element';
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

const Groups = () => {
	const navigate = useNavigate();
	const [groups, setGroups] = useState<KbGroup[]>([]);
	const [name, setName] = useState('');
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

	const add = async (e?: { preventDefault?: () => void }) => {
		// Wrapped in a <form>, so guard against the native submit reload and also
		// support pressing Enter in the name field (not only clicking "Add").
		e?.preventDefault?.();
		if (!name.trim()) {
			return;
		}
		setError('');
		try {
			await createGroup({ name: name.trim() });
			setName('');
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
		<div className="p-6 space-y-4 max-w-3xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{__('Knowledge Base groups', 'doublescale')}</h1>
				<Button variant="ghost" size="sm" onClick={() => navigate(getToLink('knowledgebase'))}>
					← {__('Back to articles', 'doublescale')}
				</Button>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<Card className="p-4">
				<form className="flex gap-2" onSubmit={add}>
					<Input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={__('New group name', 'doublescale')}
						className="flex-1"
					/>
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
							<TableHead className="text-right">{__('Articles', 'doublescale')}</TableHead>
							<TableHead>{__('Colour', 'doublescale')}</TableHead>
							<TableHead>{__('Visibility', 'doublescale')}</TableHead>
							<TableHead className="w-px" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</TableCell>
							</TableRow>
						) : groups.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground">
									{__('No groups yet.', 'doublescale')}
								</TableCell>
							</TableRow>
						) : (
							groups.map((g) => (
								<TableRow key={g.id}>
									<TableCell className="font-medium">{g.name}</TableCell>
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
											<SelectTrigger className="w-40">
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
