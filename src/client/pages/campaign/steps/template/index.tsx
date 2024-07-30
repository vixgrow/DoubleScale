/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Button, Input, Card, Typography } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { Template as TemplateType } from '../../../types';
import { useNavigate, getToLink } from '@quillcrm/navigation';

const Template: React.FC = () => {
	const {
		campaign,
		updateCampaign,
		isLoading,
		saveCampaign,
		isSaving,
		template,
		setTemplate,
		updateTemplate,
	} = useCampaignContext();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (campaign?.settings.template_id) {
			fetchTemplate(campaign.settings.template_id);
		} else {
			setLoading(false);
		}
	}, []);

	const fetchTemplate = async (id: number) => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/templates/${id}`,
			})) as TemplateType;

			setTemplate(response);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const saveTemplate = async () => {
		if (!campaign) {
			return;
		}

		setSaving(true);

		try {
			const response = (await createOrUpdate()) as TemplateType;
			setTemplate(response);
			updateCampaign({
				settings: {
					...campaign.settings,
					template_id: response.id,
				},
			});

			// navigate(getToLink(`campaigns/${campaign.id}/template`));
		} catch (error) {
			console.error(error);
		} finally {
			setSaving(false);
		}
	};

	const createOrUpdate = async () => {
		if (!campaign) {
			return;
		}

		let response;
		if (campaign.settings.template_id) {
			response = (await apiFetch({
				path: `/qc/v1/templates/${campaign.settings.template_id}`,
				method: 'PUT',
				data: template,
			})) as TemplateType;
		} else {
			response = (await apiFetch({
				path: `/qc/v1/templates`,
				method: 'POST',
				data: template,
			})) as TemplateType;
		}

		return response;
	};
	console.log('campaign', campaign);

	return (
		<Card loading={isLoading || loading}>
			{campaign && (
				<>
					<div className="qcrm-fields">
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('Subject', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={template?.subject}
									onChange={(e) =>
										updateTemplate({
											subject: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('Body', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input.TextArea
									value={template?.body}
									onChange={(e) =>
										updateTemplate({
											body: e.target.value,
										})
									}
								/>
							</div>
						</div>
					</div>
					<div className="qcrm-actions">
						<Button
							type="primary"
							onClick={() => {
								saveTemplate();
							}}
							loading={isSaving || saving}
						>
							{__('Next', 'quillcrm')}
						</Button>
					</div>
				</>
			)}
		</Card>
	);
};

export default Template;
