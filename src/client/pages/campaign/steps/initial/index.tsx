/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Card } from 'antd';

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
						<Field
							label={__('A/B Test', 'quillcrm')}
							value={campaign.settings?.ab_test}
							onChange={(ab_test) => {
								updateSettings('ab_test', ab_test);
							}}
							type="checkbox"
						/>
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
