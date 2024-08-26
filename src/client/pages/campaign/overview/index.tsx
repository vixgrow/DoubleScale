/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Card, Flex, Typography } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../state/context';

const Overview: React.FC = () => {
	const { campaign, isLoading, updateCampaign, setIsLoading } =
		useCampaignContext();

	const fetchCampaign = async () => {
		if (!campaign) {
			return;
		}

		setIsLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
			})) as any;

			updateCampaign(response);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (campaign && campaign.status === 'processing') {
			fetchCampaign();
		}
	}, [campaign]);

	return (
		<Card
			loading={isLoading}
			title={
				<Flex justify="space-between">
					<Typography.Title level={4} style={{ margin: 0 }}>
						{__('Overview')}
					</Typography.Title>
					<Typography.Text>{campaign?.status}</Typography.Text>
				</Flex>
			}
		>
			{campaign && (
				<Flex gap={20}>
					<Card>
						<Flex vertical={true} gap={10}>
							<Typography.Text strong>
								{__('Contacts')}
							</Typography.Text>
							<Typography.Text>
								{campaign.contacts_count}
							</Typography.Text>
						</Flex>
					</Card>
					<Card>
						<Flex vertical={true} gap={10}>
							<Typography.Text strong>
								{__('Sent')}
							</Typography.Text>
							<Typography.Text>
								{campaign.sent_count}
							</Typography.Text>
						</Flex>
					</Card>
					<Card>
						<Flex vertical={true} gap={10}>
							<Typography.Text strong>
								{__('Opened')}
							</Typography.Text>
							<Typography.Text>
								{campaign.opened_count}
							</Typography.Text>
						</Flex>
					</Card>
					<Card>
						<Flex vertical={true} gap={10}>
							<Typography.Text strong>
								{__('Clicked')}
							</Typography.Text>
							<Typography.Text>
								{campaign.clicked_count}
							</Typography.Text>
						</Flex>
					</Card>
				</Flex>
			)}
		</Card>
	);
};

export default Overview;
