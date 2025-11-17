
import { __ } from '@wordpress/i18n';
import React, { useState } from 'react';
import { AddNoteModal } from '../add-note-modal';
import { LogCallModal } from '../log-call-modal';
import { LogEmailModal } from '../log-email-modal';
import { ScheduleMeetingModal } from '../schedule-meeting-modal';
import { Button } from '@/components/ui/button';
import NoteAddIcon from '@quillcrm/components/icons/note-add';
import CallLogIcon from '@quillcrm/components/icons/call-log';
import EmailLogIcon from '@quillcrm/components/icons/email-log';
import MeetingDealIcon from '@quillcrm/components/icons/meeting-deal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@quillcrm/components/ui/dropdown-menu';
import { PlusIcon } from '@quillcrm/components';
import TrashIcon from '@quillcrm/components/icons/trash';
import { DeleteDeal } from '../deal-delete';
import { useDealOperations } from '../../hooks/use-deal-operations';

interface ActivityActionsProps {
  dealId: number;
  dealTitle?: string;
  dealContactName?: string;
  onRefresh?: () => void; 
  onDeleted?: () => void; 
  deal?: any;
  onNotice?: (notice: { type: 'success' | 'error'; message: string }) => void;
}

const ActivityActions: React.FC<ActivityActionsProps> = ({ dealId, onRefresh ,dealTitle,dealContactName,deal,onDeleted,onNotice}) => {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const { getDeal } = useDealOperations();
  // const handleOpenModal = (type: string, deal?: any) => {
  //   if (type === 'edit' || type === 'delete') {
  //     setSelectedDeal(deal); 
      
  //   }
  //   setOpenModal(type);
  // };
  const handleOpenModal = async (type: string, deal?: any) => {
    if (type === 'edit' && deal?.id) {
      try {
        const latestDeal = await getDeal(deal.id, true);
        setSelectedDeal(latestDeal);
        setOpenModal('edit');
      } catch (error) {
        console.error('Failed to fetch deal for edit', error);
        // message.error(__('Failed to fetch deal data', 'quillcrm'));
      }
      return;
    }
  
    if (type === 'delete') {
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
        className="flex items-center justify-center gap-2 h-10 px-4 border border-[#458DC7] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px]  text-[#458DC7] hover:text-[#458DC7]"
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
         className="flex items-center justify-center gap-2 h-10 px-4 border border-[#660FF1] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px]  text-[#660FF1] hover:text-[#660FF1]"
        onClick={() => setOpenModal('call')}
      >
        <CallLogIcon  height={20} width={20} />
        {__('Log Call','quillcrm')}
      </Button>

      <Button
        variant="outline"
        className="flex items-center justify-center gap-2 h-10 px-4 border border-[#16A34A] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px] text-[#16A34A] hover:text-[#16A34A]"
        onClick={() => setOpenModal('email')}
      >
        <EmailLogIcon height={20} width={20}/>
        {__('Log Email','quillcrm')}
      </Button>

      <Button
        variant="outline"
         className="flex items-center justify-center gap-2 h-10 px-4 border border-[#CB5301] rounded-[8px] bg-[#FFF] !shadow-none font-medium text-base leading-[26px] text-[#CB5301] hover:text-[#CB5301]"
        onClick={() => setOpenModal('meeting')}
      >
        <MeetingDealIcon height={20} width={20} />
        {__(' Log Meeting','quillcrm')}
      </Button>
      {/* ------------------ */}
      
        <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="outline"
      size="icon"
      className=" h-10 border border-[#374151] text-[#374151] rounded-[8px] px-2 py.5"
    >
      <PlusIcon width={24} height={24} color="#374151"  />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
    className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5] z-[100000]"
  >

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
  dealTitle={dealTitle}
  onSuccess={(notice) => {
    onRefresh?.();
    if (notice) onNotice?.(notice);
  }}
/>

<LogCallModal
  visible={openModal === 'call'}
  onClose={handleClose}
  dealId={dealId}
  dealTitle={dealTitle}
  onSuccess={(notice) => {
    onRefresh?.();
    if (notice) onNotice?.(notice);
  }}
  dealContactName={dealContactName}
/>

<LogEmailModal
  visible={openModal === 'email'}
  onClose={handleClose}
  dealId={dealId}
  dealTitle={dealTitle}
  onSuccess={(notice) => {
    onRefresh?.();
    if (notice) onNotice?.(notice);
  }}
/>

<ScheduleMeetingModal
  visible={openModal === 'meeting'}
  onClose={handleClose}
  dealId={dealId}
  dealTitle={dealTitle}
  // onSuccess={onRefresh || (() => {})}
  onSuccess={(notice) => {
    onRefresh?.();
    if (notice) onNotice?.(notice);
  }}
/>


<DeleteDeal
  visible={openModal === 'delete'}
  onClose={handleClose}
  deal={deal} 
  onConfirm={(notice) => {
    handleClose();
    onRefresh?.();
    onDeleted?.();
    if (notice) onNotice?.(notice);
  }}
 
  // onConfirm={onRefresh || (() => {})}
  
/>

    </div>
  );
};

export default ActivityActions;

