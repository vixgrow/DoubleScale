import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import OpenBuilder from '@/components/open-builder';

import { SequenceMailModalProps, SequenceMailFormData } from '../../types';
import EmailSequenceModelIcon from '@doublescale/components/icons/email-squence';
import EmailTimeIcon from '@doublescale/components/icons/email-time';
import { Switch } from '@doublescale/components/ui/switch';
import { Checkbox } from '@doublescale/components/ui/checkbox';
import { NoticeBanner } from '@doublescale/components';
import MerageTagsIcon from '@/components/icons/merage-tags';
import TrashIcon from '@/components/icons/trash';
import ConfigApi from '@doublescale/config';
import { Sparkles, Loader2, X, AlertTriangle } from 'lucide-react';

/**
 * UTM parameter field names
 */
type UtmField =
	| 'campaign_source'
	| 'campaign_medium'
	| 'campaign_name'
	| 'campaign_term'
	| 'campaign_content';

const defaultData: SequenceMailFormData = {
	subject: '',
	email_body: '',
	pre_header: '',
	delay: {
		value: 0,
		unit: 'Minutes',
	},
	sending_time_range: {
		from: '',
		to: '',
	},
	enable_specific_days: false,
	days: {
		monday: false,
		tuesday: false,
		wednesday: false,
		thursday: false,
		friday: false,
		saturday: false,
		sunday: false,
	},
	add_utm_parameters: false,
	utm_parameters: {
		campaign_source: '',
		campaign_medium: '',
		campaign_name: '',
		campaign_term: '',
		campaign_content: '',
	},
	templates: [],
};

