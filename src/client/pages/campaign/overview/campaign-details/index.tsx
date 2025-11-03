/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { Campaign as CampaignType } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';

const CampaignDetails: React.FC = () => {
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	) as CampaignType | null;

	const [renderedTemplates, setRenderedTemplates] = useState<Record<number, string>>({});

	// Render template bodies from JSON to HTML
	useEffect(() => {
		if (!campaign?.settings?.templates) {
			return;
		}

		const renderTemplates = async () => {
			const rendered: Record<number, string> = {};

			for (const template of campaign.settings.templates) {
				if (template.id) {
					try {
						// Try to render via API endpoint
						const response: any = await apiFetch({
							path: `/qc/v1/templates/${template.id}/render`,
							method: 'POST',
						});

						if (response?.html) {
							rendered[template.id] = response.html;
						} else {
							// Fallback to displaying body as-is
							const body = typeof template.body === 'string' ? template.body : JSON.stringify(template.body);
							rendered[template.id] = body || '';
						}
					} catch (error) {
						console.error('Failed to render template:', error);
						// Fallback to displaying body as-is
						const body = typeof template.body === 'string' ? template.body : JSON.stringify(template.body);
						rendered[template.id] = body || '';
					}
				}
			}

			setRenderedTemplates(rendered);
		};

		renderTemplates();
	}, [campaign?.settings?.templates]);

	if (!campaign) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-gray-500">
					{__('No campaign data available', 'quillcrm')}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Campaign Info */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<span className="text-base text-gray-500">
						{__('Title', 'quillcrm')}
					</span>
					<p className="text-base font-semibold text-[#09090B]">
						{campaign.name}
					</p>
				</div>

				{campaign.type === CAMPAIGN_CHANNEL.EMAIL &&
					campaign.settings?.templates?.[0]?.subject && (
						<div className="space-y-1">
							<span className="text-base text-gray-500">
								{__('Subject', 'quillcrm')}
							</span>
							<p className="text-base font-semibold text-[#09090B]">
								{campaign.settings.templates[0].subject}
							</p>
						</div>
					)}

				{campaign.execute_at && (
					<div className="space-y-1">
						<span className="text-base text-gray-500">
							{__('Scheduled On', 'quillcrm')}
						</span>
						<p className="text-base font-semibold text-[#09090B]">
							{new Date(campaign.execute_at).toLocaleString()}
						</p>
					</div>
				)}

				<div className="space-y-1">
					<span className="text-base text-gray-500">
						{__('Total Recipients', 'quillcrm')}
					</span>
					<p className="text-base font-semibold text-[#09090B]">
						{campaign.contacts_count}
					</p>
				</div>
			</div>

			{/* Email Template */}
			{campaign.settings?.templates &&
				campaign.settings.templates.length > 0 && (
					<div className="space-y-3 border-t pt-4">
						<h3 className="text-2xl font-medium">
							{campaign.type === CAMPAIGN_CHANNEL.EMAIL
								? __('Email Template', 'quillcrm')
								: __('Message Template', 'quillcrm')}
						</h3>

						{campaign.settings.templates.map((template, index) => {
							const renderedHtml = template.id
								? renderedTemplates[template.id]
								: (typeof template.body === 'string' ? template.body : JSON.stringify(template.body));

							return (
								<div
									key={index}
									className="space-y-4 bg-[#E3EEFF99] p-4 rounded-lg border"
								>
									{/* Template Body */}
									{renderedHtml ? (
										<div
											className="template-body-preview rounded border"
											dangerouslySetInnerHTML={{
												__html: renderedHtml || '',
											}}
										/>
									) : (
										<div className="flex items-center justify-center py-8 text-gray-500">
											{__('Loading template...', 'quillcrm')}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
		</div>
	);
};

export default CampaignDetails;
