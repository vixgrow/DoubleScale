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
import type { WhatsAppTemplate } from '@quillcrm/client';
import MessageComposer from './components/message-composer';

const WhatsAppTemplateStep: React.FC = () => {
	const { campaign, saveCampaign, isSaving } = useCampaignContext();
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');
	const [isSendingTest, setIsSendingTest] = useState(false);
	const [testPhone, setTestPhone] = useState('');

	// Initialize default WhatsApp template
	const defaultTemplate: WhatsAppTemplate = {
		name: __('WhatsApp Message', 'quillcrm'),
		type: 'whatsapp',
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
			existingTemplate.type === 'whatsapp'
		) {
			// Convert backend format to frontend format
			const backendTemplate = existingTemplate as any;
			return {
				name: backendTemplate.name || defaultTemplate.name,
				type: 'whatsapp',
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
		<div>
			<PanelLayout
				items={[
					{
						label: __('Create Campaign', 'quillcrm'),
						href: 'campaigns',
					},
					{
						label: __('WhatsApp Campaign', 'quillcrm'),
					},
				]}
				totalSteps={1}
				currentStep={0}
				onNext={save}
				onBack={() => navigate(getToLink(`campaigns`))}
			>
				<div className="flex gap-6">
					<PanelSettings
						title={__('WhatsApp Message', 'quillcrm')}
						description={__(
							'Compose your WhatsApp message. You can send text or media messages with optional captions.',
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
										{__(
											'Add Unsubscribe Option',
											'quillcrm'
										)}
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

							<div className="mt-4">
								<Button
									variant="default"
									onClick={sendTestWhatsApp}
									disabled={isSendingTest || isSaving}
								>
									{isSendingTest
										? __('Sending...', 'quillcrm')
										: __('Send Test WhatsApp', 'quillcrm')}
								</Button>
							</div>
						</div>
					</PanelSettings>
				</div>
			</PanelLayout>
		</div>
	);
};

export default WhatsAppTemplateStep;
