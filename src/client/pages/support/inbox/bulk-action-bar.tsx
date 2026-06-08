/**
 * Floating bulk-action toolbar — shown when one or more inbox tickets are selected.
 * Layout mirrors Fluent Support's inbox action bar (Reply, Agent, Mailbox, Tags, Close, Delete).
 */

import React from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	MessageSquare,
	Headphones,
	Inbox,
	Tag,
	CheckCheck,
	Trash2,
	X,
} from 'lucide-react';

interface BulkActionBarProps {
	selectedCount: number;
	onReply: () => void;
	onAssignAgent: () => void;
	onAssignMailbox: () => void;
	onAssignTags: () => void;
	onClose: () => void;
	onDelete: () => void;
	onClear: () => void;
	busy?: boolean;
	canDelete?: boolean;
}

interface ActionButtonProps {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	destructive?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
	label,
	icon,
	onClick,
	disabled,
	destructive,
}) => (
	<button
		type="button"
		onClick={onClick}
		disabled={disabled}
		className={`flex flex-col items-center gap-1 min-w-[4.5rem] px-2 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
			destructive
				? 'text-red-300 hover:bg-red-500/20'
				: 'text-gray-200 hover:bg-white/10'
		}`}
	>
		<span className="flex items-center justify-center w-8 h-8">{icon}</span>
		<span className="text-xs font-medium">{label}</span>
	</button>
);

const BulkActionBar: React.FC<BulkActionBarProps> = ({
	selectedCount,
	onReply,
	onAssignAgent,
	onAssignMailbox,
	onAssignTags,
	onClose,
	onDelete,
	onClear,
	busy = false,
	canDelete = true,
}) => {
	if (selectedCount <= 0) {
		return null;
	}

	return (
		<div className="fixed top-20 left-1/2 z-[100] -translate-x-1/2">
			<div className="flex items-center gap-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 shadow-2xl">
				<div className="flex items-center gap-1 pr-2 mr-1 border-r border-gray-700">
					<span className="text-sm font-medium text-white whitespace-nowrap px-2">
						{selectedCount === 1
							? __('1 ticket', 'doublescale')
							: sprintf(
									/* translators: %d: number of selected tickets */
									__('%d tickets', 'doublescale'),
									selectedCount
							  )}
					</span>
					<button
						type="button"
						onClick={onClear}
						disabled={busy}
						className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40"
						title={__('Clear selection', 'doublescale')}
					>
						<X width={16} height={16} />
					</button>
				</div>

				<ActionButton
					label={__('Reply', 'doublescale')}
					icon={<MessageSquare width={18} height={18} />}
					onClick={onReply}
					disabled={busy}
				/>
				<ActionButton
					label={__('Agent', 'doublescale')}
					icon={<Headphones width={18} height={18} />}
					onClick={onAssignAgent}
					disabled={busy}
				/>
				<ActionButton
					label={__('Mailbox', 'doublescale')}
					icon={<Inbox width={18} height={18} />}
					onClick={onAssignMailbox}
					disabled={busy}
				/>
				<ActionButton
					label={__('Tags', 'doublescale')}
					icon={<Tag width={18} height={18} />}
					onClick={onAssignTags}
					disabled={busy}
				/>
				<ActionButton
					label={__('Close', 'doublescale')}
					icon={<CheckCheck width={18} height={18} />}
					onClick={onClose}
					disabled={busy}
				/>
				{canDelete && (
					<ActionButton
						label={__('Delete', 'doublescale')}
						icon={<Trash2 width={18} height={18} />}
						onClick={onDelete}
						disabled={busy}
						destructive
					/>
				)}
			</div>
		</div>
	);
};

export default BulkActionBar;
