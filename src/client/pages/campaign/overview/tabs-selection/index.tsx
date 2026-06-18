/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import PageTabs from '@/components/page-tabs';
import CampaignDetails from '../campaign-details';
import EmailsTab from '../emails';
import UnsubscribesTab from '../unsubscribes';
import { CampaignsIcon, ContactTotalEmailsIcon, UnsubscribesIcon, UnsubscribeSMSIcon } from '@doublescale/components';
import { Campaign as CampaignType } from '@doublescale/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';

const SM_BREAKPOINT = 640;

function useIsSmallScreen() {
	const [isSmallScreen, setIsSmallScreen] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${SM_BREAKPOINT - 1}px)`);
		const onChange = () => setIsSmallScreen(mql.matches);
		mql.addEventListener('change', onChange);
		setIsSmallScreen(mql.matches);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return isSmallScreen;
}

const TabsSelection: React.FC = () => {
	const isSmallScreen = useIsSmallScreen();
	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	) as CampaignType | null;

	const isSMSCampaign = campaign?.type === CAMPAIGN_CHANNEL.SMS;
	const isWhatsAppCampaign = campaign?.type === CAMPAIGN_CHANNEL.WHATSAPP;
	// SMS and WhatsApp campaigns only show Campaign Details and Unsubscribes tabs
	const tabsList = (isSMSCampaign || isWhatsAppCampaign)
		? [
			{
				value: 'details',
				label: 'Campaign Details',
				icon: <CampaignsIcon width={24} height={24} />,
			},
			{
				value: 'unsubscribes',
				label: 'Unsubscribes',
				icon: <UnsubscribeSMSIcon width={24} height={24} />,
			},
		]
		: [
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

	const tabsContent = (isSMSCampaign || isWhatsAppCampaign)
		? [
			{
				value: 'details',
				children: (
					<CardContent className="pt-6">
						<CampaignDetails />
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
		]
		: [
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
						<EmailsTab />
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
		<Card className="bg-muted/50 shadow-none p-5 w-full min-w-0 lg:w-2/3">
			<PageTabs
				defaultValue="details"
				tabsList={tabsList}
				tabsContent={tabsContent}
				className="w-full"
				enableHorizontalScroll={isSmallScreen}
				scrollArrowBg="bg-muted/50"
				tabsListWrapperClassName="border-b pb-4 pt-5"
				tabsListClassName="bg-transparent text-foreground gap-2 justify-start w-full"
			/>
		</Card>
	);
};

export default TabsSelection;

