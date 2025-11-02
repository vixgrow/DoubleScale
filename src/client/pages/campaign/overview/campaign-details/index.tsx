/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

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

	if (!campaign) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-gray-500">{__('No campaign data available', 'quillcrm')}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Campaign Info */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<span className="text-sm text-gray-500">
						{__('Campaign Name', 'quillcrm')}
					</span>
					<p className="text-base font-medium text-gray-900">
						{campaign.name}
					</p>
				</div>
				
				{campaign.type === CAMPAIGN_CHANNEL.EMAIL && campaign.settings?.templates?.[0]?.subject && (
					<div className="space-y-1">
						<span className="text-sm text-gray-500">
							{__('Subject', 'quillcrm')}
						</span>
						<p className="text-base font-medium text-gray-900">
							{campaign.settings.templates[0].subject}
						</p>
					</div>
				)}
				
				{campaign.execute_at && (
					<div className="space-y-1">
						<span className="text-sm text-gray-500">
							{__('Scheduled On', 'quillcrm')}
						</span>
						<p className="text-base font-medium text-gray-900">
							{new Date(campaign.execute_at).toLocaleString()}
						</p>
					</div>
				)}
				
				<div className="space-y-1">
					<span className="text-sm text-gray-500">
						{__('Total Recipients', 'quillcrm')}
					</span>
					<p className="text-base font-medium text-gray-900">
						{campaign.contacts_count}
					</p>
				</div>
			</div>

			{/* Email Template */}
			{campaign.settings?.templates && campaign.settings.templates.length > 0 && (
				<div className="space-y-3 border-t pt-4">
					<h3 className="text-base font-semibold text-gray-900">
						{campaign.type === CAMPAIGN_CHANNEL.EMAIL
							? __('Email Template', 'quillcrm')
							: __('Message Template', 'quillcrm')}
					</h3>
					
					{campaign.settings.templates.map((template, index) => (
						<div key={index} className="space-y-4 bg-white p-4 rounded-lg border">
							{/* Template Details */}
							{campaign.type === CAMPAIGN_CHANNEL.EMAIL && (
								<div className="space-y-2">
									{template.settings && 'from_name' in template.settings && template.settings.from_name && (
										<div className="flex gap-2">
											<span className="text-sm text-gray-500 min-w-24">
												{__('From Name:', 'quillcrm')}
											</span>
											<span className="text-sm font-medium text-gray-900">
												{template.settings.from_name}
											</span>
										</div>
									)}
									{template.settings && 'from_email' in template.settings && template.settings.from_email && (
										<div className="flex gap-2">
											<span className="text-sm text-gray-500 min-w-24">
												{__('From Email:', 'quillcrm')}
											</span>
											<span className="text-sm font-medium text-gray-900">
												{template.settings.from_email}
											</span>
										</div>
									)}
									{template.subject && (
										<div className="flex gap-2">
											<span className="text-sm text-gray-500 min-w-24">
												{__('Subject:', 'quillcrm')}
											</span>
											<span className="text-sm font-medium text-gray-900">
												{template.subject}
											</span>
										</div>
									)}
								</div>
							)}
							
							{/* Template Body */}
							<div className="space-y-2">
								<h4 className="text-sm font-semibold text-gray-700">
									{campaign.type === CAMPAIGN_CHANNEL.EMAIL
										? __('Body', 'quillcrm')
										: __('Message', 'quillcrm')}
								</h4>
								<div
									className="template-body-preview p-4 bg-gray-50 rounded border"
									dangerouslySetInnerHTML={{
										__html: template.body || '',
									}}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default CampaignDetails;

