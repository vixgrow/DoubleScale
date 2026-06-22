import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

type SupportBulkAction =
	| 'reply'
	| 'agent'
	| 'mailbox'
	| 'tags'
	| 'close'
	| 'delete';

interface SupportInboxBulkActionSelectProps {
	selectedCount: number;
	disabled?: boolean;
	canDelete?: boolean;
	onReply: () => void;
	onAssignAgent: () => void;
	onAssignMailbox: () => void;
	onAssignTags: () => void;
	onClose: () => void;
	onDelete: () => void;
}

const triggerClassName =
	'group gap-2.5 rounded-lg border-border bg-[#F7F8FA] text-foreground px-2 py-1 text-sm font-medium transition-all duration-150 hover:border-brandPrimary/40 hover:bg-brandPrimary/[0.04] data-[state=open]:border-brandPrimary data-[state=open]:bg-brandPrimary/[0.08] disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-white';

const SupportInboxBulkActionSelect: React.FC<
	SupportInboxBulkActionSelectProps
> = ({
	selectedCount,
	disabled = false,
	canDelete = true,
	onReply,
	onAssignAgent,
	onAssignMailbox,
	onAssignTags,
	onClose,
	onDelete,
}) => {
	const [value, setValue] = useState('');

	const isDisabled = disabled || selectedCount === 0;

	const handleAction = (action: SupportBulkAction) => {
		switch (action) {
			case 'reply':
				onReply();
				break;
			case 'agent':
				onAssignAgent();
				break;
			case 'mailbox':
				onAssignMailbox();
				break;
			case 'tags':
				onAssignTags();
				break;
			case 'close':
				onClose();
				break;
			case 'delete':
				onDelete();
				break;
		}
		setValue('');
	};

	return (
		<Select
			value={value}
			onValueChange={(next) => handleAction(next as SupportBulkAction)}
			disabled={isDisabled}
		>
			<SelectTrigger className={triggerClassName}>
				<SelectValue placeholder={__('Bulk Actions', 'doublescale')} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="reply">
					{__('Reply', 'doublescale')}
				</SelectItem>
				<SelectItem value="agent">
					{__('Assign agent', 'doublescale')}
				</SelectItem>
				<SelectItem value="mailbox">
					{__('Assign mailbox', 'doublescale')}
				</SelectItem>
				<SelectItem value="tags">
					{__('Assign tags', 'doublescale')}
				</SelectItem>
				<SelectItem value="close">
					{__('Close tickets', 'doublescale')}
				</SelectItem>
				{canDelete && (
					<SelectItem
						value="delete"
						className="text-destructive focus:text-destructive"
					>
						{__('Delete tickets', 'doublescale')}
					</SelectItem>
				)}
			</SelectContent>
		</Select>
	);
};

export default SupportInboxBulkActionSelect;