const SequenceMailModal: React.FC<SequenceMailModalProps> = ({
	isOpen,
	title,
	initialData = defaultData,
	onSave,
	notice,
	closeNotice,
	noticeBannerRef,
}) => {
	// Merge initialData with defaultData to ensure all properties exist
	const mergedInitialData = {
		...defaultData,
		...initialData,
		utm_parameters: {
			...defaultData.utm_parameters,
			...(initialData?.utm_parameters || {}),
		},
		templates: initialData?.templates || defaultData.templates,
	};

	const [formData, setFormData] =
		useState<SequenceMailFormData>(mergedInitialData);

	const [aiPromptOpen, setAiPromptOpen] = useState(false);
	const [aiPrompt, setAiPrompt] = useState('');
	const [aiTone, setAiTone] = useState('professional');
	const [aiGenerating, setAiGenerating] = useState(false);
	const [aiError, setAiError] = useState<string | null>(null);
	const aiConfigured = ConfigApi.isAiConfigured();

	const subjectInputRef = useRef<HTMLInputElement>(null);
	const preHeaderTextareaRef = useRef<HTMLTextAreaElement>(null);

	const { setMergeTagsVisible, setMergeTagCallback, createNotice } =
		useDispatch('doublescale/core');

	// Reset form data when modal opens or initialData changes
	const isInitialized = useRef(false);

	useEffect(() => {
		if (isOpen && !isInitialized.current) {
			const resetData = {
				...defaultData,
				...initialData,
				utm_parameters: {
					...defaultData.utm_parameters,
					...(initialData?.utm_parameters || {}),
				},
				templates: initialData?.templates || defaultData.templates,
			};
			setFormData(resetData);
			isInitialized.current = true;
		} else if (!isOpen && isInitialized.current) {
			isInitialized.current = false;
		}
	}, [isOpen, initialData]);

	const handleChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleDelayChange = (type: 'value' | 'unit', value: any) => {
		setFormData((prev) => ({
			...prev,
			delay: {
				...prev.delay,
				[type]: value,
			},
		}));
	};

	const handleTimeRangeChange = (type: 'from' | 'to', value: string) => {
		setFormData((prev) => ({
			...prev,
			sending_time_range: {
				...prev.sending_time_range,
				[type]: value,
			},
		}));
	};

	const handleDayChange = (day: string, checked: boolean) => {
		setFormData((prev) => ({
			...prev,
			days: {
				...prev.days,
				[day]: checked,
			},
		}));
	};

	const handleUtmParameterChange = (field: UtmField, value: string) => {
		setFormData((prev) => ({
			...prev,
			utm_parameters: {
				...(prev.utm_parameters || {}),
				[field]: value,
			},
		}));
	};

	const handleSave = async () => {
		await onSave(formData);
	};

	const handleMergeTagClick = () => {
		setMergeTagCallback((tagValue: string) => {
			navigator.clipboard.writeText(tagValue);

			createNotice({
				message: __('Merge tag copied to clipboard', 'doublescale'),
				type: 'info',
			});
		});
		setMergeTagsVisible(true);
	};

	const handleAiGenerate = async () => {
		if (aiPrompt.trim().length < 3) return;

		setAiGenerating(true);
		setAiError(null);

		try {
			const response = (await apiFetch({
				path: '/doublescale/v1/ai/generate-text',
				method: 'POST',
				data: {
					prompt: aiPrompt,
					tone: aiTone,
					include_subject: true,
					use_merge_tags: true,
				},
			})) as { success: boolean; text: string; subject?: string };

			if (response.subject) {
				handleChange('subject', response.subject);
			}
			if (response.text) {
				handleChange('pre_header', response.text.replace(/<[^>]*>/g, '').slice(0, 250));
			}

			setAiPromptOpen(false);
			setAiPrompt('');
		} catch (err: any) {
			setAiError(
				err?.message ||
					__('Failed to generate. Please try again.', 'doublescale')
			);
		} finally {
			setAiGenerating(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	const handleClear = () => {
		setFormData(defaultData);
	};

	return (
		<div className="max-h-screen relative bg-white flex flex-col gap-6 py-6 px-3 ">
			{/* Header - Fixed */}
			<div className=" border-b-2 border-gray-200 bg-white pb-5">
				<div className="flex items-center justify-between">
					<div className=" flex gap-1 justify-center items-center">
						<EmailSequenceModelIcon />
						<p className="text-lg font-bold text-[#660FF1] leading-7 ">
							{title}
						</p>
					</div>
					<div className=" flex gap-2">
						<span
							onClick={handleClear}
							className=" h-10 p-2 border border-[#E13B3B] cursor-pointer hover:bg-[#f4d5d5]  bg-card rounded-lg"
						>
							<TrashIcon />
						</span>
						<Button
							onClick={handleSave}
							className="px-4 py-2 h-10 border  border-[#458DC7] text-[#458DC7] bg-white hover:!bg-[#dbe6ef] rounded-lg"
						>
							{__('Save', 'doublescale')}
						</Button>
					</div>
				</div>
			</div>

			{/* Notice Banner */}
			{notice && (
				<NoticeBanner
					ref={noticeBannerRef}
					notice={notice}
					closeNotice={closeNotice ?? (() => {})}
				/>
			)}
			{/* Content - Scrollable */}
			<div className="  flex flex-col gap-6 ">
				{/* Timing Section */}
				<div className=" border border-border/60 bg-muted/50 rounded-2xl p-4 flex flex-col ">
					<span className=" text-muted-foreground text-sm  font-semibold leading-[26px] flex gap-2.5 items-center">
						<EmailTimeIcon />
						{__(
							'Sending time range for email sequence',
							'doublescale'
						)}
					</span>
					<div className=" h-[2px] bg-[#DEE1E6] my-3 "></div>
					<div className="  py-3">
						<div className=" flex justify-between">
							<Label>{__('Delay', 'doublescale')}</Label>
						</div>

						<div className=" grid grid-cols-2 gap-3 py-3">
							<div className=" flex flex-col gap-1 w-full">
								<Input
									type="number"
									value={formData.delay.value}
									onChange={(e) => {
										const value =
											parseInt(e.target.value) || 0;
										handleDelayChange('value', value);
									}}
									className="h-12 !py-[5px] !px-4  !rounded-lg border !border-border/60 bg-card hover:bg-card !shadow-none"
									min="0"
								/>
							</div>
							<div className=" flex flex-col gap-1 w-full">
								<Select
									value={formData.delay.unit}
									onValueChange={(value) =>
										handleDelayChange('unit', value)
									}
								>
									<SelectTrigger className="h-12 !py-[5px] !px-4  !rounded-lg border !border-border/60 bg-card hover:bg-card !shadow-none">
										<SelectValue placeholder="Select unit" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Minutes">
											{__('Minutes', 'doublescale')}
										</SelectItem>
										<SelectItem value="Hours">
											{__('Hours', 'doublescale')}
										</SelectItem>
										<SelectItem value="Days">
											{__('Days', 'doublescale')}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<p className="text-sm font-semibold leading-[23px] text-muted-foreground flex flex-col">
							{formData.delay.value === 0
								? __(
										'Set to 0 to send immediately. Otherwise, set after how many minutes the email will be triggered from the starting date',
										'doublescale'
									)
								: __(
										'Set after how many minutes the email will be triggered from the starting date',
										'doublescale'
									)}
						</p>
						<div className=" h-[2px] bg-[#DEE1E6] my-3 "></div>
						<div className=" flex  flex-col">
							<Label>
								{__('Sending Time Range', 'doublescale')}
							</Label>
							<div className="flex gap-3 py-3">
								<div className="flex flex-col gap-1">
									<Label>{__('From', 'doublescale')}</Label>
									<Input
										type="time"
										dir="rtl"
										value={formData.sending_time_range.from}
										onChange={(e) =>
											handleTimeRangeChange(
												'from',
												e.target.value
											)
										}
										className="h-12 !py-[5px] !px-4 !rounded-lg border !border-border/60 bg-card hover:bg-card !shadow-none"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label>{__('To', 'doublescale')}</Label>
									<Input
										type="time"
										dir="rtl"
										value={formData.sending_time_range.to}
										onChange={(e) =>
											handleTimeRangeChange(
												'to',
												e.target.value
											)
										}
										className="h-12 !py-[5px] !px-4 !rounded-lg border !border-border/60 bg-card hover:bg-card !shadow-none"
									/>
								</div>
							</div>
							<div>
								<div className="flex items-center space-x-3">
									<Checkbox
										id="enableSpecificDays"
										checked={formData.enable_specific_days}
										onCheckedChange={(checked) =>
											handleChange(
												'enable_specific_days',
												checked
											)
										}
										className=" !border-[#777] data-[state=checked]:bg-[#428ac4] data-[state=checked]:border-[#428ac4]  "
									/>
									<Label
										htmlFor="enable_specific_days"
										className="text-sm font-semibold leading-[23px] text-muted-foreground flex flex-col cursor-pointer"
									>
										{__(
											'Enable Specific Days Only',
											'doublescale'
										)}
									</Label>
								</div>

								{formData.enable_specific_days && (
									<div className="ml-6 space-y-3">
										<p className="text-sm text-gray-600">
											{__(
												'Please select allowed days to send emails',
												'doublescale'
											)}
										</p>
										<div className="grid grid-cols-2  lg:grid-cols-4 gap-3">
											{Object.entries(formData.days).map(
												([day, checked]) => (
													<div
														key={day}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`day-${day}`}
															checked={checked}
															onCheckedChange={(
																checked
															) =>
																handleDayChange(
																	day,
																	!!checked
																)
															}
															className="data-[state=checked]:bg-[#428ac4] data-[state=checked]:border-[#428ac4]"
														/>
														<Label
															htmlFor={`day-${day}`}
															className="text-sm text-gray-700 cursor-pointer"
														>
															{__(
																day
																	.charAt(0)
																	.toUpperCase() +
																	day.slice(
																		1
																	),
																'doublescale'
															)}
														</Label>
													</div>
												)
											)}
										</div>
									</div>
								)}
							</div>
							<p className="text-sm font-semibold leading-[23px] text-muted-foreground">
								{__(
									'If you select a time range then FluentCRM schedule the email to that time range',
									'doublescale'
								)}
							</p>
						</div>
					</div>
				</div>

				{/* Email Template Section */}
				{/* Email Settings Section */}
				<div className=" rounded-2xl border border-border/60 overflow-hidden shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] ">
					{/* Header with AI button */}
					<div className="bg-muted/50 px-4 py-3 border-b border-border/60 flex items-center justify-between">
						<span className="font-semibold text-base text-foreground">
							{__('Email Settings', 'doublescale')}
						</span>
						{aiConfigured && (
							<button
								type="button"
								onClick={() => setAiPromptOpen(!aiPromptOpen)}
								className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
							>
								<Sparkles className="w-3.5 h-3.5" />
								{__('AI Generate', 'doublescale')}
							</button>
						)}
					</div>

					{/* AI Generation Panel */}
					{aiPromptOpen && (
						<div className="m-4 p-4 border border-primary/20 bg-primary/5 rounded-xl flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
									<Sparkles className="w-4 h-4 text-primary" />
									{__('Generate Subject & Pre-header with AI', 'doublescale')}
								</span>
								<button
									type="button"
									onClick={() => {
										setAiPromptOpen(false);
										setAiError(null);
									}}
									className="p-1 rounded hover:bg-gray-200 transition-colors"
								>
									<X className="w-4 h-4 text-gray-500" />
								</button>
							</div>

							{!aiConfigured && (
								<div className="flex items-center gap-1.5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
									<AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
									{__('AI is not configured. Set up your AI provider in Settings > AI.', 'doublescale')}
								</div>
							)}

							<Textarea
								placeholder={__(
									'Describe the email you want to send, e.g. "Welcome email for new subscribers with a friendly tone"',
									'doublescale'
								)}
								value={aiPrompt}
								onChange={(e) => {
									setAiPrompt(e.target.value);
									if (aiError) setAiError(null);
								}}
								className="min-h-[80px] bg-white text-sm"
								disabled={aiGenerating}
							/>

							<div className="flex items-center gap-3">
								<Select
									value={aiTone}
									onValueChange={setAiTone}
								>
									<SelectTrigger className="w-[160px] h-9 bg-white text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="professional">{__('Professional', 'doublescale')}</SelectItem>
										<SelectItem value="casual">{__('Casual', 'doublescale')}</SelectItem>
										<SelectItem value="friendly">{__('Friendly', 'doublescale')}</SelectItem>
										<SelectItem value="urgent">{__('Urgent', 'doublescale')}</SelectItem>
										<SelectItem value="formal">{__('Formal', 'doublescale')}</SelectItem>
									</SelectContent>
								</Select>

								<Button
									onClick={handleAiGenerate}
									disabled={!aiConfigured || aiGenerating || aiPrompt.trim().length < 3}
									className="h-9 px-4 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm"
								>
									{aiGenerating ? (
										<>
											<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
											{__('Generating...', 'doublescale')}
										</>
									) : (
										<>
											<Sparkles className="w-3.5 h-3.5 mr-1.5" />
											{__('Generate', 'doublescale')}
										</>
									)}
								</Button>
							</div>

							{aiError && (
								<div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
									<AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
									<span>{aiError}</span>
								</div>
							)}
						</div>
					)}

					{/* Subject Field */}
					<div className=" m-4 flex flex-col gap-4">
						<div className="p-4 flex  justify-between items-center gap-2 border border-border/60 bg-muted/50 rounded-xl ">
							<Input
								type="text"
								placeholder={__(
									'Type subject here',
									'doublescale'
								)}
								className="w-full text-sm !bg-muted/50 !shadow-none !outline-none !border-0 !ring-0 !px-0  focus:!ring-0"
								id="emailSubject"
								ref={subjectInputRef}
								value={formData.subject}
								onChange={(e) =>
									handleChange('subject', e.target.value)
								}
							/>
							<span
								className=" bg-white border border-border/60 rounded-lg p-2 cursor-pointer hover:bg-gray-50"
								onClick={handleMergeTagClick}
							>
								<MerageTagsIcon />
							</span>
						</div>
						<div className="p-4 flex justify-between items-start  gap-2 border border-border/60 bg-muted/50 rounded-xl">
							<Textarea
								id="emailPreHeader"
								ref={preHeaderTextareaRef}
								value={formData.pre_header}
								onChange={(e) =>
									handleChange('pre_header', e.target.value)
								}
								rows={3}
								placeholder={__(
									'Enter pre-header text...',
									'doublescale'
								)}
								className="resize-none border-border/60 w-full text-sm !shadow-none !outline-none !border-0 !ring-0 !px-0  focus:!ring-0"
							/>
							<span
								className=" bg-white border border-border/60 rounded-lg p-2 cursor-pointer hover:bg-gray-50"
								onClick={handleMergeTagClick}
							>
								<MerageTagsIcon />
							</span>
						</div>
					</div>
				</div>
				{/* Email Builder Section */}
				<div className=" rounded-2xl border border-border/60 overflow-hidden shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
					<div className="bg-muted/50 px-4 py-3 border-b border-border/60">
						<span className="font-semibold text-base text-foreground">
							{__('Email Builder', 'doublescale')}
						</span>
					</div>
					<div className=" m-4 flex flex-col gap-4">
						<div className=" p-4 flex justify-between items-center gap-2 border border-border/60 bg-muted/50 rounded-xl">
							<OpenBuilder
								initialEmailBody={formData.email_body}
								onSave={(emailBodyJson) =>
									handleChange('email_body', emailBodyJson)
								}
								buttonText={
									formData.email_body
										? __('Edit Template', 'doublescale')
										: __('Open Builder', 'doublescale')
								}
								buttonVariant="outline"
								buttonClassName="border-[#458DC7] text-[#458DC7] bg-white hover:!bg-[#dbe6ef] rounded-lg"
								builderKey="sequence-mail"
							/>
						</div>
					</div>
				</div>
				{/* UTM Parameters Section */}
				<div className="border border-border/60 bg-muted/50 rounded-2xl p-4 flex flex-col">
					<div className="flex justify-between items-center space-x-3">
						<Label
							htmlFor="addUtmParameters"
							className="text-base leading-[26px] font-medium text-foreground cursor-pointer"
						>
							{__('Add UTM Parameters For URLs', 'doublescale')}
						</Label>
						<Switch
							id="addUtmParameters"
							checked={formData.add_utm_parameters}
							onCheckedChange={(checked) =>
								handleChange('add_utm_parameters', !!checked)
							}
							className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
						/>
					</div>

					{formData.add_utm_parameters && (
						<div className="ml-6 space-y-4">
							<p className="text-sm text-gray-600">
								{__(
									'Configure UTM parameters to track email campaign performance',
									'doublescale'
								)}
							</p>
							<div className="grid grid-cols-1 gap-4">
								<div className="space-y-2">
									<Label
										htmlFor="campaignSource"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Source', 'doublescale')}
										<span className="text-red-500 ml-1">
											*
										</span>
									</Label>
									<Input
										id="campaignSource"
										type="text"
										value={
											formData.utm_parameters
												?.campaign_source || ''
										}
										onChange={(e) =>
											handleUtmParameterChange(
												'campaign_source',
												e.target.value
											)
										}
										placeholder={__(
											'e.g. google, newsletter',
											'doublescale'
										)}
										className=" h-12 py-[5px] px-4 border !border-border/60 bg-card hover:bg-card !shadow-none !rounded-lg"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignMedium"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Medium', 'doublescale')}
										<span className="text-red-500 ml-1">
											*
										</span>
									</Label>
									<Input
										id="campaignMedium"
										type="text"
										value={
											formData.utm_parameters
												?.campaign_medium || ''
										}
										onChange={(e) =>
											handleUtmParameterChange(
												'campaign_medium',
												e.target.value
											)
										}
										placeholder={__(
											'e.g. cpc, banner, email',
											'doublescale'
										)}
										className=" h-12 py-[5px] px-4 border !border-border/60 bg-card hover:bg-card !shadow-none !rounded-lg"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignName"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Name', 'doublescale')}
										<span className="text-red-500 ml-1">
											*
										</span>
									</Label>
									<Input
										id="campaignName"
										type="text"
										value={
											formData.utm_parameters
												?.campaign_name || ''
										}
										onChange={(e) =>
											handleUtmParameterChange(
												'campaign_name',
												e.target.value
											)
										}
										placeholder={__(
											'e.g. spring_sale',
											'doublescale'
										)}
										className=" h-12 py-[5px] px-4 border !border-border/60 bg-card hover:bg-card !shadow-none !rounded-lg"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignTerm"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Term', 'doublescale')}
									</Label>
									<Input
										id="campaignTerm"
										type="text"
										value={
											formData.utm_parameters
												?.campaign_term || ''
										}
										onChange={(e) =>
											handleUtmParameterChange(
												'campaign_term',
												e.target.value
											)
										}
										placeholder={__(
											'Identify paid keywords',
											'doublescale'
										)}
										className=" h-12 py-[5px] px-4 border !border-border/60 bg-card hover:bg-card !shadow-none !rounded-lg"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignContent"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Content', 'doublescale')}
									</Label>
									<Input
										id="campaignContent"
										type="text"
										value={
											formData.utm_parameters
												?.campaign_content || ''
										}
										onChange={(e) =>
											handleUtmParameterChange(
												'campaign_content',
												e.target.value
											)
										}
										placeholder={__(
											'Differentiate ads',
											'doublescale'
										)}
										className=" h-12 py-[5px] px-4 border !border-border/60 bg-card hover:bg-card !shadow-none !rounded-lg"
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SequenceMailModal;
