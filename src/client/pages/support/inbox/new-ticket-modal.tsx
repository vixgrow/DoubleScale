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
 * (`/doublescale/v1/contacts?keywords=`). Picking a contact binds it by
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
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { X, Search, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import SupportRichText from '@/components/editor/support-rich-text';
import { htmlEditorHasMeaningfulContent } from '@/components/editor/utils';
import {
	createTicket,
	uploadAttachmentTemp,
	useAssignableAgents,
	useAttachmentLimits,
} from '@/hooks/support';
import {
	AttachmentUploader,
	toPendingAttachment,
	removePendingByHash,
	type PendingAttachment,
} from '@/components/support';
import { TICKET_PRIORITIES, type TicketPriority } from '@/constants/support';
import type { Mailbox, SupportCustomFieldDefinition } from '@/types/support';

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
	const [customFieldDefs, setCustomFieldDefs] = useState<
		SupportCustomFieldDefinition[]
	>([]);
	const [customData, setCustomData] = useState<Record<string, unknown>>({});
	const [customFieldsErrors, setCustomFieldsErrors] = useState<
		Record<string, string>
	>({});

	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [mailboxId, setMailboxId] = useState<number | ''>(
		defaultMailbox?.id ?? ''
	);
	const [priority, setPriority] = useState<TicketPriority>('normal');
	const [agentUserId, setAgentUserId] = useState<number | ''>('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [pendingAttachments, setPendingAttachments] = useState<
		PendingAttachment[]
	>([]);
	const { limits: attachmentLimits } = useAttachmentLimits();

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
			path: `/doublescale/v1/contacts?keywords=${encodeURIComponent(
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

	const handleAttachmentSelect = async (file: File) => {
		setUploading(true);
		setError(null);
		try {
			const result = await uploadAttachmentTemp(
				file,
				pendingAttachments.length
			);
			setPendingAttachments((prev) => [
				...prev,
				toPendingAttachment(result, file),
			]);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: __('Upload failed.', 'doublescale')
			);
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!title.trim() || !htmlEditorHasMeaningfulContent(content)) {
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

		const { payload: customDataPayload, errors: customFieldValidationErrors } =
			applyFilters(
				'doublescale_support_prepare_new_ticket_custom_data',
				{ payload: {}, errors: {} },
				{
					scope: 'admin' as const,
					form: {
						title,
						content,
						priority,
					},
					customData,
					definitions: customFieldDefs,
				}
			) as {
				payload: Record<string, unknown>;
				errors: Record<string, string>;
			};
		if (Object.keys(customFieldValidationErrors).length > 0) {
			setCustomFieldsErrors(customFieldValidationErrors);
			setError(
				__(
					'Please fill in all required custom fields.',
					'doublescale'
				)
			);
			return;
		}

		setSubmitting(true);
		try {
			const attachmentHashes = pendingAttachments.map(
				(a) => a.file_hash
			);
			const ticket = await createTicket({
				title: title.trim(),
				content,
				mailbox_id: mailboxId === '' ? undefined : Number(mailboxId),
				priority,
				agent_user_id:
					agentUserId === '' ? undefined : Number(agentUserId),
				attachment_hashes:
					attachmentHashes.length > 0 ? attachmentHashes : undefined,
				custom_data:
					Object.keys(customDataPayload).length > 0
						? customDataPayload
						: undefined,
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
					{mailboxes.length === 0 && (
						<div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
							{__(
								'Add a support mailbox before opening tickets.',
								'doublescale'
							)}
						</div>
					)}

					<div>
						<Label
							htmlFor="ds-new-ticket-title"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{__('Title', 'doublescale')}{' '}
							<span className="text-red-500">*</span>
						</Label>
						<Input
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
							<Label className="block text-sm font-medium text-gray-700">
								{__('Customer', 'doublescale')}{' '}
								<span className="text-red-500">*</span>
							</Label>
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
									<Input
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
								<Input
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
								<Input
									type="text"
									className="w-full border rounded px-3 py-2 text-sm"
									value={lastName}
									onChange={(e) =>
										setLastName(e.target.value)
									}
									placeholder={__('Last name', 'doublescale')}
								/>
								<Input
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
							<Label
								htmlFor="ds-new-ticket-mailbox"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Mailbox', 'doublescale')}
							</Label>
							<Select
								value={mailboxId === '' ? undefined : String(mailboxId)}
								onValueChange={(v) => setMailboxId(Number(v))}
							>
								<SelectTrigger id="ds-new-ticket-mailbox" className="w-full border rounded px-3 py-2 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{/* Mailbox is mandatory (Q4) — no "None" option. */}
									{mailboxes.map((m) => (
										<SelectItem key={m.id} value={String(m.id)}>
											{m.name || m.slug}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label
								htmlFor="ds-new-ticket-assignee"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Assignee', 'doublescale')}
							</Label>
							<Select
								value={agentUserId === '' ? 'unassigned' : String(agentUserId)}
								onValueChange={(v) =>
									setAgentUserId(
										v === 'unassigned'
											? ''
											: Number(v)
									)
								}
							>
								<SelectTrigger id="ds-new-ticket-assignee" className="w-full border rounded px-3 py-2 text-sm">
									<SelectValue placeholder={__('— Unassigned —', 'doublescale')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unassigned">
										{__('— Unassigned —', 'doublescale')}
									</SelectItem>
									{assignableAgents.map((agent) => (
										<SelectItem key={agent.id} value={String(agent.id)}>
											{agent.display_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label
								htmlFor="ds-new-ticket-priority"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{__('Priority', 'doublescale')}
							</Label>
							<Select
								value={priority}
								onValueChange={(v) =>
									setPriority(v as TicketPriority)
								}
							>
								<SelectTrigger id="ds-new-ticket-priority" className="w-full border rounded px-3 py-2 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TICKET_PRIORITIES.map((p) => (
										<SelectItem key={p} value={p}>
											{p}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{
						applyFilters(
							'doublescale_support_new_ticket_custom_fields',
							null,
							{
								scope: 'admin',
								form: {
									title,
									content,
									priority,
								},
								customData,
								onCustomDataChange: setCustomData,
								errors: customFieldsErrors,
								onErrorsChange: setCustomFieldsErrors,
								onDefinitionsChange: setCustomFieldDefs,
							}
						) as React.ReactNode
					}

					<div>
						<Label
							htmlFor="ds-new-ticket-content"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{__('Opening message', 'doublescale')}{' '}
							<span className="text-red-500">*</span>
						</Label>
						<SupportRichText
							message={content}
							onChange={setContent}
							placeholder={__(
								'What is the customer reporting?',
								'doublescale'
							)}
						/>
						<AttachmentUploader
							pending={pendingAttachments}
							uploading={uploading}
							disabled={submitting}
							maxFileCount={attachmentLimits?.max_file_count}
							maxFileSizeBytes={
								attachmentLimits?.max_file_size_bytes
							}
							onValidationError={setError}
							onSelect={handleAttachmentSelect}
							onRemove={(hash) =>
								setPendingAttachments((prev) =>
									removePendingByHash(prev, hash)
								)
							}
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
						<Button
							type="submit"
							disabled={submitting || mailboxes.length === 0}
						>
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
