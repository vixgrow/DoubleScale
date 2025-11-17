/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import PageTabs from '@/components/page-tabs';
import Activity from '../activity';
import Notes from '../notes';
import DealActivityIcon from '@quillcrm/components/icons/deal-activity';
import NoteAddIcon from '@quillcrm/components/icons/note-add';
import CallLogIcon from '@quillcrm/components/icons/call-log';
import EmailLogIcon from '@quillcrm/components/icons/email-log';
import MeetingDealIcon from '@quillcrm/components/icons/meeting-deal';
import Calls from '../calls';
import Emails from '../emails';
import Meeting from '../meeting';
import { useDealOperations } from '../../hooks/use-deal-operations';
import { useEffect, useState } from 'react';

interface Deal_ActivitesProps {
	dealId?: number;
	onNotice?: (notice: { type: 'success' | 'error'; message: string }) => void;
}

const Deal_Activites: React.FC<Deal_ActivitesProps> = ({ dealId ,onNotice}) => {

	const [activityCounts, setActivityCounts] = useState({
		activity: 0,
		notes: 0,
		calls: 0,
		emails: 0,
		meeting: 0,
	  });
	
	const { getDealActivities } = useDealOperations();

	useEffect(() => {
		const fetchActivityCounts = async () => {
		  if (!dealId || !getDealActivities) return;
		  try {
			const response = await getDealActivities(dealId, {}, 100, 1);
			if (Array.isArray(response)) {
			  const counts = {
				activity: response.length,
				notes: response.filter((a) => a.activity_type === 'note_added').length,
				calls: response.filter((a) => a.activity_type === 'call_logged').length,
				emails: response.filter((a) => a.activity_type === 'email_sent').length,
				meeting: response.filter((a) => a.activity_type === 'meeting_scheduled').length,
			  };
			  setActivityCounts(counts);
			}
		  } catch (error) {
			console.error('Error fetching counts:', error);
		  }
		};
	  
		fetchActivityCounts();
	  }, [dealId]);

	if (!getDealActivities) {
		return null;
	}

	const tabsList = [
		{
			value: 'activity',
			label: `Activity (${activityCounts.activity})`,
			icon: <DealActivityIcon color="#374151"  width={24} height={24} />,
		},
		{
			value: 'notes',
			label: `Notes (${activityCounts.notes})`,
			icon: <NoteAddIcon color="#374151" />,
		},
		{
			value: 'calls',
			label: `Calls (${activityCounts.calls})`,
			icon: <CallLogIcon color="#374151" />,
		},
		{
			value: 'emails',
			label: `Emails (${activityCounts.emails})`,
			icon: <EmailLogIcon color="#374151" />,
		},
		{
			value: 'meeting',
			label: `Meeting (${activityCounts.meeting})`,
			icon: <MeetingDealIcon color="#374151" />,
		},
	];

	const tabsContent = [
		{
			value: 'activity',
			children: (
				<CardContent className="pt-6">
					<Activity dealId={dealId} />
				</CardContent>
			),
		},
		{
			value: 'notes',
			children: (
				<CardContent className="pt-6">
					<Notes dealId={dealId}
					/>
				</CardContent>
			),
		},
		{
			value: 'calls',
			children: (
				<CardContent className="pt-6">
					<Calls
					dealId={dealId}
					/>
				</CardContent>
			),
		},
		{
			value: 'emails',
			children: (
				<CardContent className="pt-6">
					<Emails dealId={dealId} />
				</CardContent>
			),
		},
		{
			value: 'meeting',
			children: (
				<CardContent className="pt-6">
					<Meeting
					dealId={dealId}
					/>
				</CardContent>
			),
		},
	];

	return (
		<Card className="w-full  shadow-none p-5 bg-[#F8F8F8]">
			<PageTabs
				defaultValue="activity"
				tabsList={tabsList}
				tabsContent={tabsContent}
				className="w-full !border-0 "
				tabsListWrapperClassName="border-b pb-7 pt-5"
				tabsListClassName="bg-transparent text-foreground gap-6 justify-start w-full  text-[#374151] font-medium text-lg 
				[&_button]:flex 
					[&_button]:items-center 
					[&_button]:gap-2
					[&_button_svg]:transition-colors
					[&_button_svg_path]:fill-[#374151]
					[&_button_svg_path]:transition-colors
					[&_button[data-state=active]_svg_path]:fill-[#E5E7EB]
                "
			/>
		</Card>
	);
};

export default Deal_Activites;
