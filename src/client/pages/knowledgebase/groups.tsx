/**
 * Knowledge Base — group management (create / edit / delete + colour, order,
 * visibility). Delete is blocked server-side (409) when the group still holds
 * articles; we surface that message.
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, getToLink } from '@doublescale/navigation';

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

	const add = async () => {
		if (!name.trim()) {
			return;
		}
		setError('');
		try {
			await createGroup({ name: name.trim() });
			setName('');
			load();
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to create group.', 'doublescale'));
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
				<button
					type="button"
					className="text-sm text-primary hover:underline"
					onClick={() => navigate(getToLink('knowledgebase'))}
				>
					← {__('Back to articles', 'doublescale')}
				</button>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="flex gap-2">
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={__('New group name', 'doublescale')}
					className="flex-1 rounded-md border px-3 py-2 text-sm"
				/>
				<button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-white" onClick={add}>
					{__('Add', 'doublescale')}
				</button>
			</div>

			{loading && <p className="text-sm text-gray-500">{__('Loading…', 'doublescale')}</p>}

			<ul className="space-y-2">
				{groups.map((g) => (
					<li key={g.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
						<span className="font-medium">{g.name}</span>
						<span className="text-gray-400">
							{/* translators: %d: number of articles. */}
							({g.count})
						</span>
						<input
							type="color"
							value={g.color || '#6d78d8'}
							onChange={(e) => patch(g.id, { color: e.target.value })}
							className="h-7 w-9 rounded border"
							title={__('Colour', 'doublescale')}
						/>
						<select
							value={g.visibility}
							onChange={(e) => patch(g.id, { visibility: e.target.value as KbGroup['visibility'] })}
							className="rounded-md border px-2 py-1"
						>
							{VISIBILITY_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
						<button
							type="button"
							className="ml-auto text-xs text-red-600 hover:underline"
							onClick={() => remove(g.id)}
						>
							{__('Delete', 'doublescale')}
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export default Groups;
