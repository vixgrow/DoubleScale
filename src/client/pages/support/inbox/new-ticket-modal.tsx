/**
 * "Open a ticket" modal — used by agents to file a ticket on behalf of a
 * customer from the admin inbox. Mirrors the public portal submission shape
 * (POST /support/tickets), wrapping it in a small dialog UI.
 *
 * Why an agent-side form even though the portal exists: agents often take a
 * support request over phone/Slack/in-person, and need to file the ticket
 * themselves so it appears in the conversation timeline.
 *
 * Customer selection (Q1): a typeahead over existing CRM contacts
 * (`/doublescale/v1/contacts?search=`). Picking a contact binds it by
 * `contact_id` (exact, no dup risk); if the customer is new, the operator
 * switches to "new email" and the backend find_or_creates from email + name.
 */

import React, {
	useState,
	useRef,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { X, Search, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createTicket, useAssignableAgents } from '@/hooks/support';
import { TICKET_PRIORITIES, type TicketPriority } from '@/constants/support';
import type { Mailbox } from '@/types/support';

interface Props {
	mailboxes: Mailbox[];
	onClose: () => void;
	onCreated: (ticketId: number) => void;
}

// Minimal shape of a contact row from /doublescale/v1/contacts.
interface ContactHit {
	id: number;
	email: string;
	first_name: string | null;
	last_name: string | null;
}

const contactLabel = (c: ContactHit): string => {
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name ? `${name} <${c.email}>` : c.email;
};

const NewTicketModal: React.FC<Props> = ({ mailboxes, onClose, onCreated }) => {
	const defaultMailbox =
		mailboxes.find((m) => m.is_default) ?? mailboxes[0] ?? null;
	const { data: assignableAgents } = useAssignableAgents();

	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [mailboxId, setMailboxId] = useState<number | ''>(
		defaultMailbox?.id ?? ''
	);
	const [priority, setPriority] = useState<TicketPriority>('normal');
	const [agentUserId, setAgentUserId] = useState<number | ''>('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// --- Customer selection (Q1) ---------------------------------------------
	// Two mutually-exclusive modes: pick an existing contact (binds contact_id),
	// or enter a new email (+ optional name) for find_or_create.
	const [mode, setMode] = useState<'search' | 'new'>('search');
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<ContactHit[]>([]);
	const [searching, setSearching] = useState(false);
	const [picked, setPicked] = useState<ContactHit | null>(null);
	// New-email branch fields.
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const runSearch = useCallback((term: string) => {
		if (!term.trim()) {
			setResults([]);
			return;
		}
		setSearching(true);
		apiFetch<{ data: ContactHit[] }>({
			path: `/doublescale/v1/contacts?search=${encodeURIComponent(
				term.trim()
			)}&per_page=8`,
		})
			.then((res) => {
				setResults(Array.isArray(res?.data) ? res.data : []);
			})
			.catch(() => {
				setResults([]);
			})
			.finally(() => {
				setSearching(false);
			});
	}, []);

	// Debounced search as the operator types.
	useEffect(() => {
		if (mode !== 'search' || picked) {
			return;
		}
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => runSearch(query), 250);
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [query, mode, picked, runSearch]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!title.trim() || !content.trim()) {
			setError(
				__('Title and opening message are required.', 'doublescale')
			);
			return;
		}

		// Resolve the customer: a picked contact wins; otherwise the new email.
		const hasContact = mode === 'search' && picked;
		const hasEmail = mode === 'new' && email.trim();
		if (!hasContact && !hasEmail) {
			setError(
				__('Select a contact or enter a customer email.', 'doublescale')
			);
			return;
		}

		setSubmitting(true);
		try {
			const ticket = await createTicket({
				title: title.trim(),
				content,
				mailbox_id: mailboxId === '' ? undefined : Number(mailboxId),
				priority,
				agent_user_id:
					agentUserId === '' ? undefined : Number(agentUserId),
				...(hasContact
					? { contact_id: picked.id }
					: {
							email: email.trim(),
							first_name: firstName.trim() || undefined,
							last_name: lastName.trim() || undefined,
						}),
			});
			onCreated(ticket.id);
		} catch (err) {
			const msg =
				(err as { message?: string })?.message ?? 'Create failed';
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-6 py-4 border-b">
					<h2 className="text-lg font-semibold text-gray-900">
						{__('Open a new ticket', 'doublescale')}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
						aria-label={__('Close', 'doublescale')}
					>
						<X width={20} height={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div>
						<label
							htmlFor="ds-new-ticket-title"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{__('Title', 'doublescale')}{' '}
							<span className="text-red-500">*</span>
						</label>
						<input
							id="ds-new-ticket-title"
							type="text"
							className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={__(
								'Short summary of the issue',
								'doublescale'
							)}
							autoFocus
						/>
					</div>

					{/* Customer — contact picker (Q1) */}
					<div>
						<div className="flex items-center justify-between mb-1">
							<label className="block text-sm font-medium text-gray-700">
								{__('Customer', 'doublescale')}{' '}
								<span className="text-red-500">*</span>
							</label>
							<button
								type="button"
								className="text-xs text-blue-600 hover:underline flex items-center gap-1"
								onClick={() => {
									// Toggle between picking an existing contact and
									// entering a brand-new customer email.
									setMode((m) =>
										m === 'search' ? 'new' : 'search'
									);
									setPicked(null);
									setQuery('');
									setResults([]);
								}}
							>
								{mode === 'search' ? (
									<>
										<UserPlus width={12} height={12} />
										{__('New customer', 'doublescale')}
									</>
								) : (
									<>
										<Search width={12} height={12} />
										{__('Search existing', 'doublescale')}
									</>
								)}
							</button>
						</div>

						{mode === 'search' ? (
							picked ? (
								<div className="flex items-center justify-between border rounded px-3 py-2 bg-gray-50">
									<span className="text-sm text-gray-800">
										{contactLabel(picked)}
									</span>
									<button
										type="button"
										className="text-gray-400 hover:text-gray-600"
										onClick={() => setPicked(null)}
										aria-label={__('Clear', 'doublescale')}
									>
										<X width={16} height={16} />
									</button>
								</div>
							) : (
								<div className="relative">
									<input
										type="text"
										className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={query}
										onChange={(e) =>
											setQuery(e.target.value)
										}
										placeholder={__(
											'Search contacts by name or email…',
											'doublescale'
										)}
									/>
									{(searching || results.length > 0) && (
										<div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-56 overflow-y-auto">
											{searching && (
												<div className="px-3 py-2 text-sm text-gray-500">
													{__(
														'Searching…',
														'doublescale'
													)}
												</div>
											)}
											{!searching &&
												results.length === 0 && (
													<div className="px-3 py-2 text-sm text-gray-500">
														{__(
															'No contacts found.',
															'doublescale'
														)}
													</div>
												)}
											{results.map((c) => (
												<button
													key={c.id}
													type="button"
													className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
													onClick={() => {
														setPicked(c);
														setResults([]);
													}}
												>
													{contactLabel(c)}
												</button>
											))}
										</div>
									)}
								</div>
							)
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<input
									type="text"
									className="w-full border rounded px-3 py-2 text-sm"
									value={firstName}
									onChange={(e) =>
										setFirstName(e.target.value)
									}
									placeholder={__(
										'First name',
										'doublescale'
									)}
								/>
								<input
									type="text"
									className="w-full border rounded px-3 py-2 text-sm"
									value={lastName}
									onChange={(e) =>
										setLastName(e.target.value)
									}
									placeholder={__('Last name', 'doublescale')}
								/>
								<input
									type="email"
									className="w-full border rounded px-3 py-2 text-sm"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="customer@example.com"
								/>
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label
								htmlFor="ds-new-ticket-mailbox"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Mailbox', 'doublescale')}
							</label>
							<select
								id="ds-new-ticket-mailbox"
								className="w-full border rounded px-3 py-2 text-sm"
								value={mailboxId}
								onChange={(e) =>
									setMailboxId(
										e.target.value === ''
											? ''
											: Number(e.target.value)
									)
								}
							>
								{/* Mailbox is mandatory (Q4) — no "None" option. */}
								{mailboxes.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name || m.slug}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor="ds-new-ticket-assignee"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Assignee', 'doublescale')}
							</label>
							<select
								id="ds-new-ticket-assignee"
								className="w-full border rounded px-3 py-2 text-sm"
								value={agentUserId}
								onChange={(e) =>
									setAgentUserId(
										e.target.value === ''
											? ''
											: Number(e.target.value)
									)
								}
							>
								<option value="">
									{__('— Unassigned —', 'doublescale')}
								</option>
								{assignableAgents.map((agent) => (
									<option key={agent.id} value={agent.id}>
										{agent.display_name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor="ds-new-ticket-priority"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Priority', 'doublescale')}
							</label>
							<select
								id="ds-new-ticket-priority"
								className="w-full border rounded px-3 py-2 text-sm"
								value={priority}
								onChange={(e) =>
									setPriority(
										e.target.value as TicketPriority
									)
								}
							>
								{TICKET_PRIORITIES.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label
							htmlFor="ds-new-ticket-content"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{__('Opening message', 'doublescale')}{' '}
							<span className="text-red-500">*</span>
						</label>
						<textarea
							id="ds-new-ticket-content"
							className="w-full border rounded px-3 py-2 text-sm min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder={__(
								'What is the customer reporting?',
								'doublescale'
							)}
						/>
					</div>

					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={submitting}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting
								? __('Creating…', 'doublescale')
								: __('Create ticket', 'doublescale')}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default NewTicketModal;
