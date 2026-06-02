/**
 * "Open a ticket" modal — used by agents to file a ticket on behalf of a
 * customer from the admin inbox. Mirrors the public portal submission shape
 * (POST /support/tickets), wrapping it in a small dialog UI.
 *
 * Why an agent-side form even though the portal exists: agents often take a
 * support request over phone/Slack/in-person, and need to file the ticket
 * themselves so it appears in the conversation timeline.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createTicket, useAssignableAgents } from '@/hooks/support';
import { TICKET_PRIORITIES, type TicketPriority } from '@/constants/support';
import type { Mailbox } from '@/types/support';

interface Props {
	mailboxes: Mailbox[];
	onClose: () => void;
	onCreated: (ticketId: number) => void;
}

const NewTicketModal: React.FC<Props> = ({ mailboxes, onClose, onCreated }) => {
	const defaultMailbox =
		mailboxes.find((m) => m.is_default) ?? mailboxes[0] ?? null;
	const [title, setTitle] = useState('');
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [content, setContent] = useState('');
	const [mailboxId, setMailboxId] = useState<number | ''>(
		defaultMailbox?.id ?? ''
	);
	const [priority, setPriority] = useState<TicketPriority>('normal');
	const [agentUserId, setAgentUserId] = useState<number | ''>('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { data: assignableAgents } = useAssignableAgents();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!title.trim() || !email.trim() || !content.trim()) {
			setError(__('Title, customer email, and content are required.', 'doublescale'));
			return;
		}

		setSubmitting(true);
		try {
			const ticket = await createTicket({
				title: title.trim(),
				email: email.trim(),
				first_name: firstName.trim() || undefined,
				last_name: lastName.trim() || undefined,
				content,
				mailbox_id: mailboxId === '' ? undefined : Number(mailboxId),
				priority,
				agent_user_id:
					agentUserId === '' ? undefined : Number(agentUserId),
			});
			onCreated(ticket.id);
		} catch (err) {
			const msg = (err as { message?: string })?.message ?? 'Create failed';
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

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div className="sm:col-span-1">
							<label
								htmlFor="ds-new-ticket-first"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('First name', 'doublescale')}
							</label>
							<input
								id="ds-new-ticket-first"
								type="text"
								className="w-full border rounded px-3 py-2 text-sm"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
							/>
						</div>
						<div className="sm:col-span-1">
							<label
								htmlFor="ds-new-ticket-last"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Last name', 'doublescale')}
							</label>
							<input
								id="ds-new-ticket-last"
								type="text"
								className="w-full border rounded px-3 py-2 text-sm"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
							/>
						</div>
						<div className="sm:col-span-1">
							<label
								htmlFor="ds-new-ticket-email"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Customer email', 'doublescale')}{' '}
								<span className="text-red-500">*</span>
							</label>
							<input
								id="ds-new-ticket-email"
								type="email"
								className="w-full border rounded px-3 py-2 text-sm"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="customer@example.com"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
										e.target.value === '' ? '' : Number(e.target.value)
									)
								}
							>
								<option value="">
									{__('— None —', 'doublescale')}
								</option>
								{mailboxes.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name || m.slug}
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
									setPriority(e.target.value as TicketPriority)
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
							htmlFor="ds-new-ticket-agent"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{__('Assign to', 'doublescale')}
						</label>
						<select
							id="ds-new-ticket-agent"
							className="w-full border rounded px-3 py-2 text-sm"
							value={agentUserId}
							onChange={(e) =>
								setAgentUserId(
									e.target.value === '' ? '' : Number(e.target.value)
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
