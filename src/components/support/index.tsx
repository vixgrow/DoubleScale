/**
 * Support module — admin UI primitives.
 *
 * Heavier composition components (ticket detail panel, reply composer) live
 * under their parent page directory; this module only exposes shared
 * primitives reused across pages: icons + the status / priority pills.
 */

import React from '@wordpress/element';
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Circle,
	CircleDot,
	Inbox,
	MessageSquareText,
	Send,
	StickyNote,
} from 'lucide-react';
import { HelpdeskIcon } from '@doublescale/shared/icons';

import type { TicketPriority, TicketStatus } from '@/constants/support';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/constants/support';

interface IconProps {
	width?: number;
	height?: number;
	className?: string;
}

export const SupportIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
	className,
}) => (
	<HelpdeskIcon width={width} height={height} className={className} />
);

export const InboxIcon: React.FC<IconProps> = (props) => <Inbox {...props} />;
export const ReplyIcon: React.FC<IconProps> = (props) => <Send {...props} />;
export const NoteIcon: React.FC<IconProps> = (props) => <StickyNote {...props} />;
export const ConversationIcon: React.FC<IconProps> = (props) => (
	<MessageSquareText {...props} />
);

const STATUS_STYLES: Record<TicketStatus, { bg: string; fg: string; Icon: React.FC<IconProps> }> = {
	open: { bg: 'bg-[#D9E9F3]', fg: 'text-[#0D9DFC]', Icon: (p) => <Circle {...p} /> },
	pending: {
		bg: 'bg-[#FAEADF]',
		fg: 'text-[#CB5301]',
		Icon: (p) => <CircleDot {...p} />,
	},
	resolved: {
		bg: 'bg-[#F7F4C3]',
		fg: 'text-[#896900]',
		Icon: (p) => <CheckCircle2 {...p} />,
	},
	closed: {
		bg: 'bg-[#E4FAEC]',
		fg: 'text-[#16A34A]',
		Icon: (p) => <CheckCircle2 {...p} />,
	},
};

export const StatusPill: React.FC<{ status: TicketStatus }> = ({ status }) => {
	const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;
	const Icon = style.Icon;
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-sm leading-6 font-medium ${style.bg} ${style.fg}`}
		>
			{/* <Icon width={12} height={12} /> */}
			{STATUS_LABELS[status] ?? status}
		</span>
	);
};

const PRIORITY_STYLES: Record<
	TicketPriority,
	{ fg: string; Icon: React.FC<IconProps> }
> = {
	low: {  fg: 'text-[#16A34A]', Icon: (p) => <Circle {...p} /> },
	normal: { fg: 'text-[#0D9DFC]', Icon: (p) => <Circle {...p} /> },
	high: {
		// bg: 'bg-[#CB5301]',
		fg: 'text-[#CB5301]',
		Icon: (p) => <AlertCircle {...p} />,
	},
	urgent: {

		fg: 'text-red-700',
		Icon: (p) => <AlertTriangle {...p} />,
	},
};

export {
	default as AttachmentUploader,
	toPendingAttachment,
	revokePendingPreviews,
	removePendingByHash,
} from './attachment-uploader';
export type { PendingAttachment } from './attachment-uploader';
export { default as CcRecipientsInput } from './cc-recipients-input';
export { default as AttachmentList } from './attachment-list';

export const PriorityPill: React.FC<{ priority: TicketPriority }> = ({
	priority,
}) => {
	const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal;
	const Icon = style.Icon;
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium  ${style.fg}`}
		>
			<Icon width={16} height={16} />
			<span className=' text-foreground'>{PRIORITY_LABELS[priority] ?? priority}</span>
		</span>
	);
};
