import React from 'react';
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@quillcrm/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import MoreHorizantail from '@quillcrm/components/icons/moreHorizantal-header';
import NoteAddIcon from '@quillcrm/components/icons/note-add';
import CallLogIcon from '@quillcrm/components/icons/call-log';
import EmailLogIcon from '@quillcrm/components/icons/email-log';
import MeetingDealIcon from '@quillcrm/components/icons/meeting-deal';
import ViewIcon from '@quillcrm/components/icons/view-header';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import TrashIcon from '@quillcrm/components/icons/trash';

interface DealCardMenuProps {
	onActionClick: (action: string) => void;
}

export const DealCardMenu: React.FC<DealCardMenuProps> = ({ onActionClick }) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="text-base !active:border-0  !focus:border-0 !shadow-none !border-0 font-medium !text-[#374151] flex items-center justify-center gap-3 h-10 py-2 px-4"
				    onClick={(e) => e.stopPropagation()}
				>
					<MoreHorizantail color="#1E3A8A" width={26} height={26} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
				className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
			>
				<DropdownMenuItem
					onClick={(e) => {
                        e.stopPropagation();
                        onActionClick('add_note')}}
					className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
				>
					<NoteAddIcon />
					{__('Add Note', 'quillcrm')}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={(e) =>{ 
                        e.stopPropagation();
                        onActionClick('log_call')}}
					className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
				>
					<CallLogIcon />
					{__('Log Call', 'quillcrm')}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={(e) => {
                        e.stopPropagation();
                        onActionClick('log_email')}}
					className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
				>
					<EmailLogIcon />
					{__('Log Email', 'quillcrm')}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={(e) => {
                        e.stopPropagation();
                        onActionClick('schedule_meeting')}}
					className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
				>
					<MeetingDealIcon />
					{__('Meeting', 'quillcrm')}
				</DropdownMenuItem>

				<div className="h-[1px] bg-[#DEE1E6] m-1"></div>

				<DropdownMenuItem
					onClick={(e) => {
                        e.stopPropagation();
                        onActionClick('view')}}
					className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
				>
					<ViewIcon />
					{__('View Deal', 'quillcrm')}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={(e) => {
                        e.stopPropagation();
                        onActionClick('edit')}}
					className="flex items-center gap-2 text-[#374151] font-medium text-sm leading-[16px]"
				>
					<EditHeaderIcon />
					{__('Edit Deal', 'quillcrm')}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={(e) => {
                        e.stopPropagation();
                        onActionClick('delete')}}
					className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
				>
					<TrashIcon />
					{__('Delete Deal', 'quillcrm')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
