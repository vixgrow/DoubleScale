/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import PageTabs from '@/components/page-tabs';
import CampaignDetails from '../campaign-details';
import EngagementsTab from '../engagements';
import UnsubscribesTab from '../unsubscribes';
import { CampaignsIcon, ContactTotalEmailsIcon, UnsubscribesIcon } from '@quillcrm/components';

const TabsSelection: React.FC = () => {
	const tabsList = [
		{
			value: 'details',
			label: 'Campaign Details',
			icon: <CampaignsIcon width={24} height={24} />,
		},
		{
			value: 'emails',
			label: 'Emails',
			icon: <ContactTotalEmailsIcon width={24} height={24} />,
		},
		{
			value: 'unsubscribes',
			label: 'Unsubscribes',
			icon: <UnsubscribesIcon />,
		},
	];

	const tabsContent = [
		{
			value: 'details',
			children: (
				<CardContent className="pt-6">
					<CampaignDetails />
				</CardContent>
			),
		},
		{
			value: 'emails',
			children: (
				<CardContent className="pt-6">
					<EngagementsTab />
				</CardContent>
			),
		},
		{
			value: 'unsubscribes',
			children: (
				<CardContent className="pt-6">
					<UnsubscribesTab />
				</CardContent>
			),
		},
	];

	return (
		<Card className="bg-[#F8F8F8] shadow-none p-5 w-2/3">
			<PageTabs
				defaultValue="details"
				tabsList={tabsList}
				tabsContent={tabsContent}
				className="w-full"
				tabsListWrapperClassName="border-b pb-4 pt-5 px-6"
				tabsListClassName="bg-transparent text-foreground gap-2 justify-start w-full"
			/>
		</Card>
	);
};

export default TabsSelection;

