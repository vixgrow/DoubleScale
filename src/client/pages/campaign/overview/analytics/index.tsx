/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Chart as ChartJS,
	ArcElement,
	PolarAreaController,
	RadialLinearScale,
	Tooltip,
	Legend,
	Title,
} from 'chart.js';

ChartJS.register(
	ArcElement,
	PolarAreaController,
	RadialLinearScale,
	Tooltip,
	Legend,
	Title
);

/**
 * Internal dependencies
 */
import './style.scss';
import { Campaign as CampaignType } from '@quillcrm/client';
import { getCampaignEndpoint } from '@quillcrm/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { RenderMetrics } from './metrics';
import { RenderChart } from './chart';

const Analytics: React.FC = () => {
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	) as CampaignType | null;

	const { updateCampaign: updateCampaignAction } =
		useDispatch('quillcrm/campaign');
	const totalMessages = campaign
		? campaign.sent_count + campaign.failed_count
		: 0;
	const [isFetching, setIsFetching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [started, setStarted] = useState(
		campaign?.status === 'processing' && totalMessages > 0
	);

	const fetchCampaign = useCallback(async () => {
		if (!campaign || isFetching) {
			return;
		}

		setIsFetching(true);
		setError(null);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
			})) as CampaignType;

			const totalMessages = response.sent_count + response.failed_count;
			if (
				totalMessages > 0 &&
				!started &&
				totalMessages !== campaign.sent_count + campaign.failed_count
			) {
				setStarted(true);
			}

			updateCampaignAction(response as any);

			if (response.status === 'completed') {
				setStarted(false);
			}
		} catch (err) {
			console.error(err);
			setError(
				__(
					'Failed to load campaign analytics. Retrying...',
					'quillcrm'
				)
			);
		} finally {
			setIsFetching(false);
		}
	}, [campaign?.id, campaign?.sent_count, campaign?.failed_count, isFetching, started, updateCampaignAction]);

	// @ts-ignore
	useEffect(() => {
		let timeout;
		if (
			campaign &&
			(campaign.status === 'processing' ||
				campaign.status === 'resending')
		) {
			timeout = setTimeout(fetchCampaign, 5000);
		}

		return () => {
			clearTimeout(timeout);
		};
	}, [campaign, fetchCampaign]);

	const calculatePercentage = (total: number, value: number) => {
		if (total === 0) {
			return '0.00';
		}

		return ((value / total) * 100).toFixed(2);
	};

	if (!campaign) {
		return null;
	}

	return (
		<div className="flex flex-col gap-5 w-1/3">
			<Card className="bg-[#F8F8F8] shadow-none w-full px-5">
				<CardHeader className="border-b pb-4 px-0">
					<CardTitle className="text-xl font-medium text-[#09090B]">
						{__('Campaign Performance (Analytics)', 'quillcrm')}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-5 pt-5">
					{/* Error message */}
					{error && (
						<div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
							{error}
						</div>
					)}

					{/* Metrics */}
					<RenderMetrics
						campaign={campaign}
						calculatePercentage={calculatePercentage}
						totalMessages={totalMessages}
					/>

					{/* Progress indicator - shown if processing and started */}
					{(campaign.status === 'processing' ||
						campaign.status === 'resending') &&
						started && (
							<Card className="shadow-none bg-white p-4">
								<CardHeader>
									<CardTitle className="text-xl font-medium text-[#09090B]">
										{__('Process Sending', 'quillcrm')}
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-2">
									<div className="flex justify-between text-lg font-semibold text-[#16A34A]">
										<span>
											{sprintf(
												__(
													'%d emails sent',
													'quillcrm'
												),
												totalMessages
											)}
										</span>
										<span>
											{totalMessages > 0
												? Math.round(
														(totalMessages /
															campaign.contacts_count) *
															100
													)
												: 0}
											%
										</span>
									</div>
									<Progress
										value={
											totalMessages > 0
												? Math.round(
														(totalMessages /
															campaign.contacts_count) *
															100
													)
												: 0
										}
										className="h-3"
									/>
									<div className="text-base text-gray-500">
										{__(
											'your email are sending right now...',
											'quillcrm'
										)}
									</div>
								</CardContent>
							</Card>
						)}

					{/* Processing message - shown if processing and not started */}
					{(campaign.status === 'processing' ||
						campaign.status === 'resending') &&
						!started && (
							<div className="flex items-center gap-3 p-3">
								<Spinner className="size-5" />
								<span className="text-sm">
									{__(
										'Campaign is being processed...',
										'quillcrm'
									)}
								</span>
							</div>
						)}
				</CardContent>
			</Card>

			{/* Statistics Chart - shown if NOT processing/resending */}
			{campaign.status !== 'processing' &&
				campaign.status !== 'resending' && (
					<Card className="bg-[#F8F8F8] shadow-none w-full px-5">
						<CardHeader className="px-0">
							<CardTitle className="text-xl font-medium text-[#09090B]">
								{__('Statistics', 'quillcrm')}
							</CardTitle>
						</CardHeader>
						<CardContent className="px-0">
							<RenderChart campaign={campaign} />
						</CardContent>
					</Card>
				)}
		</div>
	);
};

export default Analytics;
