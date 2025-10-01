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
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { PanelLayout, PanelSettings, CategoryIcon } from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { SMSTemplate } from '@quillcrm/client';
import MessageComposer from './components/message-composer';

const SMSTemplateStep: React.FC = () => {
	const { campaign, saveCampaign, isSaving } = useCampaignContext();
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');
	const [isSendingTest, setIsSendingTest] = useState(false);
	const [testPhone, setTestPhone] = useState('');

	// Initialize default SMS template
	const defaultTemplate: SMSTemplate = {
		name: __('SMS Message', 'quillcrm'),
		type: 'sms',
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
			existingTemplate.type === 'sms'
		) {
			// Convert backend format to frontend format
			const backendTemplate = existingTemplate as any;
			return {
				name: backendTemplate.name || defaultTemplate.name,
				type: 'sms',
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

		// Use consistent structure across all campaign types
		const backendTemplate = {
			name: template.name,
			type: template.type,
			body: template.body,
			settings: {
				add_unsubscribe: template.settings?.add_unsubscribe ?? true,
			},
		};

		await saveCampaign({
			settings: {
				...campaign.settings,
				templates: [backendTemplate],
			},
		});
		navigate(getToLink(`campaigns/${campaign.id}/contacts`));
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
		<div>
			<PanelLayout
				items={[
					{
						label: __('Create Campaign', 'quillcrm'),
						href: 'campaigns',
					},
					{
						label: __('SMS Campaign', 'quillcrm'),
					},
				]}
				totalSteps={1}
				currentStep={0}
				onNext={save}
				onBack={() => navigate(getToLink(`campaigns`))}
			>
				<div className="flex gap-6">
					<PanelSettings
						title={__('SMS Message', 'quillcrm')}
						description={__(
							'Compose your SMS message. You can use merge tags like {{contact:first_name}} to personalize messages.',
							'quillcrm'
						)}
						icon={<CategoryIcon />}
						className="w-full max-w-2xl"
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

							<div className="mt-4">
								<Button
									variant="default"
									onClick={sendTestSMS}
									disabled={isSendingTest || isSaving}
								>
									{isSendingTest
										? __('Sending...', 'quillcrm')
										: __('Send Test SMS', 'quillcrm')}
								</Button>
							</div>
						</div>
					</PanelSettings>
				</div>
			</PanelLayout>
		</div>
	);
};

export default SMSTemplateStep;
