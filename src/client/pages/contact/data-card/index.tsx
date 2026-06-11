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
import EmailsBase from '../emails';
import SMSBase from '../sms';
import LeadScoreBase from '../lead-score';
import PurchaseHistory from '../purchase-history';
import Automation from '../automation';
import Notes from '../notes';
import { useContactContext } from '../state/context';
import DealsBase from '../deals';
import TasksBase from '../tasks';
import WebsiteTrackingBase from '../website-tracking';
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
	WebsiteIcon,
} from '@doublescale/components';
import ConfigAPI from '@doublescale/config';
import { isSalesDocumentsReady } from '@doublescale/shared/lib/optional-marketing-modules';
import Courses from '../courses';
import ContactSales from '../sales';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import Meetings from '../meetings';
import Calls from '../calls';
import Activities from '../activities';
import UpcomingActivities from '../upcoming-activities';
import WhatsAppIcon from '@doublescale/shared/icons/whatsapp-icon';
import { Receipt, Trophy } from 'lucide-react';
import { ProFeatureNotice } from '@doublescale/components';

interface DataCardProps {
	navigate: (path: string) => void;
	initialTab?: string;
}

const DataCard: React.FC<DataCardProps> = ({ navigate, initialTab }) => {
	const { contact } = useContactContext();
	const isEddActive = ConfigAPI.isEddActive();
	const isWooActive = ConfigAPI.isWoocommerceActive();
	const isSurecartActive = ConfigAPI.isSurecartActive();
	const lmsActive = ConfigAPI.isLmsActive();
	const isCrmManager = useCapabilities().isCrmManager();
	const isDealsModuleEnabled = ConfigAPI.isModuleEnabled('deals');
	const isTasksModuleEnabled = ConfigAPI.isModuleEnabled('tasks');
	const isAutomationsModuleEnabled = ConfigAPI.isModuleEnabled('automations');
	// The contact Sales tab lists proposals/invoices — hidden while the
	// documents feature is gated (see isSalesDocumentsReady()).
	const isSalesModuleEnabled =
		ConfigAPI.isModuleEnabled('sales') && isSalesDocumentsReady();
	if (!contact) {
		return null;
	}

	// Apply filters to allow Pro version to override components
	const Emails = applyFilters(
		'doublescale_contact_tab_component',
		EmailsBase,
		'emails'
	) as React.FC<{ contact_id: number }>;
	const SMS = applyFilters(
		'doublescale_contact_tab_component',
		SMSBase,
		'sms'
	) as React.FC<{ contact_id: number; navigate?: (path: string) => void }>;
	const LeadScore = applyFilters(
		'doublescale_contact_tab_component',
		LeadScoreBase,
		'lead-score'
	) as React.FC<{ contact_id: number; navigate?: (path: string) => void }>;
	const Deals = applyFilters(
		'doublescale_contact_tab_component',
		DealsBase,
		'deals'
	) as React.FC<{ contact_id: number; navigate?: (path: string) => void }>;
	const Tasks = applyFilters(
		'doublescale_contact_tab_component',
		TasksBase,
		'tasks'
	) as React.FC<{ contact_id: number; navigate?: (path: string) => void }>;
	const WhatsApp = applyFilters(
		'doublescale_contact_tab_component',
		null,
		'whatsapp'
	) as React.FC<{
		contact_id: number;
		navigate?: (path: string) => void;
	}> | null;
	const WebsiteTracking = applyFilters(
		'doublescale_contact_tab_component',
		WebsiteTrackingBase,
		'website_tracking'
	) as React.FC<{
		contact_id: number;
		navigate?: (path: string) => void;
	}>;

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
		{
			value: 'whatsapp',
			label: 'WhatsApp',
			icon: <WhatsAppIcon width={24} height={24} />,
		},
		...(isDealsModuleEnabled
			? [{ value: 'deals', label: 'Deals', icon: <DealsIcon /> }]
			: []),
		...(isSalesModuleEnabled
			? [{ value: 'sales', label: 'Sales', icon: <Receipt width={24} height={24} /> }]
			: []),
		{
			value: 'lead-score',
			label: 'Lead Score',
			icon: <Trophy width={24} height={24} />,
		},
		...(isTasksModuleEnabled
			? [{ value: 'tasks', label: 'Tasks', icon: <TaskDoneIcon /> }]
			: []),
		{
			value: 'meetings',
			label: 'Meetings',
			icon: <CalendarIcon width={24} height={24} />,
		},
		{ value: 'notes', label: 'Notes', icon: <NotesIcon /> },
		{
			value: 'website_tracking',
			label: 'Website Tracking',
			icon: <WebsiteIcon width={24} height={24} />,
		},
		...(isCrmManager && isAutomationsModuleEnabled
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
		{
			value: 'whatsapp',
			children: (
				<CardContent className="pt-6">
					{WhatsApp ? (
						<WhatsApp
							contact_id={contact.id}
							navigate={navigate}
						/>
					) : (
						<ProFeatureNotice
							featureName={__('WhatsApp', 'doublescale')}
							description={__(
								'Send and receive WhatsApp messages directly from your contact details with DoubleScale Pro.',
								'doublescale'
							)}
						/>
					)}
				</CardContent>
			),
		},
		...(isDealsModuleEnabled
			? [
					{
						value: 'deals',
						children: (
							<CardContent className="pt-6">
								<Deals
									contact_id={contact.id}
									navigate={navigate}
								/>
							</CardContent>
						),
					},
				]
			: []),
		...(isSalesModuleEnabled
			? [
					{
						value: 'sales',
						children: (
							<CardContent className="pt-6">
								<ContactSales
									contact_id={contact.id}
									navigate={navigate}
								/>
							</CardContent>
						),
					},
				]
			: []),
		{
			value: 'lead-score',
			children: (
				<CardContent className="pt-6">
					<LeadScore contact_id={contact.id} navigate={navigate} />
				</CardContent>
			),
		},
		{
			value: 'website_tracking',
			children: (
				<CardContent className="pt-6">
					<WebsiteTracking
						contact_id={contact.id}
						navigate={navigate}
					/>
				</CardContent>
			),
		},
		...(isTasksModuleEnabled
			? [
					{
						value: 'tasks',
						children: (
							<CardContent className="pt-6">
								<Tasks
									contact_id={contact.id}
									navigate={navigate}
								/>
							</CardContent>
						),
					},
				]
			: []),
		{
			value: 'notes',
			children: (
				<CardContent className="pt-6">
					<Notes contact_id={contact.id} />
				</CardContent>
			),
		},
		...(isAutomationsModuleEnabled
			? [
					{
						value: 'automation',
						children: (
							<CardContent className="pt-6">
								<Automation contact_id={contact.id} />
							</CardContent>
						),
					},
				]
			: []),
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

	// Use URL tab param if it matches a valid tab, otherwise fall back to "activities".
	const resolvedTab =
		initialTab && tabsList.some((t) => t.value === initialTab)
			? initialTab
			: 'activities';

	return (
		<Card className="flex min-h-full w-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-0 shadow-sm ring-1 ring-black/[0.03] lg:min-h-[min(70vh,560px)]">
			<PageTabs
				defaultValue={resolvedTab}
				tabsList={tabsList}
				tabsContent={tabsContent}
				className="w-full min-w-0"
				tabsListWrapperClassName="border-b border-border/50 bg-muted/20 px-3 py-3 sm:px-5"
				tabsListClassName="w-full justify-start gap-1 rounded-xl bg-background/85 p-1 text-foreground shadow-sm ring-1 ring-border/40"
				scrollThreshold={6}
				scrollArrowBg="bg-background/95 backdrop-blur-sm"
			/>
		</Card>
	);
};

export default DataCard;
