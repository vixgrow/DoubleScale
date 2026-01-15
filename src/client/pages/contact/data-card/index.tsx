/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import PageTabs from '@/components/page-tabs';
import Emails from '../emails';
import SMSBase from '../sms';
import PurchaseHistory from '../purchase-history';
import Automation from '../automation';
import Notes from '../notes';
import { useContactContext } from '../state/context';
import DealsBase from '../deals';
import TasksBase from '../tasks';
import {
	AutomationsIcon,
	ContactSMSIcon,
	ContactTotalEmailsIcon,
	DealsIcon,
	NotesIcon,
	PurchaseHistoryIcon,
	CoursesIcon,
	TaskDoneIcon,
	PhoneIcon,
	DealActivityIcon,
	CalendarIcon,
	UpcomingActivitiesIcon,
} from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import Courses from '../courses';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import Meetings from '../meetings';
import Calls from '../calls';
import Activities from '../activities';
import UpcomingActivities from '../upcoming-activities';
import WhatsAppIcon from '@quillcrm/components/icons/whatsapp-icon';

interface DataCardProps {
	navigate: (path: string) => void;
}

const DataCard: React.FC<DataCardProps> = ({ navigate }) => {
	const { contact } = useContactContext();
	const isEddActive = ConfigAPI.isEddActive();
	const isWooActive = ConfigAPI.isWoocommerceActive();
	const isSurecartActive = ConfigAPI.isSurecartActive();
	const lmsActive = ConfigAPI.isLmsActive();
	const isCrmManager = useCapabilities().isCrmManager();
	if (!contact) {
		return null;
	}

	// Apply filters to allow Pro version to override components
	const SMS = applyFilters(
		'quillcrm_contact_tab_component',
		SMSBase,
		'sms'
	) as React.FC<{ contact_id: number; navigate?: (path: string) => void }>;
	const Deals = applyFilters(
		'quillcrm_contact_tab_component',
		DealsBase,
		'deals'
	) as React.FC<{ contact_id: number; navigate?: (path: string) => void }>;
	const Tasks = applyFilters(
		'quillcrm_contact_tab_component',
		TasksBase,
		'tasks'
	) as React.FC<{ contact_id: number; navigate?: (path: string) => void }>;
	const WhatsApp = applyFilters(
		'quillcrm_contact_tab_component',
		null,
		'whatsapp'
	) as React.FC<{
		contact_id: number;
		navigate?: (path: string) => void;
	}> | null;

	const tabsList = [
		{
			value: 'upcoming-activities',
			label: 'Upcoming Activities',
			icon: <UpcomingActivitiesIcon />,
		},
		{
			value: 'activities',
			label: 'Activities',
			icon: <DealActivityIcon width={24} height={24} />,
		},
		{
			value: 'emails',
			label: 'Emails',
			icon: <ContactTotalEmailsIcon width={24} height={24} />,
		},
		{
			value: 'calls',
			label: 'Calls',
			icon: <PhoneIcon width={24} height={24} />,
		},
		{ value: 'sms', label: 'SMS', icon: <ContactSMSIcon /> },
		...(WhatsApp
			? [
					{
						value: 'whatsapp',
						label: 'WhatsApp',
						icon: <WhatsAppIcon width={24} height={24} />,
					},
				]
			: []),
		{ value: 'deals', label: 'Deals', icon: <DealsIcon /> },
		{ value: 'tasks', label: 'Tasks', icon: <TaskDoneIcon /> },
		{
			value: 'meetings',
			label: 'Meetings',
			icon: <CalendarIcon width={24} height={24} />,
		},
		{ value: 'notes', label: 'Notes', icon: <NotesIcon /> },
		...(isCrmManager
			? [
					{
						value: 'automation',
						label: 'Automation',
						icon: <AutomationsIcon width={24} height={24} />,
					},
				]
			: []),
	];

	// Conditionally add Purchase History tab
	if (isWooActive || isEddActive || isSurecartActive) {
		tabsList.push({
			value: 'purchase-history',
			label: 'Purchase History',
			icon: <PurchaseHistoryIcon />,
		});
	}

	// Conditionally add Courses tab
	if (lmsActive) {
		tabsList.push({
			value: 'courses',
			label: 'Courses',
			icon: <CoursesIcon width={24} height={24} />, // Replace with a Courses icon when available
		});
	}

	const tabsContent = [
		{
			value: 'meetings',
			children: (
				<CardContent className="pt-6">
					<Meetings contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'calls',
			children: (
				<CardContent className="pt-6">
					<Calls contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'activities',
			children: (
				<CardContent className="pt-6">
					<Activities contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'upcoming-activities',
			children: (
				<CardContent className="pt-6">
					<UpcomingActivities contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'emails',
			children: (
				<CardContent className="pt-6">
					<Emails contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'sms',
			children: (
				<CardContent className="pt-6">
					<SMS contact_id={contact.id} navigate={navigate} />
				</CardContent>
			),
		},
		...(WhatsApp
			? [
					{
						value: 'whatsapp',
						children: (
							<CardContent className="pt-6">
								<WhatsApp
									contact_id={contact.id}
									navigate={navigate}
								/>
							</CardContent>
						),
					},
				]
			: []),
		{
			value: 'deals',
			children: (
				<CardContent className="pt-6">
					<Deals contact_id={contact.id} navigate={navigate} />
				</CardContent>
			),
		},
		{
			value: 'tasks',
			children: (
				<CardContent className="pt-6">
					<Tasks contact_id={contact.id} navigate={navigate} />
				</CardContent>
			),
		},
		{
			value: 'notes',
			children: (
				<CardContent className="pt-6">
					<Notes contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'automation',
			children: (
				<CardContent className="pt-6">
					<Automation contact_id={contact.id} />
				</CardContent>
			),
		},
	];

	// Conditionally add Purchase History content
	if (isWooActive || isEddActive || isSurecartActive) {
		tabsContent.push({
			value: 'purchase-history',
			children: (
				<CardContent className="pt-6">
					<PurchaseHistory contact_id={contact.id} />
				</CardContent>
			),
		});
	}

	// Conditionally add Courses content
	if (lmsActive) {
		tabsContent.push({
			value: 'courses',
			children: (
				<CardContent className="pt-6">
					<Courses contact_id={contact.id} />
				</CardContent>
			),
		});
	}

	return (
		<Card className="w-2/3 bg-[#F8F8F8] shadow-none p-5">
			<PageTabs
				defaultValue="upcoming-activities"
				tabsList={tabsList}
				tabsContent={tabsContent}
				className="w-full"
				tabsListWrapperClassName="border-b pb-7 pt-5"
				tabsListClassName="bg-transparent text-foreground gap-2 justify-start w-full"
				scrollThreshold={6}
				scrollArrowBg="bg-[#F8F8F8]"
			/>
		</Card>
	);
};

export default DataCard;
