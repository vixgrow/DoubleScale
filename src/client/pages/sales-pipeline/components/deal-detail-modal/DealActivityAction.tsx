
import { __ } from '@wordpress/i18n';
import React, { useState } from 'react';
import { AddNoteModal } from '../add-note-modal';
import { LogCallModal } from '../log-call-modal';
import { LogEmailModal } from '../log-email-modal';
import { ScheduleMeetingModal } from '../schedule-meeting-modal';
import { Button } from '@/components/ui/button';
import { StickyNote, Phone, Mail, Calendar } from 'lucide-react';
import NoteAddIcon from '@quillcrm/components/icons/note-add';
import CallLogIcon from '@quillcrm/components/icons/call-log';
import EmailLogIcon from '@quillcrm/components/icons/email-log';
import MeetingDealIcon from '@quillcrm/components/icons/meeting-deal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@quillcrm/components/ui/dropdown-menu';
import { PlusIcon } from '@quillcrm/components';
import TrashIcon from '@quillcrm/components/icons/trash';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import { EditDealModal } from '../edit-deal-modal';
import { DeleteDeal } from '../deal-delete';

interface ActivityActionsProps {
  dealId: number;
  onRefresh?: () => void; 
}

const ActivityActions: React.FC<ActivityActionsProps> = ({ dealId, onRefresh }) => {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const handleOpenModal = (type: string, deal?: any) => {
    if (type === 'edit' || type === 'delete') {
      setSelectedDeal(deal); 
    }
    setOpenModal(type);
  };

  const handleClose = () => {
    setOpenModal(null);
    setSelectedDeal(null); 
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        className="flex items-center justify-center gap-2 h-10 px-4 border border-[#458DC7] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px] font-[Inter] text-[#458DC7] hover:text-[#458DC7]"
        onClick={() => {
            setOpenModal('note')
        }
        }
      >
        <NoteAddIcon height={20} width={20}/>
        {__('Add Note','quillcrm')}
      </Button>

      <Button
        variant="outline"
         className="flex items-center justify-center gap-2 h-10 px-4 border border-[#660FF1] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px] font-[Inter] text-[#660FF1] hover:text-[#660FF1]"
        onClick={() => setOpenModal('call')}
      >
        <CallLogIcon  height={20} width={20} />
        {__('Log Call','quillcrm')}
      </Button>

      <Button
        variant="outline"
        className="flex items-center justify-center gap-2 h-10 px-4 border border-[#16A34A] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px] font-[Inter] text-[#16A34A] hover:text-[#16A34A]"
        onClick={() => setOpenModal('email')}
      >
        <EmailLogIcon height={20} width={20}/>
        {__('Log Email','quillcrm')}
      </Button>

      <Button
        variant="outline"
         className="flex items-center justify-center gap-2 h-10 px-4 border border-[#CB5301] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px] font-[Inter] text-[#CB5301] hover:text-[#CB5301]"
        onClick={() => setOpenModal('meeting')}
      >
        <MeetingDealIcon height={20} width={20} />
        {__('Schedule Meeting','quillcrm')}
      </Button>
      {/* ------------------ */}
      
        <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="outline"
      size="icon"
      className=" h-10 w-10 border border-[#374151] !shadow-none"
    >
      <PlusIcon color="#374151" width={32} height={32} />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
    className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
  >
    <DropdownMenuItem
      onClick={() => setOpenModal('edit')}
      className="flex items-center gap-2 text-[#374151] font-medium text-sm leading-[16px]"
    >
      <EditHeaderIcon />
      {__('Edit Deal', 'quillcrm')}
    </DropdownMenuItem>

    <DropdownMenuItem
      onClick={() => setOpenModal('delete')}
      className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
    >
      <TrashIcon />
      {__('Delete Deal', 'quillcrm')}
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

      {/* ------------------ */}

      <AddNoteModal
  visible={openModal === 'note'}
  onClose={handleClose}
  dealId={dealId}
  onSuccess={onRefresh || (() => {})}
/>

<LogCallModal
  visible={openModal === 'call'}
  onClose={handleClose}
  dealId={dealId}
  onSuccess={onRefresh || (() => {})}
/>

<LogEmailModal
  visible={openModal === 'email'}
  onClose={handleClose}
  dealId={dealId}
  onSuccess={onRefresh || (() => {})}
/>

<ScheduleMeetingModal
  visible={openModal === 'meeting'}
  onClose={handleClose}
  dealId={dealId}
  onSuccess={onRefresh || (() => {})}
/>
<EditDealModal
  visible={openModal === 'edit'}
  onClose={handleClose}
  deal={selectedDeal}
  pipelines={[]}
  onSuccess={onRefresh || (() => {})}
/>
<DeleteDeal
  visible={openModal === 'delete'}
  onClose={handleClose}
  deal={selectedDeal}
 
  onConfirm={onRefresh || (() => {})}
/>

    </div>
  );
};

export default ActivityActions;
