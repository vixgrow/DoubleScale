/**
 * Modals opened from the inbox bulk-action toolbar.
 * Uses the shared Dialog / Label / Select patterns from the Support module.
 */

import type { FC, ReactNode } from 'react';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import { TagField } from '@doublescale/components';
import type { AgentSummary, Mailbox } from '@/types/support';

const UNASSIGNED_VALUE = '__unassigned__';

interface ModalShellProps {
	title: string;
	description: string;
	onClose: () => void;
	children: ReactNode;
	footer: ReactNode;
	wide?: boolean;
}

const ModalShell: FC<ModalShellProps> = ({
	title,
	description,
	onClose,
	children,
	footer,
	wide = false,
}) => (
	<Dialog
		open
		onOpenChange={(open) => {
			if (!open) {
				onClose();
			}
		}}
	>
		<DialogContent
			className={`rounded-xl bg-white ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
		>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>

			<div className="space-y-4 py-1">{children}</div>

			<DialogFooter className="gap-2 sm:gap-0">{footer}</DialogFooter>
		</DialogContent>
	</Dialog>
);

interface AssignAgentModalProps {
	selectedCount: number;
	agents: AgentSummary[];
	onClose: () => void;
	onSubmit: (agentUserId: number | null) => Promise<void>;
}

export const AssignAgentModal: FC<AssignAgentModalProps> = ({
	selectedCount,
	agents,
	onClose,
	onSubmit,
}) => {
	const [agentValue, setAgentValue] = useState<string>(UNASSIGNED_VALUE);
	const [saving, setSaving] = useState(false);

	const description =
		selectedCount === 1
			? __('Assign the selected ticket to an agent.', 'doublescale')
			: sprintf(
					/* translators: %d: number of selected tickets */
					__(
						'Assign %d selected tickets to an agent.',
						'doublescale'
					),
					selectedCount
			  );

	const handleSubmit = async () => {
		setSaving(true);
		try {
			const agentUserId =
				agentValue === UNASSIGNED_VALUE ? null : Number(agentValue);
			await onSubmit(agentUserId);
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<ModalShell
			title={__('Assign agent', 'doublescale')}
			description={description}
			onClose={onClose}
			footer={
				<>
					<Button
						variant="secondaryDeepBlue"
						className="rounded-lg"
						onClick={onClose}
						disabled={saving}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						className="rounded-lg"
						onClick={handleSubmit}
						disabled={saving}
					>
						{saving ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
								{__('Saving…', 'doublescale')}
							</>
						) : (
							__('Assign', 'doublescale')
						)}
					</Button>
				</>
			}
		>
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					{__('Agent', 'doublescale')}
				</Label>
				<Select value={agentValue} onValueChange={setAgentValue}>
					<SelectTrigger>
						<SelectValue
							placeholder={__('Select agent', 'doublescale')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={UNASSIGNED_VALUE}>
							{__('Unassigned', 'doublescale')}
						</SelectItem>
						{agents.map((agent) => (
							<SelectItem key={agent.id} value={String(agent.id)}>
								{agent.display_name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</ModalShell>
	);
};

interface AssignMailboxModalProps {
	selectedCount: number;
	mailboxes: Mailbox[];
	onClose: () => void;
	onSubmit: (mailboxId: number) => Promise<void>;
}

export const AssignMailboxModal: FC<AssignMailboxModalProps> = ({
	selectedCount,
	mailboxes,
	onClose,
	onSubmit,
}) => {
	const defaultMailbox =
		mailboxes.find((m) => m.is_default)?.id ?? mailboxes[0]?.id;
	const [mailboxValue, setMailboxValue] = useState<string>(
		defaultMailbox ? String(defaultMailbox) : ''
	);
	const [saving, setSaving] = useState(false);

	const description =
		selectedCount === 1
			? __('Move the selected ticket to another mailbox.', 'doublescale')
			: sprintf(
					/* translators: %d: number of selected tickets */
					__(
						'Move %d selected tickets to another mailbox.',
						'doublescale'
					),
					selectedCount
			  );

	const handleSubmit = async () => {
		if (!mailboxValue) {
			return;
		}
		setSaving(true);
		try {
			await onSubmit(Number(mailboxValue));
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<ModalShell
			title={__('Move to mailbox', 'doublescale')}
			description={description}
			onClose={onClose}
			footer={
				<>
					<Button
						variant="secondaryDeepBlue"
						className="rounded-lg"
						onClick={onClose}
						disabled={saving}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						className="rounded-lg"
						onClick={handleSubmit}
						disabled={saving || !mailboxValue}
					>
						{saving ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
								{__('Saving…', 'doublescale')}
							</>
						) : (
							__('Move', 'doublescale')
						)}
					</Button>
				</>
			}
		>
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					{__('Mailbox', 'doublescale')}
				</Label>
				<Select value={mailboxValue} onValueChange={setMailboxValue}>
					<SelectTrigger>
						<SelectValue
							placeholder={__('Select mailbox', 'doublescale')}
						/>
					</SelectTrigger>
					<SelectContent>
						{mailboxes.map((mailbox) => (
							<SelectItem
								key={mailbox.id}
								value={String(mailbox.id)}
							>
								{mailbox.name || mailbox.slug}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</ModalShell>
	);
};

interface AssignTagsModalProps {
	selectedCount: number;
	onClose: () => void;
	onSubmit: (tagIds: number[]) => Promise<void>;
}

export const AssignTagsModal: FC<AssignTagsModalProps> = ({
	selectedCount,
	onClose,
	onSubmit,
}) => {
	const [tagIds, setTagIds] = useState<number[]>([]);
	const [saving, setSaving] = useState(false);

	const description =
		selectedCount === 1
			? __(
					'Add tags to the selected ticket. Existing tags are kept.',
					'doublescale'
			  )
			: sprintf(
					/* translators: %d: number of selected tickets */
					__(
						'Add tags to %d selected tickets. Existing tags are kept.',
						'doublescale'
					),
					selectedCount
			  );

	const handleSubmit = async () => {
		setSaving(true);
		try {
			await onSubmit(tagIds);
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<ModalShell
			title={__('Assign tags', 'doublescale')}
			description={description}
			onClose={onClose}
			footer={
				<>
					<Button
						variant="secondaryDeepBlue"
						className="rounded-lg"
						onClick={onClose}
						disabled={saving}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						className="rounded-lg"
						onClick={handleSubmit}
						disabled={saving}
					>
						{saving ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
								{__('Saving…', 'doublescale')}
							</>
						) : (
							__('Apply tags', 'doublescale')
						)}
					</Button>
				</>
			}
		>
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					{__('Tags', 'doublescale')}
				</Label>
				<TagField value={tagIds} onChange={setTagIds} />
			</div>
		</ModalShell>
	);
};

interface BulkReplyModalProps {
	selectedCount: number;
	onClose: () => void;
	onSubmit: (content: string) => Promise<void>;
}

export const BulkReplyModal: FC<BulkReplyModalProps> = ({
	selectedCount,
	onClose,
	onSubmit,
}) => {
	const [content, setContent] = useState('');
	const [saving, setSaving] = useState(false);

	const description =
		selectedCount === 1
			? __('Send a reply to the selected ticket.', 'doublescale')
			: sprintf(
					/* translators: %d: number of selected tickets */
					__(
						'Send the same reply to %d selected tickets.',
						'doublescale'
					),
					selectedCount
			  );

	const handleSubmit = async () => {
		if (!htmlEditorHasMeaningfulContent(content)) {
			return;
		}
		setSaving(true);
		try {
			await onSubmit(content);
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<ModalShell
			title={__('Reply to tickets', 'doublescale')}
			description={description}
			onClose={onClose}
			wide
			footer={
				<>
					<Button
						variant="secondaryDeepBlue"
						className="rounded-lg"
						onClick={onClose}
						disabled={saving}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						className="rounded-lg"
						onClick={handleSubmit}
						disabled={
							saving || !htmlEditorHasMeaningfulContent(content)
						}
					>
						{saving ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
								{__('Sending…', 'doublescale')}
							</>
						) : (
							__('Send reply', 'doublescale')
						)}
					</Button>
				</>
			}
		>
			<div className="space-y-2">
				<Label className="text-sm font-medium">
					{__('Message', 'doublescale')}
				</Label>
				<SupportRichText message={content} onChange={setContent} />
			</div>
		</ModalShell>
	);
};
