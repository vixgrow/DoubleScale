/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
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
	ReviewIcon,
	NoticeBanner,
} from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import {
	CampaignSettingsCard,
	RecipientsCard,
	ScheduleCard,
	SendTestEmailCard,
} from './components';
import type {
	NoticeMessage,
	EmailTemplate,
	SMSTemplate,
	WhatsAppTemplate,
} from '@quillcrm/client';
//@ts-ignore
import device from '../../../../../../assets/images/message-device.png';

const Review: React.FC = () => {
	const {
		campaign,
		saveCampaignStep,
		saveCampaignSettings,
		goToStep,
		saving,
	} = useCampaignStep();

	const [sendNow, setSendNow] = useState(true);
	const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
	const [timezoneMode, setTimezoneMode] = useState('user'); // 'user' or 'subscriber'

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

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
	// For email: subject is top-level, from_name/from_email/reply_to/preview_text are in settings
	// For SMS: from_name and from_phone are in settings
	const isEmailTemplate = template?.type === 'email';
	const emailSubject =
		isEmailTemplate && (template as EmailTemplate).subject
			? (template as EmailTemplate).subject
			: '-';
	const fromName =
		isEmailTemplate && (template as EmailTemplate).settings?.from_name
			? (template as EmailTemplate).settings!.from_name
			: '-';
	const fromEmail =
		isEmailTemplate && (template as EmailTemplate).settings?.from_email
			? (template as EmailTemplate).settings!.from_email
			: '-';
	const fromPhone =
		campaign?.type === 'sms'
			? ((campaign?.settings as unknown as { from_phone?: string })
				?.from_phone ?? '-')
			: '-';
	const replyTo =
		isEmailTemplate && (template as EmailTemplate).settings?.reply_to
			? (template as EmailTemplate).settings!.reply_to
			: '-';
	const previewText =
		isEmailTemplate && (template as EmailTemplate).preview_text
			? (template as EmailTemplate).preview_text
			: '-';

	// Debug: Log template structure to verify data
	useEffect(() => {
		if (template) {
			console.log('Review - Template data:', {
				template,
				subject: emailSubject,
				fromName,
				fromEmail,
				fromPhone,
				replyTo,
				previewText,
			});
		}
	}, [template]);

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
								path: `/qc/v1/lists/${listId}`,
							})) as { name?: string };
							return list?.name || '';
						})
					);
					setIncludedLists(lists);
				} else {
					setIncludedLists([__('All Lists', 'quillcrm')]);
				}

				if (excludeListIds.length > 0) {
					const lists = await Promise.all(
						excludeListIds.map(async (listId) => {
							const list = (await apiFetch({
								path: `/qc/v1/lists/${listId}`,
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
								path: `/qc/v1/tags/${tagId}`,
							})) as { name?: string };
							return tag?.name || '';
						})
					);
					setIncludedTags(tags);
				} else {
					setIncludedTags([
						__('All Contact on Selected list Segment', 'quillcrm'),
					]);
				}

				if (excludeTagIds.length > 0) {
					const tags = await Promise.all(
						excludeTagIds.map(async (tagId) => {
							const tag = (await apiFetch({
								path: `/qc/v1/tags/${tagId}`,
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

		// Validate schedule if not sending now
		if (!sendNow && !scheduledAt) {
			showNotice({
				type: 'error',
				message: __('Please set a schedule date and time', 'quillcrm'),
			});
			return;
		}

		try {
			const runType = sendNow ? 'processing' : 'schedule';
			const executeAt = !sendNow && scheduledAt ? scheduledAt.toISOString() : null;

			// Save review step data
			const reviewStepData = {
				run_type: runType,
				execute_at: executeAt,
				timezone_mode: timezoneMode,
			};

			// Save the final step data
			const saveSuccess = await saveCampaignStep(
				'review',
				reviewStepData
			);

			if (saveSuccess) {
				// Update campaign status
				const data: { status: string; execute_at?: string } = {
					status: runType,
				};

				if (executeAt) {
					data.execute_at = executeAt;
				}

				await saveCampaignSettings(data);

				goToStep('overview');
			}
		} catch (error) {
			console.error(error);
			showNotice({
				type: 'error',
				message: __(
					'Failed to save campaign. Please try again.',
					'quillcrm'
				),
			});
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
				steps={
					campaign?.type === 'email'
						? campaignSteps
						: campaignSteps.filter(
							(step) => step.slug !== 'builder'
						)
				}
				canProceed="true"
				currentStep={campaign?.type === 'email' ? 4 : 3}
			/>

			<div className="qcrm-review-step flex gap-6 items-start">
				<div className="w-2/3">
					<PanelSettings
						title={__('Review and Confirm', 'quillcrm')}
						description={__(
							'Define your sender identity, subject line, and optional UTM tracking before building your campaign.',
							'quillcrm'
						)}
						icon={<ReviewIcon />}
						showButtons={true}
						onNext={save}
						onBack={() => goToStep('contacts')}
						nextLabel={
							sendNow
								? __('Send Campaign Now', 'quillcrm')
								: __('Create Campaign', 'quillcrm')
						}
						isLoading={saving}
					>
						<div className="space-y-6">
							{/* Notice Banner */}
							{notice && (
								<NoticeBanner
									ref={noticeBannerRef}
									notice={notice}
									closeNotice={closeNotice}
								/>
							)}

							{/* Campaign Settings */}
							<CampaignSettingsCard
								campaignType={campaign?.type}
								fromName={fromName}
								fromEmail={fromEmail}
								fromPhone={fromPhone}
								replyTo={replyTo}
								emailSubject={emailSubject}
								previewText={previewText}
								onEdit={() => goToStep('template')}
							/>

							{/* Recipients */}
							<RecipientsCard
								includedLists={includedLists}
								includedTags={includedTags}
								excludedLists={excludedLists}
								excludedTags={excludedTags}
								onEdit={() => goToStep('contacts')}
							/>

							{/* Schedule Campaign */}
							<ScheduleCard
								sendNow={sendNow}
								setSendNow={setSendNow}
								scheduledAt={scheduledAt}
								setScheduledAt={setScheduledAt}
								timezoneMode={timezoneMode}
								setTimezoneMode={setTimezoneMode}
							/>
						</div>
					</PanelSettings>
				</div>

				{/* Send Test Email or Device Preview */}
				<div className="w-1/3">
					{campaign?.type === 'sms' ? (
						<div className="flex flex-col items-center justify-center border border-gray-200 rounded-2xl bg-[#F8F8F8] h-full">
							<img
								src={device}
								alt="device"
								className="w-[350px]"
							/>
						</div>
					) : (
						<SendTestEmailCard campaignId={campaign?.id} />
					)}
				</div>
			</div>
		</PanelLayout>
	);
};

export default Review;
