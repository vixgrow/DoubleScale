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
import { useParams, useNavigate, getToLink } from '@quillcrm/navigation';
import './style.scss';
import Analytics from './analytics';
import TabsSelection from './tabs-selection';
import CampaignDetails from './campaign-details';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Campaign as CampaignType } from '@quillcrm/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignsIcon } from '@quillcrm/components';

const Overview: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	) as CampaignType | null;

	const isLoading = useSelect(
		(select: any) => select('quillcrm/campaign').isLoading(),
		[]
	);

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
				className="z-[1800000] w-screen h-screen max-w-none gap-0 bg-white rounded-none shadow-none"
				style={{
					paddingTop: '10px',
					paddingLeft: '0px',
					paddingRight: '0px',
					paddingBottom: '0px',
				}}
			>
				<DialogHeader className="pb-0 border-b border-[#E4E7EC]">
					<DialogTitle className="px-12 pb-4 pt-2">
						<h1 className="text-base font-normal text-[#667085] flex items-center gap-2">
							{__('Campaigns List', 'quillcrm')}
							<ChevronRight className="w-4 h-4 text-[#667085]" />
							{campaign?.name || __('Campaign Overview', 'quillcrm')}
						</h1>
					</DialogTitle>
				</DialogHeader>
				{campaign ? (
					<div className="px-12 overflow-y-auto py-8">
						{campaign.status === 'draft' ? (
							// Draft campaigns: Show only campaign details, full width
							<Card className="bg-[#F8F8F8] shadow-none px-5 w-full">
								<CardHeader className="border-b pb-4 px-0">
									<CardTitle className="text-xl font-medium text-[#09090B] flex items-center gap-2">
										<CampaignsIcon width={24} height={24} />
										{__('Campaign Details', 'quillcrm')}
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6 px-0">
									<CampaignDetails />
								</CardContent>
							</Card>
						) : (
							// Other campaigns: Show analytics + tabs
							<div className="flex gap-5">
								<Analytics />
								<TabsSelection />
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center justify-center h-64">
						<div className="text-lg text-red-500">
							{!id
								? __('No campaign ID provided', 'quillcrm')
								: __('Campaign not found', 'quillcrm')}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default Overview;
