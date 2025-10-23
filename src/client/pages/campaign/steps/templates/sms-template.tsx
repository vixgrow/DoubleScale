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
import type { SMSTemplate } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import MessageComposer from './components/message-composer';
import { getCampaignEndpoint } from '@quillcrm/utils';

const SMSTemplateStep: React.FC = () => {
	const { campaign, saving, goToStep } = useCampaignStep();
	const { createNotice } = useDispatch('quillcrm/core');
	const [isSendingTest, setIsSendingTest] = useState(false);
	const [testPhone, setTestPhone] = useState('');

	// Initialize default SMS template
	const defaultTemplate: SMSTemplate = {
		name: __('SMS Message', 'quillcrm'),
		type: CAMPAIGN_CHANNEL.SMS,
		body: '',
		settings: {
			add_unsubscribe: true,
		},
	};

	const [template, setTemplate] = useState<SMSTemplate>(() => {
		// Safely extract template or use default
		const existingTemplate = campaign?.settings?.templates?.[0];
		if (
			existingTemplate &&
			'type' in existingTemplate &&
			existingTemplate.type === CAMPAIGN_CHANNEL.SMS
		) {
			// Convert backend format to frontend format
			const backendTemplate = existingTemplate as any;
			return {
				name: backendTemplate.name || defaultTemplate.name,
				type: CAMPAIGN_CHANNEL.SMS,
				body: backendTemplate.body || '',
				settings: {
					add_unsubscribe:
						backendTemplate.settings?.add_unsubscribe ?? true,
				},
			};
		}
		return defaultTemplate;
	});

	const updateTemplate = (updates: Partial<SMSTemplate>) => {
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

	const sendTestSMS = async () => {
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
				path: '/qc/v1/sms-campaigns/send-test-sms',
				method: 'POST',
				data: {
					phone: phone,
					message: template.body,
				},
			});

			createNotice({
				type: 'success',
				message: __('Test SMS sent successfully', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to send test SMS', 'quillcrm'),
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
					title={__('SMS Message', 'quillcrm')}
					description={__(
						'Compose your SMS message. You can use merge tags like {{contact:first_name}} to personalize messages.',
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
							label={__('SMS Message', 'quillcrm')}
							placeholder={__(
								'Enter your SMS message here...',
								'quillcrm'
							)}
							maxLength={1600}
							helpText={__(
								'Use {{contact:first_name}}, {{contact:last_name}}, etc. for personalization',
								'quillcrm'
							)}
						/>

						<Separator />

						<div className="flex items-center justify-between">
							<div>
								<p className="text-lg font-semibold text-foreground">
									{__('Add Unsubscribe Link', 'quillcrm')}
								</p>
								<p className="text-sm text-muted-foreground">
									{__(
										'Automatically add an unsubscribe link to the SMS',
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

						<div className="mt-4 flex gap-4">
							<Button
								variant="outline"
								onClick={sendTestSMS}
								disabled={isSendingTest || saving}
							>
								{isSendingTest
									? __('Sending...', 'quillcrm')
									: __('Send Test SMS', 'quillcrm')}
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

export default SMSTemplateStep;
