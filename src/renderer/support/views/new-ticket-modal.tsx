/**
 * Portal: new ticket composer modal.
 *
 * Pops over the host page. Customer email is implicit (server reads
 * `wp_get_current_user()->user_email`), so we only ask for title +
 * mailbox + content. If only one mailbox exists, hide the selector and
 * let the server's default selection win.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { X, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
	PortalNewTicketCustomFieldsBlock,
	preparePortalNewTicketCustomData,
} from '@doublescale-pro/support-portal-custom-fields';

import { createPortalTicket, usePortalMailboxes } from '../api';
import {
	PRIORITY_LABELS,
	TICKET_PRIORITIES,
	type TicketPriority,
} from '@/constants/support';
import type { PortalConfig, PortalTicket } from '../types';
import type { SupportCustomFieldDefinition } from '@/types/support';

const portalConfig = window.doublescale_support_portal_config as
	| PortalConfig
	| undefined;

interface Props {
	onClose: () => void;
	onCreated: (ticket: PortalTicket) => void;
	// When the portal is scoped to one mailbox via the shortcode's `box_id`,
	// new tickets are locked to it: the department picker is hidden and this
	// id is sent as `mailbox_id`.
	boxId?: number;
}

const NewTicketModal = ({ onClose, onCreated, boxId }: Props) => {
	const mailboxes = usePortalMailboxes();
	const [customFieldDefs, setCustomFieldDefs] = useState<
		SupportCustomFieldDefinition[]
	>([]);
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [priority, setPriority] = useState<TicketPriority>('normal');
	const [customData, setCustomData] = useState<Record<string, unknown>>({});
	const [customFieldsErrors, setCustomFieldsErrors] = useState<
		Record<string, string>
	>({});
	// Default to the shortcode-scoped mailbox when present so the locked portal
	// routes the ticket there; otherwise let the customer choose (or the server
	// auto-select).
	const [mailboxId, setMailboxId] = useState<number | undefined>(boxId);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!title.trim() || !content.trim()) {
			setError(__('Please fill in both title and message.', 'doublescale'));
			return;
		}

		const { payload: customDataPayload, errors: customFieldValidationErrors } =
			preparePortalNewTicketCustomData(
				'portal',
				customFieldDefs,
				customData,
				{
					ticket_title: title,
					ticket_content: content,
					ticket_priority: priority,
				}
			);
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
		setError(null);
		try {
			const ticket = await createPortalTicket({
				title: title.trim(),
				content: content.trim(),
				mailbox_id: mailboxId,
				priority,
				custom_data:
					Object.keys(customDataPayload).length > 0
						? customDataPayload
						: undefined,
			});
			onCreated(ticket);
		} catch (e) {
			const msg = e instanceof Error ? e.message : __('Submission failed.', 'doublescale');
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	// Hide the picker when the portal is locked to one mailbox (box_id) or when
	// only one mailbox exists - neither case gives the user a real choice.
	const showMailboxSelect = !boxId && mailboxes.data.length > 1;

	return (
		<div
			className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="doublescale-portal-new-ticket-title"
		>
			<div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
				<header className="mb-4 flex items-center justify-between">
					<h3
						id="doublescale-portal-new-ticket-title"
						className="m-0 text-lg font-semibold"
					>
						{__('Open a new ticket', 'doublescale')}
					</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label={__('Close', 'doublescale')}
						className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<X width={18} height={18} />
					</button>
				</header>

				<div className="space-y-4">
					<div>
						<label
							htmlFor="doublescale-portal-title"
							className="m-0 mb-1 block text-sm font-medium"
						>
							{__('Subject', 'doublescale')}
						</label>
						<input
							id="doublescale-portal-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							placeholder={__(
								'Briefly describe your issue',
								'doublescale'
							)}
						/>
					</div>

					{showMailboxSelect && (
						<div>
							<label
								htmlFor="doublescale-portal-mailbox"
								className="m-0 mb-1 block text-sm font-medium"
							>
								{__('Department', 'doublescale')}
							</label>
							<select
								id="doublescale-portal-mailbox"
								value={mailboxId ?? ''}
								onChange={(e) =>
									setMailboxId(
										e.target.value
											? Number(e.target.value)
											: undefined
									)
								}
								className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							>
								<option value="">
									{__('Auto-select', 'doublescale')}
								</option>
								{mailboxes.data.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name}
									</option>
								))}
							</select>
						</div>
					)}

					<div>
						<label
							htmlFor="doublescale-portal-priority"
							className="m-0 mb-1 block text-sm font-medium"
						>
							{__('Priority', 'doublescale')}
						</label>
						<select
							id="doublescale-portal-priority"
							value={priority}
							onChange={(e) =>
								setPriority(e.target.value as TicketPriority)
							}
							className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						>
							{TICKET_PRIORITIES.map((p) => (
								<option key={p} value={p}>
									{PRIORITY_LABELS[p]}
								</option>
							))}
						</select>
					</div>

					{portalConfig?.custom_fields_enabled && (
						<PortalNewTicketCustomFieldsBlock
							scope="portal"
							context={{
								title,
								content,
								priority,
							}}
							customData={customData}
							onCustomDataChange={setCustomData}
							errors={customFieldsErrors}
							onErrorsChange={setCustomFieldsErrors}
							onDefinitionsChange={setCustomFieldDefs}
						/>
					)}

					<div>
						<label
							htmlFor="doublescale-portal-content"
							className="m-0 mb-1 block text-sm font-medium"
						>
							{__('Message', 'doublescale')}
						</label>
						<textarea
							id="doublescale-portal-content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={6}
							className="block w-full rounded-md border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							placeholder={__(
								'Tell us what we can help with…',
								'doublescale'
							)}
						/>
					</div>

					{error && (
						<div className="rounded border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
							{error}
						</div>
					)}
				</div>

				<footer className="mt-6 flex justify-end gap-2">
					<Button variant="outline" onClick={onClose} disabled={submitting}>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button onClick={handleSubmit} disabled={submitting}>
						<Send width={14} height={14} className="mr-1" />
						{submitting
							? __('Submitting…', 'doublescale')
							: __('Submit ticket', 'doublescale')}
					</Button>
				</footer>
			</div>
		</div>
	);
};

export default NewTicketModal;
