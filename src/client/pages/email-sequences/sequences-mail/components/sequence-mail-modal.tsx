import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

// Import shadcn UI components
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

// Import Builder component
import Builder from '@/builder/index';

// Import types
import { SequenceMailModalProps, SequenceMailFormData } from '../../types';
import EmailSequenceModelIcon from '@quillcrm/components/icons/email-squence';
import EmailTimeIcon from '@quillcrm/components/icons/email-time';
import {
	RadioGroup,
	RadioGroupItem,
} from '@quillcrm/components/ui/radio-group';
import { Switch } from '@quillcrm/components/ui/switch';
import ArrowRightIcon from '@quillcrm/components/icons/arrow-right';
import ArrowLeft from '@quillcrm/components/icons/arrow-left';
import { Checkbox } from '@quillcrm/components/ui/checkbox';
import { NoticeMessage } from '@/client/types';
import { NoticeBanner } from '@quillcrm/components';

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
	onClose,
	title,
	initialData = defaultData,
	onSave,
	notice,
	closeNotice,
	noticeBannerRef
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
	const [isBuilderOpen, setIsBuilderOpen] = useState(false);
	const [selected, setSelected] = useState('Send now');
	const [arrowRight, setArrowRight] = useState(false);
	const subjectInputRef = useRef<HTMLInputElement>(null);
	const preHeaderTextareaRef = useRef<HTMLTextAreaElement>(null);

	const { setMergeTagsVisible, setMergeTagCallback, createNotice } =
		useDispatch('quillcrm/core');

	// Reset form data when modal opens or initialData changes
	const [wasOpen, setWasOpen] = useState(false);


	// Scroll to notice banner when it appears

	useEffect(() => {
		if (isOpen && !wasOpen) {
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
			setWasOpen(true);
		} else if (!isOpen && wasOpen) {
			setWasOpen(false);
		}
	}, [isOpen, initialData, wasOpen]);

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

	const handleUtmParameterChange = (field: string, value: string) => {
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
				message: __('Merge tag copied to clipboard', 'quillcrm'),
				type: 'info',
			});
		});
		setMergeTagsVisible(true);
	};

	const handleOpenBuilder = () => {
		setIsBuilderOpen(true);
	};

	const handleBuilderSave = (builderData: any) => {
		const preparedDataEmailBody = {
			type: 'builder',
			value: builderData,
		};
		handleChange('email_body', JSON.stringify(preparedDataEmailBody));
		setIsBuilderOpen(false);
		return Promise.resolve();
	};

	const handleBuilderClose = () => {
		setIsBuilderOpen(false);
	};

	const getBuilderInitialData = () => {
		if (!formData.email_body) {
			return {
				sections: [],
				globalSettings: {},
				buttonSettings: {},
			} as any;
		}
		try {
			const emailBodyJson = JSON.parse(formData.email_body);
			if (emailBodyJson.type === 'builder' && emailBodyJson.value) {
				return emailBodyJson.value;
			}
			return (
				emailBodyJson ?? {
					sections: [],
					globalSettings: {},
					buttonSettings: {},
				}
			);
		} catch (error) {
			console.error('Failed to parse email body:', error);
			return {
				sections: [],
				globalSettings: {},
				buttonSettings: {},
			} as any;
		}
	};

	// If not open, don't render anything
	if (!isOpen || isBuilderOpen) {
		// Builder Modal
		return isBuilderOpen ? (
			<Builder
				key={formData.email_body || 'new-email'}
				initialData={getBuilderInitialData()}
				onSave={handleBuilderSave}
				onClose={handleBuilderClose}
			/>
		) : null;
	}

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
					<Button
						onClick={handleSave}
						className="px-4 py-2 border  border-[#458DC7] text-[#458DC7] bg-white hover:!bg-[#dbe6ef] rounded-[8px]"
					>
						{__('Save', 'quillcrm')}
					</Button>
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
				<div className=" border border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl p-4 flex flex-col ">
					<span className=" text-[#777] text-sm  font-semibold leading-[26px] flex gap-2.5 items-center">
						<EmailTimeIcon />
						Sending time range for email sequence
					</span>
					<div className=" h-[2px] bg-[#DEE1E6] my-3 "></div>
					{/* radio */}
					<RadioGroup
						defaultValue="Send now"
						className="!flex !justify-between"
						onValueChange={(v) => setSelected(v)}
					>
						<div className="flex items-center gap-3">
							<RadioGroupItem
								value="Send now"
								id="r1"
								className=" border-2 border-[#374151] data-[state=checked]:border-[#458DC7]  "
							/>

							<Label
								htmlFor="r1"
								className={`${selected === 'Send now' ? 'text-[#458DC7]' : 'text-[#09090B]'}`}
							>
								Send now
							</Label>
						</div>
						<div className="flex items-center gap-3">
							<RadioGroupItem
								value="Schedule for later"
								id="r2"
								className=" border-2 border-[#374151] data-[state=checked]:border-[#458DC7] "
							/>
							<Label
								htmlFor="r2"
								className={`${selected === 'Schedule for later' ? 'text-[#458DC7]' : 'text-[#09090B]'}`}
							>
								Schedule for later
							</Label>
						</div>
					</RadioGroup>
					{selected === 'Schedule for later' && (
						<div className="  py-3">
							<div className=" flex justify-between">
								{!arrowRight ? (
									<Label>{__('Delay', 'quillcrm')}</Label>
								) : (
									<Label>
										{__('Sending Time Range', 'quillcrm')}
									</Label>
								)}
								{!arrowRight ? (
									<span
										className=" cursor-pointer"
										onClick={() => setArrowRight(true)}
									>
										<ArrowRightIcon />
									</span>
								) : (
									<span
										className=" cursor-pointer"
										onClick={() => setArrowRight(false)}
									>
										<ArrowLeft width={32} height={32} />
									</span>
								)}
							</div>

							{!arrowRight ? (
								<div className=" grid grid-cols-2 gap-3 py-3">
									<div className=" flex flex-col gap-1 w-full">
										<Input
											type="number"
											value={formData.delay.value}
											onChange={(e) => {
												const value =
													parseInt(e.target.value) ||
													0;
												handleDelayChange(
													'value',
													value
												);
											}}
											className="h-12 !py-[5px] !px-4  !rounded-lg border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none"
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
											<SelectTrigger className="h-12 !py-[5px] !px-4  !rounded-lg border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none">
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Minutes">
													{__('Minutes', 'quillcrm')}
												</SelectItem>
												<SelectItem value="Hours">
													{__('Hours', 'quillcrm')}
												</SelectItem>
												<SelectItem value="Days">
													{__('Days', 'quillcrm')}
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							) : (
								<>
									<div className=" flex  gap-3 py-3">
										<div className=" flex flex-col gap-1">
											<Label>
												{__('From', 'quillcrm')}{' '}
											</Label>
											<Input
												type="time"
												value={
													formData.sending_time_range
														.from
												}
												onChange={(e) =>
													handleTimeRangeChange(
														'from',
														e.target.value
													)
												}
												className="h-12  !rounded-lg border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none"
											/>
										</div>
										<div className=" flex flex-col gap-1 ">
											<Label>
												{__('To', 'quillcrm')}{' '}
											</Label>
											<Input
												type="time"
												value={
													formData.sending_time_range
														.to
												}
												onChange={(e) =>
													handleTimeRangeChange(
														'to',
														e.target.value
													)
												}
												className="h-12 !rounded-lg border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none"
											/>
										</div>
									</div>
									<div>
										<div className="flex items-center space-x-3">
											<Checkbox
												id="enableSpecificDays"
												checked={
													formData.enable_specific_days
												}
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
												className="text-sm font-semibold leading-[23px] text-[#777] flex flex-col cursor-pointer"
											>
												{__(
													'Enable Specific Days Only',
													'quillcrm'
												)}
											</Label>
										</div>

										{formData.enable_specific_days && (
											<div className="ml-6 space-y-3">
												<p className="text-sm text-gray-600">
													{__(
														'Please select allowed days to send emails',
														'quillcrm'
													)}
												</p>
												<div className="grid grid-cols-2  lg:grid-cols-4 gap-3">
													{Object.entries(
														formData.days
													).map(([day, checked]) => (
														<div
															key={day}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={`day-${day}`}
																checked={
																	checked
																}
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
																		.charAt(
																			0
																		)
																		.toUpperCase() +
																		day.slice(
																			1
																		),
																	'quillcrm'
																)}
															</Label>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</>
							)}

							{!arrowRight ? (
								<p className="text-sm font-semibold leading-[23px] text-[#777] flex flex-col">
									{__(
										'Set after how many minutes the email will be triggered from the starting date',
										'quillcrm'
									)}
								</p>
							) : (
								<p className="text-sm font-semibold leading-[23px] text-[#777] flex flex-col">
									{__(
										'If you select a time range then FluentCRM schedule the email to that time range',
										'quillcrm'
									)}
								</p>
							)}
						</div>
					)}
				</div>
				{/* merge tags */}
				<div className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl p-4 flex flex-col">
					<div className="flex justify-between items-center space-x-3">
						<Label
							htmlFor="addMergeTags"
							className="text-base leading-[26px] font-medium text-[#09090B] cursor-pointer"
						>
							{__('Add Merge Tags', 'quillcrm')}
						</Label>
						<Switch
							id="addMergeTags"
							onCheckedChange={() => handleMergeTagClick()}
							className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
						/>
					</div>
				</div>
				{/* UTM Parameters Section */}
				<div className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl p-4 flex flex-col">
					<div className="flex justify-between items-center space-x-3">
						<Label
							htmlFor="addUtmParameters"
							className="text-base leading-[26px] font-medium text-[#09090B] cursor-pointer"
						>
							{__('Add UTM Parameters For URLs', 'quillcrm')}
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
									'quillcrm'
								)}
							</p>
							<div className="grid grid-cols-1 gap-4">
								<div className="space-y-2">
									<Label
										htmlFor="campaignSource"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Source', 'quillcrm')}
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
											'quillcrm'
										)}
										className=" h-12 py-[5px] px-4 border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none !rounded-[8px]"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignMedium"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Medium', 'quillcrm')}
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
											'quillcrm'
										)}
										className=" h-12 py-[5px] px-4 border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none !rounded-[8px]"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignName"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Name', 'quillcrm')}
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
											'quillcrm'
										)}
										className=" h-12 py-[5px] px-4 border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none !rounded-[8px]"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignTerm"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Term', 'quillcrm')}
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
											'quillcrm'
										)}
										className=" h-12 py-[5px] px-4 border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none !rounded-[8px]"
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="campaignContent"
										className="text-sm font-medium text-gray-700"
									>
										{__('Campaign Content', 'quillcrm')}
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
											'quillcrm'
										)}
										className=" h-12 py-[5px] px-4 border !border-[#DEE1E6] bg-[#FFF] hover:bg-[#FFF] !shadow-none !rounded-[8px]"
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Email Template Section */}
				{/* Message Section */}
				<div className=" rounded-2xl border border-[#DEE1E6] overflow-hidden ">
					{/* Message Header */}
					<div className="bg-[#F8F8F8] px-4 py-3 border-b border-[#DEE1E6]">
						<span className="font-semibold text-base text-[#09090B]">
							Message
						</span>
					</div>

					{/* Subject Field */}
					<div className="px-4 py-3 flex flex-col gap-2">
						<Input
							type="text"
							placeholder="Type subject here"
							className="w-full text-sm !shadow-none !outline-none !border-0 !ring-0 !px-0  focus:!ring-0"
							id="emailSubject"
							ref={subjectInputRef}
							value={formData.subject}
							onChange={(e) =>
								handleChange('subject', e.target.value)
							}
						/>
					</div>
					<div className="h-[2px] w-full bg-[#DEE1E6]"></div>
					<div className="px-4 py-3 flex flex-col gap-2">
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
								'quillcrm'
							)}
							className="resize-none w-full text-sm !shadow-none !outline-none !border-0 !ring-0 !px-0  focus:!ring-0"
						/>
					</div>
					<div className="h-[2px] w-full bg-[#DEE1E6]"></div>
					<div className=" px-4 py-3 flex flex-col gap-2">
						<Label>{__('Build Email', 'quillcrm')}</Label>
						<Button
							onClick={handleOpenBuilder}
							className="bg-[#458DC7] hover:bg-[#428ac4] text-white px-6 py-3 w-fit rounded-[8px]"
						>
							{formData.email_body
								? __('Edit Template', 'quillcrm')
								: __('Open Builder', 'quillcrm')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SequenceMailModal;
