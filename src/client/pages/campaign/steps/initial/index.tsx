/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Input, Card, Typography, Checkbox } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';

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
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('Name', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={campaign.name}
									onChange={(e) => {
										updateCampaign({
											name: e.target.value,
										});
									}}
								/>
							</div>
						</div>
						<div
							className="qcrm-field"
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								marginBottom: 20,
							}}
						>
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('A/B Test', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Checkbox
									checked={campaign.settings?.ab_test}
									onChange={(e) => {
										updateSettings(
											'ab_test',
											e.target.checked
										);
									}}
								/>
							</div>
						</div>
					</div>
					<div className="qcrm-actions">
						<Button
							type="primary"
							loading={isSaving}
							onClick={save}
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
