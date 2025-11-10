// wordpress
import { __ } from '@wordpress/i18n';
// react
import { useState } from '@wordpress/element';
// shadcn
import { Button } from '@/components/ui/button';

// modals
import { AddNoteModal } from '../../add-note-modal';
import { LogEmailModal } from '../../log-email-modal';
import { LogCallModal } from '../../log-call-modal';
import { ScheduleMeetingModal } from '../../schedule-meeting-modal';
// Icons
import NoteAddIcon from '@quillcrm/components/icons/note-add';
import EmailLogIcon from '@quillcrm/components/icons/email-log';
import CallActivityIcon from '@quillcrm/components/icons/call-activity';
import CallLogIcon from '@quillcrm/components/icons/call-log';
import EmailActivityIcon from '@quillcrm/components/icons/email-activity';
import MeetingActivityIcon from '@quillcrm/components/icons/meeting-activity';
import MeetingDealIcon from '@quillcrm/components/icons/meeting-deal';
import DealActivityIcon from '@quillcrm/components/icons/deal-activity';

interface ActivityModalsProps {
  dealId?: number;
  activityTypeFilter?: string;
  onActivityAdded?: () => void
}


interface ActivityConfig {
  title: string;
  iconLarge: JSX.Element;
  label?: string;
  iconSmall?: JSX.Element;
  btnClass?: string;
  onClick?: () => void;
}

const NoActivity: React.FC<ActivityModalsProps> = ({
  dealId,
  activityTypeFilter,
  onActivityAdded
}) => {
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);

  const buttonStyles: Record<string, ActivityConfig> = {
    note_added: {
      title: __('No Notes Till Now', 'quillcrm'),
      iconLarge: <NoteAddIcon width={100} height={100} color="#777777" />,
      label: __('Add Note', 'quillcrm'),
      iconSmall: <NoteAddIcon color="#458DC7" />,
      btnClass:
        'text-[#458DC7] border border-[#458DC7] rounded-[8px] py-2 px-4',
      onClick: () => setNoteModalVisible(true),
    },
    email_sent: {
      title: __('No Emails Til Now', 'quillcrm'),
      iconLarge: <EmailActivityIcon width={100} height={100} color="#777777" />,
      label: __('Add Log Email', 'quillcrm'),
      iconSmall: <EmailLogIcon color="#16A34A" />,
      btnClass:
        'text-[#16A34A] border border-[#16A34A] rounded-[8px] py-2 px-4',
      onClick: () => setEmailModalVisible(true),
    },
    call_logged: {
      title: __('No Calls Logged', 'quillcrm'),
      iconLarge: <CallActivityIcon width={100} height={100} color="#777777" />,
      label: __('Add Call Log', 'quillcrm'),
      iconSmall: <CallLogIcon />,
      btnClass:
        'text-[#660FF1] border border-[#660FF1] rounded-[8px] py-2 px-4',
      onClick: () => setCallModalVisible(true),
    },
    meeting_scheduled: {
      title: __('No Meetings Til Now', 'quillcrm'),
      iconLarge: (
        <MeetingActivityIcon width={100} height={100} color="#777777" />
      ),
      label: __('Add Meeting', 'quillcrm'),
      iconSmall: <MeetingDealIcon />,
      btnClass:
        'text-[#CB5301] border border-[#CB5301] rounded-[8px] py-2 px-4',
      onClick: () => setMeetingModalVisible(true),
    },
    default: {
      title: __('No activities Till Now', 'quillcrm'),
      iconLarge: <DealActivityIcon width={100} height={100} />,
    },
  };

  const config: ActivityConfig =
    buttonStyles[activityTypeFilter as keyof typeof buttonStyles] ||
    buttonStyles.default;

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
      
      <div className="flex items-center justify-center ">{config.iconLarge}</div>

      
      <h3 className="text-lg font-medium leading-[28px] text-[#777]">
        {config.title}
      </h3>

      
      {config.label && (
        <Button
          className={`rounded-[8px] !bg-transparent py-2 px-4 flex items-center gap-2 font-medium ${config.btnClass ?? ''}`}
          onClick={config.onClick}
        >
          {config.iconSmall}
          {config.label}
        </Button>
      )}

      {/* modal */}
      <AddNoteModal
        visible={noteModalVisible}
        onClose={() => setNoteModalVisible(false)}
        onSuccess={() => {
          setNoteModalVisible(false); 
          onActivityAdded?.(); 
        }}
        dealId={dealId!}
      />
      <LogEmailModal
        visible={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        onSuccess={() => {
          setEmailModalVisible(false);
          onActivityAdded?.();
        }}
        dealId={dealId!}
      />
      <LogCallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        onSuccess={() => {
          setEmailModalVisible(false);
          onActivityAdded?.();
        }}
        dealId={dealId!}
      />
      <ScheduleMeetingModal
        visible={meetingModalVisible}
        onClose={() => setMeetingModalVisible(false)}
        onSuccess={() => {
          setMeetingModalVisible(false);
          onActivityAdded?.();
        }}
        dealId={dealId!}
      />
    </div>
  );
};

export default NoActivity;
