/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { useCampaignStep, campaignSteps } from '../shared';
import {
	PanelSettings,
	PanelLayout,
	PlayIcon,
	Stepper,
	Field,
	NoticeBanner,
	AlertCircleIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Campaign, NoticeMessage } from '@doublescale/client';
import type { ExtendedCampaign } from '@/stores/campaign/types';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { getCampaignEndpoint } from '@doublescale/utils';
import { MessageCircle, FileText } from 'lucide-react';

/**
 * WhatsApp Template interface
 */
interface WhatsAppBusinessTemplate {
	id?: number;
	sid?: string;
	name: string;
	body: string;
	category?: string;
	language?: string;
	settings?: {
		external_id?: string;
		variables?: Record<string, any>;
	};
}

/**
 * WhatsApp Template Step Component
 * 
 * For WhatsApp campaigns, users must select an approved business template
 * from Meta Business Suite. Free-text messages are not supported for bulk campaigns.
 */
const WhatsAppTemplateStep: React.FC = () => {
	const { campaign, saving, goToStep, updateCampaign, isNewCampaign } = useCampaignStep();

	// Template state
	const [templates, setTemplates] = useState<WhatsAppBusinessTemplate[]>([]);
	const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppBusinessTemplate | null>(null);
	const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// Load templates when component mounts
	useEffect(() => {
		loadTemplates();
	}, []);

	// Sync with existing campaign template
	useEffect(() => {
		if (campaign?.settings?.templates?.[0] && templates.length > 0) {
			const existingTemplate = campaign.settings.templates[0] as any;
			
			// Find matching template by id or sid
			const matchingTemplate = templates.find(
				t => t.id === existingTemplate.id || 
				     t.sid === existingTemplate.settings?.external_id
			);
			
			if (matchingTemplate) {
				setSelectedTemplate(matchingTemplate);
				// Restore variable mappings if saved
				if (existingTemplate.settings?.variable_mappings) {
					setTemplateVariables(existingTemplate.settings.variable_mappings);
				}
			}
		}
	}, [campaign?.settings?.templates, templates]);

	/**
	 * Load WhatsApp templates from provider via API
	 */
	const loadTemplates = async () => {
		setIsLoadingTemplates(true);
		setFetchError(null);
		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/whatsapp/templates',
			});

			if (response.success && response.templates) {
				setTemplates(response.templates);
			} else {
				setTemplates([]);
			}
		} catch (error: any) {
			console.error('[WhatsApp Campaign] Failed to fetch templates:', error);
			const errorMessage = error.message || __('Failed to load WhatsApp templates', 'doublescale');
			setFetchError(errorMessage);
			setTemplates([]);
		} finally {
			setIsLoadingTemplates(false);
		}
	};

	/**
	 * Handle template selection
	 */
	const handleTemplateSelect = (template: WhatsAppBusinessTemplate) => {
		setSelectedTemplate(template);

		// Initialize variables from template
		const variables: Record<string, string> = {};
		const templateVars = normalizeTemplateVariables(template.settings?.variables);
		templateVars.forEach((variable) => {
			variables[variable.index.toString()] = '';
		});
		setTemplateVariables(variables);
	};

	/**
	 * Normalize template variables from various formats
	 */
	const normalizeTemplateVariables = (variables: any): Array<{index: number; example?: string}> => {
		if (!variables || typeof variables !== 'object') {
			return [];
		}

		return Object.keys(variables)
			.filter(key => !isNaN(parseInt(key, 10)))
			.map(index => ({
				index: parseInt(index, 10),
				example: '',
			}))
			.sort((a, b) => a.index - b.index);
	};

	/**
	 * Handle variable value change
	 */
	const handleVariableChange = (index: string, value: string) => {
		setTemplateVariables((prev) => ({
			...prev,
			[index]: value,
		}));
	};

	/**
	 * Validate before saving
	 */
	const validate = (): boolean => {
		if (!selectedTemplate) {
			setNotice({
				type: 'error',
				message: __('Please select a WhatsApp template', 'doublescale'),
			});
			return false;
		}

		return true;
	};

	/**
	 * Save template and continue to next step
	 */
	const save = async () => {
		if (!campaign || !validate()) {
			return;
		}

		setIsSaving(true);

		try {
			let templateId = selectedTemplate?.id;

			// If template doesn't have a local ID, save it first
			if (!templateId && selectedTemplate?.sid) {
				const saveResponse: any = await apiFetch({
					path: '/doublescale/v1/whatsapp/templates/save',
					method: 'POST',
					data: {
						sid: selectedTemplate.sid,
						name: selectedTemplate.name,
						body: selectedTemplate.body,
						category: selectedTemplate.category,
						language: selectedTemplate.language,
						variables: selectedTemplate.settings?.variables,
						variable_mappings: templateVariables,
					},
				});

				if (saveResponse.success && saveResponse.template_id) {
					templateId = saveResponse.template_id;
				} else {
					throw new Error(__('Failed to save template', 'doublescale'));
				}
			}

			// Build template data for campaign
			const backendTemplate = {
				id: templateId,
				name: selectedTemplate?.name,
				type: CAMPAIGN_CHANNEL.WHATSAPP,
				body: selectedTemplate?.body || '',
				settings: {
					external_id: selectedTemplate?.sid,
					variables: selectedTemplate?.settings?.variables,
					variable_mappings: templateVariables,
				},
			};

			const endpoint = getCampaignEndpoint(campaign.type);
			if (!endpoint) {
				throw new Error(__('Invalid campaign type', 'doublescale'));
			}

			const response = await apiFetch({
				path: `${endpoint}/${campaign.id}`,
				method: 'PUT',
				data: {
					...campaign,
					settings: {
						...campaign.settings,
						templates: [backendTemplate],
					},
				},
			}) as Campaign;

			// Update campaign store with response data
			updateCampaign(response as Partial<ExtendedCampaign>);

			setNotice({
				type: 'success',
				message: __('Template saved successfully', 'doublescale'),
			});

			goToStep('contacts');
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message || __('Failed to save template. Please try again.', 'doublescale'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const templateVars = normalizeTemplateVariables(selectedTemplate?.settings?.variables);
	const hasVariables = templateVars.length > 0;

	return (
		<PanelLayout
			items={[
				{
					label: __('Create Campaign', 'doublescale'),
					href: 'campaigns',
				},
				{
					label: __('WhatsApp Campaign', 'doublescale'),
				},
			]}
			panelbtns={[
				<Button variant="secondaryDeepBlue" key="tutorial">
					<PlayIcon />
					{__('Watch Tutorial', 'doublescale')}
				</Button>,
			]}
			type="campaign"
		>
		<Stepper
			steps={campaignSteps.filter((step) => step.slug !== 'builder')}
			canProceed="true"
			currentStep={1}
			onStepClick={goToStep}
			disableNavigation={isNewCampaign}
		/>

			<div className="w-full max-w-2xl">
				{/* Notice Banner */}
				{notice && (
					<div className="mb-4">
						<NoticeBanner
							notice={notice}
							closeNotice={() => setNotice(null)}
						/>
					</div>
				)}

				<PanelSettings
					title={__('WhatsApp Template', 'doublescale')}
					description={__(
						'Select an approved WhatsApp Business template for your campaign. Templates must be pre-approved in your Meta Business Suite.',
						'doublescale'
					)}
					icon={
						<div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center">
							<MessageCircle className="w-5 h-5 text-white" />
						</div>
					}
				>
					<div className="space-y-6">
						{/* WhatsApp Business Template Requirement Notice */}
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
							<div className="flex gap-3">
								<AlertCircleIcon width={24} height={24} color="#D97706" />
								<div>
									<p className="text-sm font-medium text-amber-900 mb-1">
									{__('WhatsApp Business Templates Required', 'doublescale')}
								</p>
								<p className="text-sm text-amber-800">
									{__('WhatsApp campaigns require pre-approved business templates. Create and approve templates in your Meta Business Suite before using them here.', 'doublescale')}
								</p>
								</div>
							</div>
						</div>

						{/* Template Selector */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								{__('Select Template', 'doublescale')} *
							</label>
							{isLoadingTemplates ? (
								<div className="flex items-center gap-2 text-sm text-gray-500 py-4">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
									{__('Loading templates...', 'doublescale')}
								</div>
							) : fetchError ? (
								/* API Error - Failed to fetch templates */
								<div className="bg-red-50 border border-red-200 rounded-lg p-4">
									<div className="flex gap-3">
										<AlertCircleIcon width={24} height={24} color="#DC2626" />
										<div>
											<p className="text-sm font-medium text-red-900 mb-1">
												{__('Failed to load templates', 'doublescale')}
											</p>
											<p className="text-sm text-red-800 mb-2">
												{fetchError}
											</p>
											<Button
												variant="outline"
												size="sm"
												onClick={loadTemplates}
											>
												{__('Try Again', 'doublescale')}
											</Button>
										</div>
									</div>
								</div>
							) : templates.length === 0 ? (
								/* No templates exist in provider account */
								<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
									<div className="flex gap-3">
										<AlertCircleIcon width={24} height={24} color="#CA8A04" />
										<div>
											<p className="text-sm font-medium text-yellow-900 mb-1">
												{__('No WhatsApp templates found', 'doublescale')}
											</p>
											<p className="text-sm text-yellow-800">
												{__('Create and approve templates in your Meta Business Suite, then import them via Settings > WhatsApp Templates.', 'doublescale')}
											</p>
											<Button
												variant="outline"
												size="sm"
												className="mt-2"
												onClick={loadTemplates}
											>
												{__('Refresh Templates', 'doublescale')}
											</Button>
										</div>
									</div>
								</div>
							) : (
								<select
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
									value={selectedTemplate?.sid || selectedTemplate?.id || ''}
									onChange={(e) => {
										const template = templates.find(
											(t) => (t.sid || t.id?.toString()) === e.target.value
										);
										if (template) {
											handleTemplateSelect(template);
										}
									}}
								>
									<option value="">
										{__('Select a template...', 'doublescale')}
									</option>
									{templates.map((template) => (
										<option key={template.sid || template.id} value={template.sid || template.id}>
											{template.name} {template.category ? `(${template.category})` : ''}
										</option>
									))}
								</select>
							)}
						</div>

						{/* Template Preview */}
						{selectedTemplate && (
							<>
								<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<FileText className="w-4 h-4 text-gray-500" />
										<p className="text-xs font-medium text-gray-500 uppercase">
											{__('Template Preview', 'doublescale')}
										</p>
									</div>
									<p className="text-sm text-gray-700 whitespace-pre-wrap">
										{selectedTemplate.body}
									</p>
									{selectedTemplate.category && (
										<p className="text-xs text-gray-500 mt-2">
											{__('Category:', 'doublescale')} {selectedTemplate.category}
										</p>
									)}
								</div>

								{/* Template Variables */}
								{hasVariables && (
									<div className="space-y-4">
										<div>
											<p className="text-sm font-medium text-gray-700 mb-1">
												{__('Template Variables', 'doublescale')}
											</p>
											<p className="text-xs text-gray-500">
												{__('Map each variable to a value or merge tag. Use merge tags like {{contact:first_name}} for personalization.', 'doublescale')}
											</p>
										</div>
										{templateVars.map((variable) => (
											<Field
												key={variable.index}
												label={`{{${variable.index}}}`}
												placeholder={__('Enter value or merge tag...', 'doublescale')}
												value={templateVariables[variable.index.toString()] || ''}
												onChange={(value) =>
													handleVariableChange(variable.index.toString(), value)
												}
												type="text"
												helperText={__('Example: {{contact:first_name}} or static text', 'doublescale')}
											/>
										))}
									</div>
								)}
							</>
						)}

						<Separator />

						{/* Info boxes */}
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
							<p className="text-sm text-gray-700">
								<strong>{__('Unsubscribe:', 'doublescale')}</strong>{' '}
								{__(
									'When a contact replies STOP, UNSUBSCRIBE, or similar keywords, DoubleScale automatically unsubscribes them from WhatsApp — no extra setup required.',
									'doublescale'
								)}
							</p>
							<p className="text-sm text-gray-600">
								{__(
									'Unlike SMS, the "Reply STOP to unsubscribe" sentence is not added automatically. Include it in your Meta message template if you want recipients to see opt-out instructions.',
									'doublescale'
								)}
							</p>
						</div>

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">
								<strong>{__('Recipient Requirements:', 'doublescale')}</strong>{' '}
								{__(
									'Contacts must have a WhatsApp phone number set. Contacts without a valid WhatsApp phone will be skipped.',
									'doublescale'
								)}
							</p>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4 pt-4">
							<Button
								variant="default"
								onClick={save}
								disabled={isSaving || saving || !selectedTemplate}
								className="px-6"
							>
								{isSaving || saving
									? __('Saving...', 'doublescale')
									: __('Save & Continue', 'doublescale')}
							</Button>
						</div>
					</div>
				</PanelSettings>
			</div>
		</PanelLayout>
	);
};

export default WhatsAppTemplateStep;
