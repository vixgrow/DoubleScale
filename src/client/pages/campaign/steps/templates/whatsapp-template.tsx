/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignStep, campaignSteps } from '../shared';
import {
	PanelSettings,
	CategoryIcon,
	PanelLayout,
	PlayIcon,
	Stepper,
} from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { WhatsAppTemplate } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import MessageComposer from './components/message-composer';
import { getCampaignEndpoint } from '@quillcrm/utils';

const WhatsAppTemplateStep: React.FC = () => {
	const { campaign, saving, goToStep } = useCampaignStep();
	const { createNotice } = useDispatch('quillcrm/core');
	const [isSendingTest, setIsSendingTest] = useState(false);
	const [testPhone, setTestPhone] = useState('');

	// Initialize default WhatsApp template
	const defaultTemplate: WhatsAppTemplate = {
		name: __('WhatsApp Message', 'quillcrm'),
		type: CAMPAIGN_CHANNEL.WHATSAPP,
		body: '',
		settings: {
			add_unsubscribe: true,
		},
	};

	const [template, setTemplate] = useState<WhatsAppTemplate>(() => {
		// Safely extract template or use default
		const existingTemplate = campaign?.settings?.templates?.[0];
		if (
			existingTemplate &&
			'type' in existingTemplate &&
			existingTemplate.type === CAMPAIGN_CHANNEL.WHATSAPP
		) {
			// Convert backend format to frontend format
			const backendTemplate = existingTemplate as any;
			return {
				name: backendTemplate.name || defaultTemplate.name,
				type: CAMPAIGN_CHANNEL.WHATSAPP,
				body: backendTemplate.body || '',
				settings: {
					add_unsubscribe:
						backendTemplate.settings?.add_unsubscribe ?? true,
				},
			};
		}
		return defaultTemplate;
	});

	const updateTemplate = (updates: Partial<WhatsAppTemplate>) => {
		setTemplate((prev) => ({
			...prev,
			...updates,
			settings: {
				...prev.settings,
				...(updates.settings || {}),
			},
		}));
	};

	const validate = (): boolean => {
		if (!template.body || template.body.trim().length === 0) {
			createNotice({
				type: 'error',
				message: __('Message content is required', 'quillcrm'),
			});
			return false;
		}

		if (template.body.length > 1600) {
			createNotice({
				type: 'error',
				message: __(
					'Message is too long. Maximum 1600 characters.',
					'quillcrm'
				),
			});
			return false;
		}

		return true;
	};

	const save = async () => {
		if (!campaign || !validate()) {
			return;
		}

		try {
			// Use consistent structure across all campaign types
			const backendTemplate = {
				name: template.name,
				type: template.type,
				body: template.body,
				settings: {
					add_unsubscribe: template.settings?.add_unsubscribe ?? true,
				},
			};

			const endpoint = getCampaignEndpoint(campaign.type);
			if (!endpoint) {
				throw new Error(__('Invalid campaign type', 'quillcrm'));
			}

			await apiFetch({
				path: `${endpoint}/${campaign.id}`,
				method: 'PUT',
				data: {
					...campaign,
					settings: {
						...campaign.settings,
						templates: [backendTemplate],
					},
				},
			});

			goToStep('contacts');
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__(
						'Failed to save template. Please try again.',
						'quillcrm'
					),
			});
		}
	};

	const sendTestWhatsApp = async () => {
		if (!validate()) {
			return;
		}

		// Ask for test phone number if not provided
		const phone =
			testPhone ||
			prompt(
				__(
					'Enter test phone number (E.164 format, e.g., +1234567890):',
					'quillcrm'
				)
			);
		if (!phone) {
			return;
		}

		// Basic E.164 validation
		if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
			createNotice({
				type: 'error',
				message: __(
					'Please enter a valid phone number in E.164 format (e.g., +1234567890)',
					'quillcrm'
				),
			});
			return;
		}

		setTestPhone(phone);
		setIsSendingTest(true);

		try {
			await apiFetch({
				path: '/qc/v1/whatsapp-campaigns/send-test-whatsapp',
				method: 'POST',
				data: {
					phone: phone,
					message: template.body,
				},
			});

			createNotice({
				type: 'success',
				message: __(
					'Test WhatsApp message sent successfully',
					'quillcrm'
				),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to send test WhatsApp message', 'quillcrm'),
			});
		} finally {
			setIsSendingTest(false);
		}
	};

	return (
		<PanelLayout
			items={[
				{
					label: __('Create Campaign', 'quillcrm'),
					href: 'campaigns',
				},
				{
					label: campaign?.settings.ab_test
						? __('A/B Test Campaign', 'quillcrm')
						: __('Standard Campaign', 'quillcrm'),
				},
			]}
			panelbtns={[
				<Button variant="secondaryDeepBlue">
					<PlayIcon />
					{__('Watch Tutorial', 'quillcrm')}
				</Button>,
			]}
			type="campaign"
		>
			<Stepper
				steps={campaignSteps.filter((step) => step.slug !== 'builder')}
				canProceed="true"
				currentStep={1}
			/>

			<div className="w-full max-w-2xl">
				<PanelSettings
					title={__('WhatsApp Message', 'quillcrm')}
					description={__(
						'Compose your WhatsApp message. You can send text or media messages with optional captions.',
						'quillcrm'
					)}
					icon={<CategoryIcon />}
				>
					<div className="space-y-4">
						<MessageComposer
							value={template.body}
							onChange={(value) =>
								updateTemplate({ body: value })
							}
							label={__('Message', 'quillcrm')}
							placeholder={__(
								'Enter your WhatsApp message here...',
								'quillcrm'
							)}
							maxLength={1600}
							required={true}
							helpText={__(
								'Use {{contact:first_name}}, {{contact:last_name}}, etc. for personalization',
								'quillcrm'
							)}
						/>

						<Separator />

						<div className="flex items-center justify-between">
							<div>
								<p className="text-lg font-semibold text-foreground">
									{__('Add Unsubscribe Option', 'quillcrm')}
								</p>
								<p className="text-sm text-muted-foreground">
									{__(
										'Automatically add an unsubscribe option to the message',
										'quillcrm'
									)}
								</p>
							</div>
							<Switch
								checked={template.settings?.add_unsubscribe}
								onCheckedChange={(checked) =>
									updateTemplate({
										settings: {
											...template.settings,
											add_unsubscribe: checked,
										},
									})
								}
							/>
						</div>

						<Separator />

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">
								<strong>{__('Note:', 'quillcrm')}</strong>{' '}
								{__(
									'WhatsApp requires recipients to have messaged your WhatsApp number first, or you must use an approved template. Messages may fail if these conditions are not met.',
									'quillcrm'
								)}
							</p>
						</div>

						<div className="mt-4 flex gap-4">
							<Button
								variant="outline"
								onClick={sendTestWhatsApp}
								disabled={isSendingTest || saving}
							>
								{isSendingTest
									? __('Sending...', 'quillcrm')
									: __('Send Test WhatsApp', 'quillcrm')}
							</Button>
							<Button
								variant="default"
								onClick={save}
								disabled={saving}
								className="px-6"
							>
								{saving
									? __('Saving...', 'quillcrm')
									: __('Save & Continue', 'quillcrm')}
							</Button>
						</div>
					</div>
				</PanelSettings>
			</div>
		</PanelLayout>
	);
};

export default WhatsAppTemplateStep;
