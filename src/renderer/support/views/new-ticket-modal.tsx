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

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
	AttachmentUploader,
	toPendingAttachment,
	removePendingByHash,
	type PendingAttachment,
} from '@/components/support';
import {
	CustomDialogHeader,
	GradientTicketsIcon,
} from '@doublescale/components';
import { cn } from '@/lib/utils';

import {
	PortalNewTicketCustomFieldsBlock,
	preparePortalNewTicketCustomData,
} from '@doublescale-pro/support-portal-custom-fields';

import {
	createPortalTicket,
	uploadPortalAttachmentTemp,
	usePortalMailboxes,
} from '../api';
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

const PRIORITY_SWATCH: Record<TicketPriority, string> = {
	low: 'bg-[#16A34A]',
	normal: 'bg-[#0D9DFC]',
	high: 'bg-[#CB5301]',
	urgent: 'bg-[#DC2626]',
};

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
	const [uploading, setUploading] = useState(false);
	const [pendingAttachments, setPendingAttachments] = useState<
		PendingAttachment[]
	>([]);

	const handleAttachmentSelect = async (file: File) => {
		setUploading(true);
		setError(null);
		try {
			const result = await uploadPortalAttachmentTemp(
				file,
				pendingAttachments.length
			);
			setPendingAttachments((prev) => [
				...prev,
				toPendingAttachment(result, file),
			]);
		} catch (e) {
			setError(
				e instanceof Error
					? e.message
					: __('Upload failed.', 'doublescale')
			);
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = async () => {
		if (!title.trim() || !htmlEditorHasMeaningfulContent(content)) {
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
			const attachmentHashes = pendingAttachments.map((a) => a.file_hash);
			const ticket = await createPortalTicket({
				title: title.trim(),
				content,
				mailbox_id: mailboxId,
				priority,
				attachment_hashes:
					attachmentHashes.length > 0 ? attachmentHashes : undefined,
				custom_data:
					Object.keys(customDataPayload).length > 0
						? customDataPayload
						: undefined,
			});
			onCreated(ticket);
		} catch (e) {
			const msg =
				e instanceof Error ? e.message : __('Submission failed.', 'doublescale');
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	// Hide the picker when the portal is locked to one mailbox (box_id) or when
	// only one mailbox exists - neither case gives the user a real choice.
	const showMailboxSelect = !boxId && mailboxes.data.length > 1;

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={cn(
					'z-[150200] !flex !flex-col bg-white',
					'mx-1 w-[calc(100%-2rem)] max-w-5xl max-h-[calc(100dvh-2rem)]',
					'gap-0 overflow-hidden rounded-2xl p-0 sm:mx-auto sm:w-full'
				)}
				overlayClassName="bg-black/40 backdrop-blur-sm"
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
						<div className="space-y-4 rounded-lg border border-border bg-[#F7F8FA] p-4 sm:p-5">
							<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
								<div className="min-w-0 space-y-2">
									<Label
										htmlFor="doublescale-portal-title"
										className="text-sm font-medium text-foreground"
									>
										{__('Title', 'doublescale')}
										<span className="text-destructive"> *</span>
									</Label>
									<Input
										id="doublescale-portal-title"
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder={__('Title', 'doublescale')}
										className="bg-white"
									/>
								</div>

								<div className="min-w-0 space-y-2">
									<p className="m-0 text-sm font-medium text-foreground">
										{__('Priority', 'doublescale')}
										<span className="text-destructive"> *</span>
									</p>
									<div className="flex flex-wrap gap-2">
										{TICKET_PRIORITIES.map((p) => {
											const selected = priority === p;
											return (
												<button
													key={p}
													type="button"
													onClick={() => setPriority(p)}
													className={`inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition ${
														selected
															? 'border-primary text-primary ring-1 ring-primary'
															: 'border-border text-foreground hover:border-primary/40'
													}`}
												>
													<span
														className={`h-3.5 w-3.5 shrink-0 rounded-sm ${PRIORITY_SWATCH[p]}`}
														aria-hidden
													/>
													{PRIORITY_LABELS[p]}
												</button>
											);
										})}
									</div>
								</div>
							</div>

							{showMailboxSelect && (
								<div className="min-w-0 space-y-2">
									<Label
										htmlFor="doublescale-portal-mailbox"
										className="text-sm font-medium text-foreground"
									>
										{__('Department', 'doublescale')}
									</Label>
									<Select
										value={
											mailboxId === undefined
												? 'auto'
												: String(mailboxId)
										}
										onValueChange={(value) =>
											setMailboxId(
												value === 'auto'
													? undefined
													: Number(value)
											)
										}
									>
										<SelectTrigger
											id="doublescale-portal-mailbox"
											className="h-10 w-full rounded-lg bg-white"
										>
											<SelectValue
												placeholder={__(
													'Auto-select',
													'doublescale'
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="auto">
												{__('Auto-select', 'doublescale')}
											</SelectItem>
											{mailboxes.data.map((m) => (
												<SelectItem
													key={m.id}
													value={String(m.id)}
												>
													{m.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

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
									className="m-0 mb-1.5 block text-sm font-medium text-foreground"
								>
									{__('Opening message', 'doublescale')}
									<span className="text-destructive"> *</span>
								</label>
								<div className="overflow-hidden rounded-lg [&_.editor-inner]:min-h-[140px] [&_.editor-input]:min-h-[140px]">
									<SupportRichText
										message={content}
										onChange={setContent}
										placeholder={__(
											'Tell us what we can help with…',
											'doublescale'
										)}
									/>
								</div>
								<AttachmentUploader
									pending={pendingAttachments}
									uploading={uploading}
									disabled={submitting}
									maxFileCount={
										portalConfig?.attachment_limits?.max_file_count
									}
									maxFileSizeBytes={
										portalConfig?.attachment_limits
											?.max_file_size_bytes
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
								<div className="rounded border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
									{error}
								</div>
							)}
						</div>
					</div>

					<DialogFooter className="shrink-0 flex-row justify-end gap-3 bg-white px-4 py-4 sm:space-x-0 sm:px-6">
						<Button
							type="button"
							variant="secondaryDeepBlue"
							onClick={onClose}
							disabled={submitting}
							className="rounded-lg"
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={submitting}
							className="rounded-lg bg-[#2D3282] px-4 hover:bg-[#2D3282]/90"
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
