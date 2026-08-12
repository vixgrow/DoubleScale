/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { ChevronRight } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useParams, useNavigate, getToLink } from '@doublescale/navigation';
import './style.scss';
import Analytics from './analytics';
import TabsSelection from './tabs-selection';
import CampaignDetails from './campaign-details';
import AutomatedRunsView from './emails/automated-runs';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Campaign as CampaignType } from '@doublescale/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignsIcon } from '@doublescale/components';

const Overview: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	) as CampaignType | null;

	const handleClose = () => {
		// Navigate back to campaigns list
		navigate(getToLink('campaigns'));
	};

	return (
		<Dialog
			open={true}
			onOpenChange={(value) => {
				if (!value) {
					handleClose();
				}
			}}
		>
			<DialogContent
				overlayClassName="z-[1800000]"
				className="left-0 top-0 z-[1800000] flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none"
				style={{
					paddingTop: '10px',
					paddingLeft: '0px',
					paddingRight: '0px',
					paddingBottom: '0px',
					gap: '0px',
				}}
			>
				<DialogHeader className="pb-0 border-b border-[#E4E7EC] h-12">
					<DialogTitle className="px-12 pb-4 pt-2">
						<h1 className="text-base font-normal text-[#667085] flex items-center gap-2">
							{__('Campaigns List', 'doublescale')}
							<ChevronRight className="w-4 h-4 text-[#667085]" />
							{campaign?.name || __('Campaign Overview', 'doublescale')}
						</h1>
					</DialogTitle>
				</DialogHeader>
				{campaign ? (
					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 lg:px-12">
						{campaign.status === 'draft' ? (
							// Draft campaigns: Show only campaign details, full width
							<Card className="bg-muted/50 shadow-none px-5 w-full min-w-0">
								<CardHeader className="border-b pb-4 px-0">
									<CardTitle className="text-xl font-medium text-foreground flex items-center gap-2">
										<CampaignsIcon width={24} height={24} />
										{__('Campaign Details', 'doublescale')}
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6 px-0">
									<CampaignDetails />
								</CardContent>
							</Card>
					) : campaign.settings?.automated ? (
						// Automated campaigns: Show batches directly (each batch is its own campaign)
						<AutomatedRunsView />
					) : (
						// Regular campaigns: Show analytics + tabs
						<div className="flex flex-col lg:flex-row gap-5">
							<Analytics />
							<TabsSelection />
						</div>
					)}
					</div>
				) : (
					<div className="flex items-center justify-center h-64">
						<div className="text-lg text-red-500">
							{!id
								? __('No campaign ID provided', 'doublescale')
								: __('Campaign not found', 'doublescale')}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default Overview;
