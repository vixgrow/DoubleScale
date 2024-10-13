/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Card, Flex, Typography } from 'antd';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { Field } from '@quillcrm/components';

const Initial: React.FC = () => {
	const {
		campaign,
		updateCampaign,
		isLoading,
		saveCampaign,
		isSaving,
		updateSettings,
	} = useCampaignContext();
	const navigate = useNavigate();

	const save = async () => {
		if (!campaign) {
			return;
		}

		try {
			await saveCampaign();
			navigate(getToLink(`campaigns/${campaign.id}/template`));
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Card loading={isLoading}>
			{campaign && (
				<>
					<div className="qcrm-fields">
						<Field
							label={__('Name', 'quillcrm')}
							value={campaign.name}
							onChange={(name) => {
								updateCampaign({
									name,
								});
							}}
							type="text"
						/>
						<Flex gap={10} vertical>
							<Typography.Title
								level={4}
								style={{ textAlign: 'center', marginTop: 0 }}
							>
								{__('Select a campaign type', 'quillcrm')}
							</Typography.Title>
							<Flex gap={10} vertical>
								<Card
									className={classnames(
										'qcrm-campaign-type-card',
										{
											'qcrm-card-active':
												!campaign.settings?.ab_test,
										}
									)}
									onClick={() =>
										updateSettings('ab_test', false)
									}
								>
									<Typography.Title level={4}>
										{__('Standard', 'quillcrm')}
									</Typography.Title>
									<Typography.Text>
										{__(
											'Send a regular, one-time email campaign',
											'quillcrm'
										)}
									</Typography.Text>
								</Card>
								<Card
									className={classnames(
										'qcrm-campaign-type-card',
										{
											'qcrm-card-active':
												campaign.settings?.ab_test,
										}
									)}
									onClick={() =>
										updateSettings('ab_test', true)
									}
								>
									<Typography.Title level={4}>
										{__('A/B Test', 'quillcrm')}
									</Typography.Title>
									<Typography.Text>
										{__(
											'Test multiple versions of your campaign to see which performs best',
											'quillcrm'
										)}
									</Typography.Text>
								</Card>
							</Flex>
						</Flex>
					</div>
					<div className="qcrm-actions">
						<Button
							type="primary"
							loading={isSaving}
							onClick={save}
							disabled={!campaign.name || isSaving}
						>
							{__('Next', 'quillcrm')}
						</Button>
					</div>
				</>
			)}
		</Card>
	);
};

export default Initial;
