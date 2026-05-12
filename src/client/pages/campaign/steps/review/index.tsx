/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { useCampaignStep, campaignSteps, automatedCampaignSteps } from '../shared';
import {
	PanelLayout,
	PlayIcon,
	Stepper,
	NoticeBanner,
	PreviewEyeIcon,
	CustomDialogHeader,
	ActionIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
} from '@/components/ui/dialog';
import {
	CardLayout,
	CampaignSettingsCard,
	RecipientsCard,
	ScheduleCard,
	SendTestEmailCard,
	SendTestSMSCard,
	SendTestWhatsAppCard,
} from './components';
import type {
	NoticeMessage,
	EmailTemplate,
	SMSTemplate,
	WhatsAppTemplate,
} from '@doublescale/client';

const Review: React.FC = () => {
	const {
		campaign,
		saveCampaignStep,
		saveCampaignSettings,
		goToStep,
		saving,
		isNewCampaign,
	} = useCampaignStep();

	const [sendNow, setSendNow] = useState(true);
	const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
	const [timezoneMode, setTimezoneMode] = useState('user'); // 'user' or 'subscriber'

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const [sendTestDialogOpen, setSendTestDialogOpen] = useState(false);

	const showNotice = (noticeData: NoticeMessage) => {
		setNotice(noticeData);
	};

	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	// State for lists and tags
	const [includedLists, setIncludedLists] = useState<string[]>([]);
	const [includedTags, setIncludedTags] = useState<string[]>([]);
	const [excludedLists, setExcludedLists] = useState<string[]>([]);
	const [excludedTags, setExcludedTags] = useState<string[]>([]);

	// Get template info from campaign
	// Backend attaches templates via attach_templates() method
	type CampaignTemplate = EmailTemplate | SMSTemplate | WhatsAppTemplate;
	const template: CampaignTemplate | null =
		(campaign?.settings?.templates?.[0] as CampaignTemplate) || null;

	// Extract template data based on Template_Field_Mapper structure
	// For email: subject, preview_text, from_name, from_email, reply_to are in settings
	// For SMS/WhatsApp: No sender fields needed (uses global Twilio phone number)
	const isEmailTemplate = template?.type === 'email';
	const isWhatsAppTemplate = template?.type === 'whatsapp';
	const emailSubject =
		isEmailTemplate && (template as EmailTemplate).settings?.subject
			? (template as EmailTemplate).settings!.subject
			: '-';
	const fromName =
		isEmailTemplate && (template as EmailTemplate).settings?.from_name
			? (template as EmailTemplate).settings!.from_name
			: '-';
	const fromEmail =
		isEmailTemplate && (template as EmailTemplate).settings?.from_email
			? (template as EmailTemplate).settings!.from_email
			: '-';
	const replyTo =
		isEmailTemplate && (template as EmailTemplate).settings?.reply_to
			? (template as EmailTemplate).settings!.reply_to
			: '-';
	const previewText =
		isEmailTemplate && (template as EmailTemplate).settings?.preview_text
			? (template as EmailTemplate).settings!.preview_text
			: '-';

	// WhatsApp template data
	const whatsAppTemplateName = isWhatsAppTemplate
		? (template as WhatsAppTemplate).name || '-'
		: '-';
	const whatsAppTemplateBody = isWhatsAppTemplate
		? (template as WhatsAppTemplate).body || ''
		: '';


	// Fetch list and tag names from filters
	useEffect(() => {
		const fetchFilterNames = async () => {
			const filters = campaign?.settings?.filters || [];

			// Parse filters to extract IDs
			const includeListIds: number[] = [];
			const includeTagIds: number[] = [];
			const excludeListIds: number[] = [];
			const excludeTagIds: number[] = [];

			type SegmentFilter = {
				group?: string;
				value?: unknown[];
				operator?: string;
				filter?: string;
			};
			(filters as SegmentFilter[]).forEach((filter) => {
				if (filter.group !== 'segments' || !filter.value?.[0]) return;

				const id = Number((filter.value as unknown[])[0]);
				const isInclude = filter.operator === 'contains';

				if (filter.filter === 'lists_segment') {
					if (isInclude) {
						includeListIds.push(id);
					} else {
						excludeListIds.push(id);
					}
				} else if (filter.filter === 'tags_segment') {
					if (isInclude) {
						includeTagIds.push(id);
					} else {
						excludeTagIds.push(id);
					}
				}
			});

			// Fetch list names
			try {
				if (includeListIds.length > 0) {
					const lists = await Promise.all(
						includeListIds.map(async (listId) => {
							const list = (await apiFetch({
								path: `/doublescale/v1/lists/${listId}`,
							})) as { name?: string };
							return list?.name || '';
						})
					);
					setIncludedLists(lists);
				} else {
					setIncludedLists([__('All Lists', 'doublescale')]);
				}

				if (excludeListIds.length > 0) {
					const lists = await Promise.all(
						excludeListIds.map(async (listId) => {
							const list = (await apiFetch({
								path: `/doublescale/v1/lists/${listId}`,
							})) as { name?: string };
							return list?.name || '';
						})
					);
					setExcludedLists(lists);
				}

				// Fetch tag names
				if (includeTagIds.length > 0) {
					const tags = await Promise.all(
						includeTagIds.map(async (tagId) => {
							const tag = (await apiFetch({
								path: `/doublescale/v1/tags/${tagId}`,
							})) as { name?: string };
							return tag?.name || '';
						})
					);
					setIncludedTags(tags);
				} else {
					setIncludedTags([
						__('All Contact on Selected list Segment', 'doublescale'),
					]);
				}

				if (excludeTagIds.length > 0) {
					const tags = await Promise.all(
						excludeTagIds.map(async (tagId) => {
							const tag = (await apiFetch({
								path: `/doublescale/v1/tags/${tagId}`,
							})) as { name?: string };
							return tag?.name || '';
						})
					);
					setExcludedTags(tags);
				}
			} catch (error) {
				console.error('Error fetching list/tag names:', error);
			}
		};

		if (campaign?.settings?.filters) {
			fetchFilterNames();
		}
	}, [campaign?.settings?.filters]);

	const save = async () => {
		if (!campaign) {
			return;
		}

		const isAutomated = campaign?.settings?.automated === true;

		// Validate schedule if not sending now (non-automated only)
		if (!isAutomated && !sendNow && !scheduledAt) {
			showNotice({
				type: 'error',
				message: __('Please set a schedule date and time', 'doublescale'),
			});
			return;
		}

		try {
			if (isAutomated) {
				const reviewStepData = {
					run_type: 'active',
				};

				const saveSuccess = await saveCampaignStep(
					'review',
					reviewStepData
				);

				if (saveSuccess) {
					await saveCampaignSettings({
						status: 'active',
					});

					showNotice({
						type: 'success',
						message: __('Automated campaign activated successfully!', 'doublescale'),
					});

					goToStep('overview');
				}
			} else {
				const runType = sendNow ? 'processing' : 'schedule';
				const executeAt =
					!sendNow && scheduledAt ? scheduledAt.toISOString() : null;

				const reviewStepData = {
					run_type: runType,
					execute_at: executeAt,
					timezone_mode: timezoneMode,
				};

				const saveSuccess = await saveCampaignStep(
					'review',
					reviewStepData
				);

				if (saveSuccess) {
					const data: { status: string; execute_at?: string } = {
						status: runType,
					};

					if (executeAt) {
						data.execute_at = executeAt;
					}

					await saveCampaignSettings(data);

					if (sendNow) {
						goToStep('overview');
					} else {
						goToStep('view');
					}
				}
			}
		} catch (error) {
			console.error(error);
			showNotice({
				type: 'error',
				message: __(
					'Failed to save campaign. Please try again.',
					'doublescale'
				),
			});
		}
	};

	return (
		<PanelLayout
			items={[
				{
					label: __('Create Campaign', 'doublescale'),
					href: 'campaigns',
				},
				{
					label: campaign?.settings?.automated
						? __('Automated Campaign', 'doublescale')
						: campaign?.settings.ab_test
							? __('A/B Test Campaign', 'doublescale')
							: __('Standard Campaign', 'doublescale'),
				},
			]}
			panelbtns={[
				<Button variant="secondaryDeepBlue">
					<PlayIcon />
					{__('Watch Tutorial', 'doublescale')}
				</Button>,
			]}
			type="campaign"
		>
			<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
					<Stepper
						steps={
							campaign?.settings?.automated
								? automatedCampaignSteps
								: campaign?.type === 'email'
									? campaignSteps
									: campaignSteps.filter((step) => step.slug !== 'builder')
						}
						canProceed="true"
						currentStep={
							campaign?.settings?.automated
								? 6
								: campaign?.type === 'email'
									? 5
									: 3
						}
						onStepClick={goToStep}
						disableNavigation={isNewCampaign}
					/>

					<div className="min-w-0 flex-1 rounded-2xl border border-border bg-[#F7F8FA] p-6">
						<div className="flex items-start justify-between gap-4 pb-6">
							<div>
								<h2 className="text-xl font-semibold tracking-tight text-foreground">
									{__('Review and Confirm', 'doublescale')}
								</h2>
								<p className="mt-3 text-sm leading-snug text-muted-foreground">
									{campaign?.settings?.automated
										? __(
											'Review your automated campaign settings and activate it.',
											'doublescale'
										)
										: __(
											'Define your sender identity, subject line, and optional UTM tracking before building your campaign.',
											'doublescale'
										)}
								</p>
							</div>
							<Button
								type="button"
								variant="secondary"
								className="shrink-0 bg-white"
								onClick={() => setSendTestDialogOpen(true)}
							>
								<PreviewEyeIcon color="#343498"/>
								{campaign?.type === 'sms'
									? __('Preview and Send Test SMS', 'doublescale')
									: campaign?.type === 'whatsapp'
										? __('Preview and Send Test WhatsApp', 'doublescale')
										: __('Preview and Send Test Email', 'doublescale')}
							</Button>
						</div>

						<div className="space-y-6">
							{notice && (
								<NoticeBanner
									ref={noticeBannerRef}
									notice={notice}
									closeNotice={closeNotice}
								/>
							)}

							<CampaignSettingsCard
								campaignType={campaign?.type}
								fromName={fromName}
								fromEmail={fromEmail}
								replyTo={replyTo}
								emailSubject={emailSubject}
								previewText={previewText}
								templateName={whatsAppTemplateName}
								templateBody={whatsAppTemplateBody}
								onEdit={() => goToStep('template')}
								button={
									campaign?.type === 'email' || campaign?.type === 'whatsapp'
								}
							/>

							<RecipientsCard
								includedLists={includedLists}
								includedTags={includedTags}
								excludedLists={excludedLists}
								excludedTags={excludedTags}
								onEdit={() => goToStep('contacts')}
							/>

							{campaign?.settings?.automated && campaign?.settings?.trigger && (
								<CardLayout
									icon={<ActionIcon width={20} height={20} />}
									header={__('Trigger Configuration', 'doublescale')}
									buttonText={__('Edit Trigger', 'doublescale')}
									onButtonClick={() => goToStep('trigger')}
								>
									<div className="space-y-4">
										<div>
											<p className="mb-1 text-base text-gray-500">
												{__('Type', 'doublescale')}
											</p>
											<p className="text-base font-semibold text-gray-900">
												{campaign.settings.trigger.trigger_type === 'event'
													? __('Event-Based', 'doublescale')
													: __('Schedule-Based', 'doublescale')}
											</p>
										</div>
										{campaign.settings.trigger.trigger_type === 'event' &&
											campaign.settings.trigger.event && (
												<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
													<div>
														<p className="mb-1 text-base text-gray-500">
															{__('Event', 'doublescale')}
														</p>
														<p className="text-base font-semibold capitalize text-gray-900">
															{(campaign.settings.trigger.event as any).event_type?.replace(
																/_/g,
																' '
															)}
														</p>
													</div>
													{(campaign.settings.trigger.event as any).post_type && (
														<div>
															<p className="mb-1 text-base text-gray-500">
																{__('Post Type', 'doublescale')}
															</p>
															<p className="text-base font-semibold capitalize text-gray-900">
																{(campaign.settings.trigger.event as any).post_type}
															</p>
														</div>
													)}
													{(campaign.settings.trigger.event as any).categories
														?.length > 0 && (
															<div>
																<p className="mb-1 text-base text-gray-500">
																	{__('Categories', 'doublescale')}
																</p>
																<p className="text-base font-semibold text-gray-900">
																	{
																		(campaign.settings.trigger.event as any).categories
																			.length
																	}{' '}
																	{(campaign.settings.trigger.event as any).categories
																		.length === 1
																		? __('category', 'doublescale')
																		: __('categories', 'doublescale')}
																</p>
															</div>
														)}
												</div>
											)}
										{campaign.settings.trigger.trigger_type === 'schedule' &&
											campaign.settings.trigger.schedule && (
												<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
													<div>
														<p className="mb-1 text-base text-gray-500">
															{__('Frequency', 'doublescale')}
														</p>
														<p className="text-base font-semibold capitalize text-gray-900">
															{(campaign.settings.trigger.schedule as any).frequency}
														</p>
													</div>
													<div>
														<p className="mb-1 text-base text-gray-500">
															{__('Time', 'doublescale')}
														</p>
														<p className="text-base font-semibold text-gray-900">
															{(campaign.settings.trigger.schedule as any).time}
														</p>
													</div>
													{(campaign.settings.trigger.schedule as any).day_of_week && (
														<div>
															<p className="mb-1 text-base text-gray-500">
																{__('Day', 'doublescale')}
															</p>
															<p className="text-base font-semibold capitalize text-gray-900">
																{
																	(campaign.settings.trigger.schedule as any)
																		.day_of_week
																}
															</p>
														</div>
													)}
												</div>
											)}
									</div>
								</CardLayout>
							)}

							{!campaign?.settings?.automated && (
								<ScheduleCard
									sendNow={sendNow}
									setSendNow={setSendNow}
									scheduledAt={scheduledAt}
									setScheduledAt={setScheduledAt}
									timezoneMode={timezoneMode}
									setTimezoneMode={setTimezoneMode}
								/>
							)}
						</div>
					</div>
				</div>

					<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="secondaryDeepBlue"
						onClick={() => goToStep('contacts')}
						disabled={saving}
					>
						{__('Back', 'doublescale')}
					</Button>
					<Button type="button" variant="gradient" onClick={save} disabled={saving}>
						{saving
							? __('Saving...', 'doublescale')
							: campaign?.settings?.automated
								? __('Activate Campaign', 'doublescale')
								: sendNow
									? __('Send Campaign Now', 'doublescale')
									: __('Create Campaign', 'doublescale')}
					</Button>
					</div>
			</div>

			<Dialog open={sendTestDialogOpen} onOpenChange={setSendTestDialogOpen}>
				<DialogContent className="max-w-2xl z-[1000000] bg-white">
					<DialogHeader>
						<CustomDialogHeader
						title={campaign?.type === 'sms'
							? __('Send Test SMS', 'doublescale')
							: campaign?.type === 'whatsapp'
								? __('Send Test WhatsApp', 'doublescale')
								: __('Send Test Email', 'doublescale')}
						subtitle={__('Preview and send a test email to ensure your campaign is set up correctly.', 'doublescale')}
						icon={<PreviewEyeIcon color="currentColor"/>}
						/>
					</DialogHeader>
					{campaign?.type === 'sms' ? (
						<SendTestSMSCard
							campaignId={campaign?.id}
							header={false}
							cardClassName="border border-border bg-[#F7F8FA] p-6 static top-auto"
						/>
					) : campaign?.type === 'whatsapp' ? (
						<SendTestWhatsAppCard
							campaignId={campaign?.id}
							header={false}
							cardClassName="border border-border bg-[#F7F8FA] p-6 static top-auto"
						/>
					) : (
						<SendTestEmailCard
							campaignId={campaign?.id}
							header={false}
							cardClassName="border border-border bg-[#F7F8FA] p-6 static top-auto"
						/>
					)}
				</DialogContent>
			</Dialog>
		</PanelLayout>
	);
};

export default Review;
