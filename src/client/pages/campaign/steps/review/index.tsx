/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
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
	CampaignsIcon,
	TeamIcon,
} from '@quillcrm/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { isEmpty } from 'lodash';
import {
	CalendarIcon,
	EditIcon,
	ClockIcon,
	SendIcon,
	AlertCircle,
} from 'lucide-react';
import { CardLayout } from './components';

const Review: React.FC = () => {
	const {
		campaign,
		saveCampaignStep,
		saveCampaignSettings,
		goToStep,
		saving,
	} = useCampaignStep();
	const { createNotice } = useDispatch('quillcrm/core');

	const [sendNow, setSendNow] = useState(false);
	const [scheduleDate, setScheduleDate] = useState('');
	const [scheduleTime, setScheduleTime] = useState('');
	const [timezoneMode, setTimezoneMode] = useState('user'); // 'user' or 'subscriber'
	const [testEmails, setTestEmails] = useState('');
	const [isSendingTest, setIsSendingTest] = useState(false);

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

	const sendTestEmail = async () => {
		if (!testEmails.trim()) {
			createNotice({
				type: 'error',
				message: __(
					'Please enter at least one email address',
					'quillcrm'
				),
			});
			return;
		}

		setIsSendingTest(true);

		try {
			// Parse comma-separated emails
			const emails = testEmails.split(',').map((email) => email.trim());

			// Validate emails
			const invalidEmails = emails.filter(
				(email) => !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
			);

			if (invalidEmails.length > 0) {
				createNotice({
					type: 'error',
					message: __(
						'Please enter valid email addresses',
						'quillcrm'
					),
				});
				return;
			}

			await apiFetch({
				path: '/qc/v1/campaigns/send-test-email',
				method: 'POST',
				data: {
					emails,
					campaign_id: campaign?.id,
				},
			});

			createNotice({
				type: 'success',
				message: __('Test email sent successfully', 'quillcrm'),
			});

			setTestEmails('');
		} catch (error: any) {
			console.error('Test email error:', error);
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to send test email', 'quillcrm'),
			});
		} finally {
			setIsSendingTest(false);
		}
	};

	const save = async () => {
		if (!campaign) {
			return;
		}

		// Validate schedule if not sending now
		if (!sendNow && (isEmpty(scheduleDate) || isEmpty(scheduleTime))) {
			createNotice({
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
			createNotice({
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
			<Stepper steps={campaignSteps} canProceed="true" currentStep={4} />

			<div className="qcrm-review-step flex gap-6 items-start">
				<div className="w-2/3">
					<PanelSettings
						title={__('Review and Confirm', 'quillcrm')}
						description={__(
							'Define your sender identity, subject line, and optional UTM tracking before building your campaign.',
							'quillcrm'
						)}
						icon={<CategoryIcon />}
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
							{/* Campaign Settings */}

							<CardLayout
								icon={<CampaignsIcon />}
								header={__('Campaign Settings', 'quillcrm')}
								buttonIcon={<EditIcon />}
								buttonText={__('Edit', 'quillcrm')}
							>
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-2">
										<div>
											<p className="text-xs text-gray-500 mb-1">
												{__('From Name', 'quillcrm')}
											</p>
											<p className="text-sm font-medium text-gray-900">
												{fromName}
											</p>
										</div>
										<div>
											<p className="text-xs text-gray-500 mb-1">
												{__('From Email', 'quillcrm')}
											</p>
											<p className="text-sm font-medium text-gray-900">
												{fromEmail}
											</p>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-2">
										<div>
											<p className="text-xs text-gray-500 mb-1">
												{__('Reply to', 'quillcrm')}
											</p>
											<p className="text-sm font-medium text-gray-900">
												{replyTo}
											</p>
										</div>

										<div>
											<p className="text-xs text-gray-500 mb-1">
												{__('Subject', 'quillcrm')}
											</p>
											<p className="text-sm font-medium text-gray-900">
												{emailSubject}
											</p>
										</div>
									</div>

									<div>
										<p className="text-xs text-gray-500 mb-1">
											{__('Preview Text', 'quillcrm')}
										</p>
										<p className="text-sm text-gray-900">
											{previewText}
										</p>
									</div>
								</div>
							</CardLayout>

							{/* Recipients */}
							<CardLayout
								icon={<TeamIcon />}
								header={__('Recipients', 'quillcrm')}
								buttonIcon={<EditIcon />}
								buttonText={__('Edit Recipients', 'quillcrm')}
							>
								<div className="space-y-6">
									{/* Included Contacts */}
									<div>
										<h4 className="text-sm font-semibold text-gray-900 mb-3">
											{__(
												'Included Contacts',
												'quillcrm'
											)}
										</h4>
										<div className="grid grid-col-2 gap-2">
											<div>
												<p className="text-xs text-gray-500 mb-2">
													{__(
														'Selected List',
														'quillcrm'
													)}
												</p>
												{includedLists.length > 0 ? (
													<div className="flex flex-wrap gap-2">
														{includedLists.map(
															(list, index) => (
																<Badge
																	key={index}
																	variant="secondary"
																	className="bg-gray-100 text-gray-700 hover:bg-gray-100"
																>
																	{list}
																</Badge>
															)
														)}
													</div>
												) : (
													<p className="text-sm text-gray-500">
														{__(
															'All Lists',
															'quillcrm'
														)}
													</p>
												)}
											</div>

											<div>
												<p className="text-xs text-gray-500 mb-2">
													{__(
														'Selected Tag',
														'quillcrm'
													)}
												</p>
												{includedTags.length > 0 ? (
													<div>
														{includedTags.map(
															(tag, index) => (
																<div
																	key={index}
																	className="text-black font-bold"
																>
																	{tag}
																</div>
															)
														)}
													</div>
												) : (
													<p className="text-sm text-gray-500">
														{__(
															'All Contact on Selected list Segment',
															'quillcrm'
														)}
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Exclude Contacts */}
									{(excludedLists.length > 0 ||
										excludedTags.length > 0) && (
										<div>
											<h4 className="text-sm font-semibold text-gray-900 mb-3">
												{__(
													'Exclude Contacts',
													'quillcrm'
												)}
											</h4>
											<div className="space-y-3">
												{excludedLists.length > 0 && (
													<div>
														<p className="text-xs text-gray-500 mb-2">
															{__(
																'Selected List',
																'quillcrm'
															)}
														</p>
														<div className="flex flex-wrap gap-2">
															{excludedLists.map(
																(
																	list,
																	index
																) => (
																	<Badge
																		key={
																			index
																		}
																		variant="secondary"
																		className="bg-gray-100 text-gray-700 hover:bg-gray-100"
																	>
																		{list}
																	</Badge>
																)
															)}
														</div>
													</div>
												)}

												{excludedTags.length > 0 && (
													<div>
														<p className="text-xs text-gray-500 mb-2">
															{__(
																'Selected Tag',
																'quillcrm'
															)}
														</p>
														<div className="flex flex-wrap gap-2">
															{excludedTags.map(
																(
																	tag,
																	index
																) => (
																	<Badge
																		key={
																			index
																		}
																		variant="secondary"
																		className="bg-gray-100 text-gray-700 hover:bg-gray-100"
																	>
																		{tag}
																	</Badge>
																)
															)}
														</div>
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							</CardLayout>

							{/* Schedule Campaign */}
							<div className="border border-gray-200 rounded-lg p-6">
								{/* Title with icon */}
								<div className="flex items-center gap-2 mb-6">
									<ClockIcon className="h-5 w-5 text-purple-600" />
									<h3 className="text-base font-semibold text-purple-600">
										{__(
											'When would you like to send the campaign?',
											'quillcrm'
										)}
									</h3>
								</div>

								<div className="space-y-6">
									{/* Send Now / Schedule for later */}
									<RadioGroup
										value={sendNow ? 'now' : 'later'}
										onValueChange={(value) =>
											setSendNow(value === 'now')
										}
										className="flex gap-4"
									>
										<Label
											htmlFor="send-now"
											className={`flex items-center space-x-3 flex-1 border rounded-lg p-3 cursor-pointer ${
												sendNow
													? 'border-purple-500 bg-purple-50'
													: 'border-gray-300'
											}`}
										>
											<RadioGroupItem
												value="now"
												id="send-now"
											/>
											<span className="text-sm font-medium">
												{__('Send now', 'quillcrm')}
											</span>
										</Label>

										<Label
											htmlFor="schedule-later"
											className={`flex items-center space-x-3 flex-1 border rounded-lg p-3 cursor-pointer ${
												!sendNow
													? 'border-blue-500 bg-blue-50'
													: 'border-gray-300'
											}`}
										>
											<RadioGroupItem
												value="later"
												id="schedule-later"
											/>
											<span className="text-sm font-medium">
												{__(
													'Schedule for later',
													'quillcrm'
												)}
											</span>
										</Label>
									</RadioGroup>

									{/* Date and Time Fields */}
									{!sendNow && (
										<>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														{__('Date', 'quillcrm')}
													</label>
													<div className="relative">
														<Input
															type="text"
															value={scheduleDate}
															onChange={(e) =>
																setScheduleDate(
																	e.target
																		.value
																)
															}
															placeholder="From - To"
															className="w-full pr-10"
														/>
														<CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
													</div>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														{__('Time', 'quillcrm')}
													</label>
													<div className="relative">
														<Input
															type="text"
															value={scheduleTime}
															onChange={(e) =>
																setScheduleTime(
																	e.target
																		.value
																)
															}
															placeholder="From - To"
															className="w-full pr-10"
														/>
														<ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
													</div>
												</div>
											</div>

											{/* Based on section */}
											<div>
												<h4 className="text-sm font-medium text-gray-900 mb-3">
													{__('Based on', 'quillcrm')}
												</h4>
												<RadioGroup
													value={timezoneMode}
													onValueChange={
														setTimezoneMode
													}
													className="space-y-3"
												>
													<Label
														htmlFor="user-timezone"
														className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer ${
															timezoneMode ===
															'user'
																? 'border-gray-400 bg-gray-50'
																: 'border-gray-300'
														}`}
													>
														<RadioGroupItem
															value="user"
															id="user-timezone"
														/>
														<span className="text-sm">
															{__(
																'Your time zone GMT+3',
																'quillcrm'
															)}
														</span>
													</Label>

													<Label
														htmlFor="subscriber-timezone"
														className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer ${
															timezoneMode ===
															'subscriber'
																? 'border-blue-500 bg-blue-50'
																: 'border-gray-300'
														}`}
													>
														<RadioGroupItem
															value="subscriber"
															id="subscriber-timezone"
														/>
														<span className="text-sm text-blue-600">
															{__(
																'Based on the Subscribers time zone',
																'quillcrm'
															)}
														</span>
													</Label>
												</RadioGroup>

												{timezoneMode ===
													'subscriber' && (
													<p className="text-xs text-red-500 mt-2 ml-7">
														{__(
															'(Applies only to subscribers with location data)',
															'quillcrm'
														)}
													</p>
												)}
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</PanelSettings>
				</div>

				{/* Send Test Email */}
				<div className="w-1/3">
					<div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
						{/* Header */}
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<div className="flex items-center gap-2">
								<SendIcon className="h-5 w-5 text-purple-600" />
								<h3 className="text-base font-semibold text-purple-600">
									{__('Send test email', 'quillcrm')}
								</h3>
							</div>
						</div>

						{/* Content */}
						<div className="space-y-4">
							<h4 className="text-base font-medium text-gray-900">
								{__(
									'Who do you want to test your email with?',
									'quillcrm'
								)}
							</h4>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									{__('Send a test email to', 'quillcrm')}
								</label>
								<Textarea
									value={testEmails}
									onChange={(e) =>
										setTestEmails(e.target.value)
									}
									placeholder="name@email.com,name@email.com"
									className="w-full resize-none"
									rows={2}
								/>
								<p className="text-xs text-blue-600 mt-2">
									{__(
										'If you enter multiple emails, separate them with a comma',
										'quillcrm'
									)}
								</p>
							</div>

							{/* Warning */}
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="flex gap-3">
									<AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
									<p className="text-sm text-red-600">
										{__(
											"Your test email could land in a spam folder. But don't worry, once you send the actual campaign, the emails will successfully reach your recipients.",
											'quillcrm'
										)}
									</p>
								</div>
							</div>

							{/* Send Button */}
							<div className="flex justify-end">
								<Button
									onClick={sendTestEmail}
									disabled={
										isSendingTest || !testEmails.trim()
									}
									variant="outline"
									className="border-blue-500 text-blue-600 hover:bg-blue-50"
								>
									{isSendingTest
										? __('Sending...', 'quillcrm')
										: __('Send Test', 'quillcrm')}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</PanelLayout>
	);
};

export default Review;
