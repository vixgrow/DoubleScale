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
import { isEmpty } from 'lodash';
import {
	CampaignSettingsCard,
	RecipientsCard,
	ScheduleCard,
	SendTestEmailCard,
} from './components';
import { NoticeMessage } from '@quillcrm/client';

const Review: React.FC = () => {
	const {
		campaign,
		saveCampaignStep,
		saveCampaignSettings,
		goToStep,
		saving,
	} = useCampaignStep();

	const [sendNow, setSendNow] = useState(false);
	const [scheduleDate, setScheduleDate] = useState('');
	const [scheduleTime, setScheduleTime] = useState('');
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
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	// State for lists and tags
	const [includedLists, setIncludedLists] = useState<string[]>([]);
	const [includedTags, setIncludedTags] = useState<string[]>([]);
	const [excludedLists, setExcludedLists] = useState<string[]>([]);
	const [excludedTags, setExcludedTags] = useState<string[]>([]);

	// Get template info from campaign
	// Backend attaches templates via attach_templates() method
	const template = campaign?.settings?.templates?.[0] as any;

	// Extract template data based on Template_Field_Mapper structure
	// For email: subject is top-level, from_name/from_email/reply_to/preview_text are in settings
	const emailSubject = template?.subject || '-';
	const fromName = template?.settings?.from_name || '-';
	const fromEmail = template?.settings?.from_email || '-';
	const replyTo = template?.settings?.reply_to || '-';
	const previewText = template?.settings?.preview_text || '-';

	// Debug: Log template structure to verify data
	useEffect(() => {
		if (template) {
			console.log('Review - Template data:', {
				template,
				subject: emailSubject,
				fromName,
				fromEmail,
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

			filters.forEach((filter: any) => {
				if (filter.group !== 'segments' || !filter.value?.[0]) return;

				const id = filter.value[0];
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
						includeListIds.map((id) =>
							apiFetch({ path: `/qc/v1/lists/${id}` }).then(
								(list: any) => list.name
							)
						)
					);
					setIncludedLists(lists);
				} else {
					setIncludedLists([__('All Lists', 'quillcrm')]);
				}

				if (excludeListIds.length > 0) {
					const lists = await Promise.all(
						excludeListIds.map((id) =>
							apiFetch({ path: `/qc/v1/lists/${id}` }).then(
								(list: any) => list.name
							)
						)
					);
					setExcludedLists(lists);
				}

				// Fetch tag names
				if (includeTagIds.length > 0) {
					const tags = await Promise.all(
						includeTagIds.map((id) =>
							apiFetch({ path: `/qc/v1/tags/${id}` }).then(
								(tag: any) => tag.name
							)
						)
					);
					setIncludedTags(tags);
				} else {
					setIncludedTags([
						__('All Contact on Selected list Segment', 'quillcrm'),
					]);
				}

				if (excludeTagIds.length > 0) {
					const tags = await Promise.all(
						excludeTagIds.map((id) =>
							apiFetch({ path: `/qc/v1/tags/${id}` }).then(
								(tag: any) => tag.name
							)
						)
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
		if (!sendNow && (isEmpty(scheduleDate) || isEmpty(scheduleTime))) {
			showNotice({
				type: 'error',
				message: __('Please set a schedule date and time', 'quillcrm'),
			});
			return;
		}

		try {
			const runType = sendNow ? 'processing' : 'schedule';
			let executeAt: string | null = null;

			if (!sendNow) {
				// Combine date and time
				executeAt = new Date(
					`${scheduleDate}T${scheduleTime}`
				).toISOString();
			}

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
				const data: any = {
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
						: campaignSteps.filter((step) => step.slug !== 'builder')
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
								fromName={fromName}
								fromEmail={fromEmail}
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
								scheduleDate={scheduleDate}
								setScheduleDate={setScheduleDate}
								scheduleTime={scheduleTime}
								setScheduleTime={setScheduleTime}
								timezoneMode={timezoneMode}
								setTimezoneMode={setTimezoneMode}
							/>
						</div>
					</PanelSettings>
				</div>

				{/* Send Test Email */}
				<div className="w-1/3">
					<SendTestEmailCard campaignId={campaign?.id} />
				</div>
			</div>
		</PanelLayout>
	);
};

export default Review;
