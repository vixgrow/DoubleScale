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
import { X, Search } from 'lucide-react';

import { CustomDialogHeader, GradientTicketsIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import {
	PRIORITY_LABELS,
	TICKET_PRIORITIES,
	type TicketPriority,
} from '@/constants/support';
import { cn } from '@/lib/utils';
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

const PRIORITY_TOGGLE_STYLES: Record<
	TicketPriority,
	{ dot: string; active: string }
> = {
	low: {
		dot: 'bg-[#16A34A]',
		active: 'border-[#16A34A] bg-[#16A34A]/5 ring-1 ring-[#16A34A]/30',
	},
	normal: {
		dot: 'bg-[#0D9DFC]',
		active: 'border-[#0D9DFC] bg-[#0D9DFC]/5 ring-1 ring-[#0D9DFC]/30',
	},
	high: {
		dot: 'bg-[#CB5301]',
		active: 'border-[#CB5301] bg-[#CB5301]/5 ring-1 ring-[#CB5301]/30',
	},
	urgent: {
		dot: 'bg-red-600',
		active: 'border-red-600 bg-red-50 ring-1 ring-red-600/30',
	},
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

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<ContactHit[]>([]);
	const [searching, setSearching] = useState(false);
	const [picked, setPicked] = useState<ContactHit | null>(null);
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearNewCustomerFields = () => {
		setEmail('');
		setFirstName('');
		setLastName('');
	};

	const clearPickedContact = () => {
		setPicked(null);
		setQuery('');
		setResults([]);
	};

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

	useEffect(() => {
		if (picked) {
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
	}, [query, picked, runSearch]);

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

	const handleCreateTicket = async () => {
		if (submitting) {
			return;
		}
		setError(null);

		if (!title.trim() || !htmlEditorHasMeaningfulContent(content)) {
			setError(
				__('Title and opening message are required.', 'doublescale')
			);
			return;
		}

		const hasContact = Boolean(picked);
		const hasEmail = Boolean(email.trim());
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
					? { contact_id: picked!.id }
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
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={cn(
					'z-[150200] !flex !flex-col bg-white',
					'mx-1 w-[calc(100%-2rem)] max-w-4xl max-h-[calc(100dvh-2rem)]',
					'gap-0 overflow-hidden rounded-2xl p-0 sm:mx-auto sm:w-full',
					'max-sm:!top-4 max-sm:!translate-x-[-50%] max-sm:!translate-y-0'
				)}
			>
				<DialogHeader className="shrink-0 space-y-0 bg-white px-4 pt-4 text-left sm:px-6 sm:pt-6">
					<DialogTitle className="text-left">
						<CustomDialogHeader
							title={__('Create New Ticket', 'doublescale')}
							subtitle={__(
								'Provide a brief summary of the issue. Be specific so your team can quickly understand and prioritize it.',
								'doublescale'
							)}
							icon={<GradientTicketsIcon width={20} height={20} />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-6">
						<div className="space-y-6 rounded-lg border border-border bg-[#F7F8FA] p-4 sm:p-6">
						{mailboxes.length === 0 && (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
								{__(
									'Add a support mailbox before opening tickets.',
									'doublescale'
								)}
							</div>
						)}

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="min-w-0 space-y-2">
								<Label
									htmlFor="ds-new-ticket-title"
									className="text-base font-normal text-foreground"
								>
									{__('Title', 'doublescale')}{' '}
									<span className="text-destructive">*</span>
								</Label>
								<Input
									id="ds-new-ticket-title"

									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder={__('Title', 'doublescale')}
									autoFocus
								/>
							</div>

							<div className="min-w-0 space-y-2">
								<Label
									htmlFor="ds-new-ticket-mailbox"
									className="text-base font-normal text-foreground"
								>
									{__('Mailbox', 'doublescale')}{' '}
									<span className="text-destructive">*</span>
								</Label>
								<Select
									value={
										mailboxId === ''
											? undefined
											: String(mailboxId)
									}
									onValueChange={(v) =>
										setMailboxId(Number(v))
									}
								>
									<SelectTrigger
										id="ds-new-ticket-mailbox"
										className="h-10 w-full rounded-lg bg-white"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{mailboxes.map((m) => (
											<SelectItem
												key={m.id}
												value={String(m.id)}
											>
												{m.name || m.slug}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="min-w-0 space-y-2">
								<Label
									htmlFor="ds-new-ticket-assignee"
									className="text-base font-normal text-foreground"
								>
									{__('Assignee', 'doublescale')}{' '}
									<span className="text-destructive">*</span>
								</Label>
								<Select
									value={
										agentUserId === ''
											? 'unassigned'
											: String(agentUserId)
									}
									onValueChange={(v) =>
										setAgentUserId(
											v === 'unassigned'
												? ''
												: Number(v)
										)
									}
								>
									<SelectTrigger
										id="ds-new-ticket-assignee"

									>
										<SelectValue
											placeholder={__(
												'— Unassigned —',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unassigned">
											{__('— Unassigned —', 'doublescale')}
										</SelectItem>
										{assignableAgents.map((agent) => (
											<SelectItem
												key={agent.id}
												value={String(agent.id)}
											>
												{agent.display_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="min-w-0 space-y-2">
								<Label className="text-base font-normal text-foreground">
									{__('Priority', 'doublescale')}{' '}
									<span className="text-destructive">*</span>
								</Label>
								<div className="grid grid-cols-4 gap-2">
									{TICKET_PRIORITIES.map((p) => {
										const style =
											PRIORITY_TOGGLE_STYLES[p];
										const isActive = priority === p;
										return (
											<button
												key={p}
												type="button"
												onClick={() =>
													setPriority(p)
												}
												className={cn(
													'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-1 text-sm font-medium text-foreground transition-colors',
													isActive && style.active
												)}
											>
												<span
													className={cn(
														'h-4 w-4 shrink-0 rounded-sm',
														style.dot
													)}
													aria-hidden="true"
												/>
												{PRIORITY_LABELS[p]}
											</button>
										);
									})}
								</div>
							</div>
						</div>

						<div className="space-y-4 rounded-md border border-border bg-[#F5F5F5] p-4">
							<div className="space-y-2">
								<Label className="text-base font-normal text-foreground">
									{__('Customer', 'doublescale')}{' '}
									<span className="text-destructive">*</span>
								</Label>

								{picked ? (
									<div className="flex items-center justify-between !rounded-lg border !border-border bg-white px-3 py-2">
										<span className="text-sm text-foreground">
											{contactLabel(picked)}
										</span>
										<button
											type="button"
											className="text-muted-foreground hover:text-foreground"
											onClick={clearPickedContact}
											aria-label={__(
												'Clear',
												'doublescale'
											)}
										>
											<X width={16} height={16} />
										</button>
									</div>
								) : (
									<div className="relative">
										<Search
											width={16}
											height={16}
											className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											type="text"
											className="h-10 w-full !rounded-lg !border !border-border bg-white !pl-10 pr-3 shadow-none"
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
											<div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
												{searching && (
													<div className="px-3 py-2 text-sm text-muted-foreground">
														{__(
															'Searching…',
															'doublescale'
														)}
													</div>
												)}
												{!searching &&
													results.length === 0 && (
														<div className="px-3 py-2 text-sm text-muted-foreground">
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
														className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
														onClick={() => {
															setPicked(c);
															setResults([]);
															clearNewCustomerFields();
														}}
													>
														{contactLabel(c)}
													</button>
												))}
											</div>
										)}
									</div>
								)}
							</div>

							<p className="text-center text-sm font-medium text-[#CB5301]">
								{__('Or adding New Customer', 'doublescale')}
							</p>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								<div className="space-y-2">
									<Label className="text-base font-normal text-foreground">
										{__('First Name', 'doublescale')}{' '}
										<span className="text-destructive">
											*
										</span>
									</Label>
									<Input

										value={firstName}
										disabled={Boolean(picked)}
										onChange={(e) => {
											clearPickedContact();
											setFirstName(e.target.value);
										}}
										placeholder={__(
											'First Name',
											'doublescale'
										)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-base font-normal text-foreground">
										{__('Last Name', 'doublescale')}{' '}
										<span className="text-destructive">
											*
										</span>
									</Label>
									<Input

										value={lastName}
										disabled={Boolean(picked)}
										onChange={(e) => {
											clearPickedContact();
											setLastName(e.target.value);
										}}
										placeholder={__(
											'Last Name',
											'doublescale'
										)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-base font-normal text-foreground">
										{__('Email', 'doublescale')}{' '}
										<span className="text-destructive">
											*
										</span>
									</Label>
									<Input
										type="email"
										className="h-10 !rounded-lg !border-border !bg-white"
										value={email}
										disabled={Boolean(picked)}
										onChange={(e) => {
											clearPickedContact();
											setEmail(e.target.value);
										}}
										placeholder={__(
											'eg: customer@example.com',
											'doublescale'
										)}
									/>
								</div>
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

						<div className="space-y-2">
							<Label
								htmlFor="ds-new-ticket-content"
								className="text-base font-normal text-foreground"
							>
								{__('Opening message', 'doublescale')}{' '}
								<span className="text-destructive">*</span>
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
								maxFileCount={
									attachmentLimits?.max_file_count
								}
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
							<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						</div>
					</div>

					<DialogFooter className="shrink-0 flex-row justify-end gap-3  bg-white px-4 py-4 sm:space-x-0 sm:px-6">
						<Button
							type="button"
							variant="outline"

							onClick={onClose}
							disabled={submitting}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="button"
							variant='default'
							disabled={submitting || mailboxes.length === 0}
							onClick={handleCreateTicket}
						>
							{submitting
								? __('Creating…', 'doublescale')
								: __('Create Ticket', 'doublescale')}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default NewTicketModal;
