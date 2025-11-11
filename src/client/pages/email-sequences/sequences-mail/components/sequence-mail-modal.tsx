import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

// Import shadcn UI components
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

// Import Builder component
import Builder from '@/builder/index';

// Import types
import { SequenceMailModalProps, SequenceMailFormData } from '../../types';

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
	const subjectInputRef = useRef<HTMLInputElement>(null);
	const preHeaderTextareaRef = useRef<HTMLTextAreaElement>(null);

	const { setMergeTagsVisible, setMergeTagCallback, createNotice } =
		useDispatch('quillcrm/core');

	// Reset form data when modal opens or initialData changes
	const [wasOpen, setWasOpen] = useState(false);

	useEffect(() => {
		if (isOpen && !wasOpen) {
			// Only reset when modal is first opened
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
			// Reset the flag when modal is closed
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

	const handleDecrease = () => {
		if (formData.delay.value > 0) {
			const newValue = formData.delay.value - 1;
			handleDelayChange('value', newValue);
		}
	};

	const handleIncrease = () => {
		const newValue = formData.delay.value + 1;
		handleDelayChange('value', newValue);
	};

	const handleMergeTagClick = () => {
		// Set up callback to copy to clipboard instead of inserting
		setMergeTagCallback((tagValue: string) => {
			// copy to clipboard
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
			// Provide a safe default when nothing is in the DB yet
			return {
				sections: [],
				globalSettings: {},
				buttonSettings: {},
			} as any;
		}
		try {
			const emailBodyJson = JSON.parse(formData.email_body);
			// If the data has a 'type' and 'value' wrapper, extract the value
			if (emailBodyJson.type === 'builder' && emailBodyJson.value) {
				return emailBodyJson.value;
			}
			// Otherwise return as-is (in case it's already in the correct format)
			return emailBodyJson ?? {
				sections: [],
				globalSettings: {},
				buttonSettings: {},
			};
		} catch (error) {
			console.error('Failed to parse email body:', error);
			return {
				sections: [],
				globalSettings: {},
				buttonSettings: {},
			} as any;
		}
	};

	return (
		<>
			<Dialog open={isOpen && !isBuilderOpen} onOpenChange={onClose}>
				<DialogContent className="sequence-mail-modal max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
					<DialogHeader className="flex-shrink-0">
						<DialogTitle>
							<div className="flex items-center gap-2">
								<div className="flex-1"> {title} </div>
								<Button
									variant="outline"
									size="sm"
									className="px-3 py-2 h-10 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
									onClick={() => handleMergeTagClick()}
								>
									{__('Insert merge tags', 'quillcrm')}
								</Button>
							</div>
						</DialogTitle>
					</DialogHeader>
					<div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
						<div className="space-y-6 py-4">
							{/* Email Subject and Pre-Header Section */}
							<Card className="border-0 shadow-sm">
								<CardContent className="p-6">
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label
												htmlFor="emailSubject"
												className="text-sm font-medium text-gray-700"
											>
												{__(
													'Email Subject',
													'quillcrm'
												)}
											</Label>
											<div className="flex gap-2">
												<Input
													id="emailSubject"
													ref={subjectInputRef}
													value={formData.subject}
													onChange={(e) =>
														handleChange(
															'subject',
															e.target.value
														)
													}
													className="flex-1"
													placeholder={__(
														'Enter email subject...',
														'quillcrm'
													)}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label
													htmlFor="email_pre_header"
													className="text-sm font-medium text-gray-700"
												>
													{__(
														'Email Pre-Header',
														'quillcrm'
													)}
												</Label>
											</div>
											<Textarea
												id="emailPreHeader"
												ref={preHeaderTextareaRef}
												value={formData.pre_header}
												onChange={(e) =>
													handleChange(
														'pre_header',
														e.target.value
													)
												}
												rows={3}
												placeholder={__(
													'Enter pre-header text...',
													'quillcrm'
												)}
												className="resize-none"
											/>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Timing and Scheduling Section */}
							<Card className="border-0 shadow-sm">
								<CardContent className="p-6">
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label className="text-sm font-medium text-gray-700">
												{__('Delay', 'quillcrm')}
											</Label>
											<div className="flex items-center gap-2">
												<div className="flex border rounded-md bg-white">
													<Button
														type="button"
														variant="ghost"
														onClick={handleDecrease}
														className="px-3 py-2 border-r hover:bg-gray-50 rounded-l-md rounded-r-none"
													>
														-
													</Button>
													<Input
														type="number"
														value={
															formData.delay.value
														}
														onChange={(e) => {
															const value =
																parseInt(
																	e.target
																		.value
																) || 0;
															handleDelayChange(
																'value',
																value
															);
														}}
														className="w-20 border-0 text-center rounded-none focus:ring-0"
														min="0"
													/>
													<Button
														type="button"
														variant="ghost"
														onClick={handleIncrease}
														className="px-3 py-2 border-l hover:bg-gray-50 rounded-r-md rounded-l-none"
													>
														+
													</Button>
												</div>
												<Select
													value={formData.delay.unit}
													onValueChange={(value) =>
														handleDelayChange(
															'unit',
															value
														)
													}
												>
													<SelectTrigger className="w-[140px]">
														<SelectValue placeholder="Select unit" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Minutes">
															{__(
																'Minutes',
																'quillcrm'
															)}
														</SelectItem>
														<SelectItem value="Hours">
															{__(
																'Hours',
																'quillcrm'
															)}
														</SelectItem>
														<SelectItem value="Days">
															{__(
																'Days',
																'quillcrm'
															)}
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<p className="text-xs text-gray-500 mt-1">
												{__(
													'Set after how many minutes the email will be triggered from the starting date',
													'quillcrm'
												)}
											</p>
										</div>

										<div className="space-y-2">
											<Label className="text-sm font-medium text-gray-700">
												{__(
													'Sending Time Range',
													'quillcrm'
												)}
											</Label>
											<div className="flex items-center gap-3">
												<div className="flex items-center gap-2">
													<svg
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
														className="text-gray-400"
													>
														<circle
															cx="12"
															cy="12"
															r="10"
														></circle>
														<polyline points="12 6 12 12 16 14"></polyline>
													</svg>
													<Input
														type="time"
														value={
															formData
																.sending_time_range
																.from
														}
														onChange={(e) =>
															handleTimeRangeChange(
																'from',
																e.target.value
															)
														}
														className="w-28"
													/>
												</div>
												<span className="text-sm text-gray-500 font-medium">
													{__('To', 'quillcrm')}
												</span>
												<Input
													type="time"
													value={
														formData
															.sending_time_range
															.to
													}
													onChange={(e) =>
														handleTimeRangeChange(
															'to',
															e.target.value
														)
													}
													className="w-28"
												/>
											</div>
											<p className="text-xs text-gray-500 mt-1">
												{__(
													'If you select a time range then FluentCRM schedule the email to that time range',
													'quillcrm'
												)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Advanced Settings Section */}
							<Card className="border-0 shadow-sm">
								<CardContent className="p-6">
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
												className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
											/>
											<Label
												htmlFor="enable_specific_days"
												className="text-sm font-medium text-gray-700 cursor-pointer"
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
												<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
																className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
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
								</CardContent>
							</Card>

							{/* UTM Parameters Section */}
							<Card className="border-0 shadow-sm">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center space-x-3">
											<Checkbox
												id="addUtmParameters"
												checked={
													formData.add_utm_parameters
												}
												onCheckedChange={(checked) =>
													handleChange(
														'add_utm_parameters',
														!!checked
													)
												}
												className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
											/>
											<Label
												htmlFor="add_utm_parameters"
												className="text-sm font-medium text-gray-700 cursor-pointer"
											>
												{__(
													'Add UTM Parameters For URLs',
													'quillcrm'
												)}
											</Label>
										</div>

										{formData.add_utm_parameters && (
											<div className="ml-6 space-y-4">
												<p className="text-sm text-gray-600 mb-4">
													{__(
														'Configure UTM parameters to track email campaign performance',
														'quillcrm'
													)}
												</p>
												<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label
															htmlFor="campaignSource"
															className="text-sm font-medium text-gray-700"
														>
															{__(
																'Campaign Source',
																'quillcrm'
															)}
															<span className="text-red-500 ml-1">
																*
															</span>
														</Label>
														<Input
															id="campaignSource"
															type="text"
															value={
																formData
																	.utm_parameters
																	?.campaign_source ||
																''
															}
															onChange={(e) =>
																handleUtmParameterChange(
																	'campaign_source',
																	e.target
																		.value
																)
															}
															placeholder={__(
																'The referrer (e.g. google, newsletter)',
																'quillcrm'
															)}
															className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
														/>
													</div>

													<div className="space-y-2">
														<Label
															htmlFor="campaignMedium"
															className="text-sm font-medium text-gray-700"
														>
															{__(
																'Campaign Medium',
																'quillcrm'
															)}
															<span className="text-red-500 ml-1">
																*
															</span>
														</Label>
														<Input
															id="campaignMedium"
															type="text"
															value={
																formData
																	.utm_parameters
																	?.campaign_medium ||
																''
															}
															onChange={(e) =>
																handleUtmParameterChange(
																	'campaign_medium',
																	e.target
																		.value
																)
															}
															placeholder={__(
																'Marketing medium (e.g. cpc, banner, email)',
																'quillcrm'
															)}
															className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
														/>
													</div>

													<div className="space-y-2">
														<Label
															htmlFor="campaignName"
															className="text-sm font-medium text-gray-700"
														>
															{__(
																'Campaign Name',
																'quillcrm'
															)}
															<span className="text-red-500 ml-1">
																*
															</span>
														</Label>
														<Input
															id="campaignName"
															type="text"
															value={
																formData
																	.utm_parameters
																	?.campaign_name ||
																''
															}
															onChange={(e) =>
																handleUtmParameterChange(
																	'campaign_name',
																	e.target
																		.value
																)
															}
															placeholder={__(
																'Product, promo code, or slogan (e.g. spring_sale)',
																'quillcrm'
															)}
															className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
														/>
													</div>

													<div className="space-y-2">
														<Label
															htmlFor="campaignTerm"
															className="text-sm font-medium text-gray-700"
														>
															{__(
																'Campaign Term',
																'quillcrm'
															)}
														</Label>
														<Input
															id="campaignTerm"
															type="text"
															value={
																formData
																	.utm_parameters
																	?.campaign_term ||
																''
															}
															onChange={(e) =>
																handleUtmParameterChange(
																	'campaign_term',
																	e.target
																		.value
																)
															}
															placeholder={__(
																'Identify the paid keywords',
																'quillcrm'
															)}
															className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
														/>
													</div>

													<div className="space-y-2 lg:col-span-2">
														<Label
															htmlFor="campaignContent"
															className="text-sm font-medium text-gray-700"
														>
															{__(
																'Campaign Content',
																'quillcrm'
															)}
														</Label>
														<Input
															id="campaignContent"
															type="text"
															value={
																formData
																	.utm_parameters
																	?.campaign_content ||
																''
															}
															onChange={(e) =>
																handleUtmParameterChange(
																	'campaign_content',
																	e.target
																		.value
																)
															}
															placeholder={__(
																'Use to differentiate ads',
																'quillcrm'
															)}
															className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
														/>
													</div>
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Email Body Section */}
							<Card className="border-0 shadow-sm">
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<Label className="text-sm font-medium text-gray-700">
												{__(
													'Email Template',
													'quillcrm'
												)}
											</Label>
										</div>
										<div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
											<div className="text-center space-y-3">
												<div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
													<svg
														className="w-6 h-6 text-blue-600"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</div>
												<div>
													<h3 className="text-sm font-medium text-gray-900">
														{formData.email_body
															? __(
																	'Template Created',
																	'quillcrm'
																)
															: __(
																	'Create Email Template',
																	'quillcrm'
																)}
													</h3>
													<p className="text-sm text-gray-500 mt-1">
														{formData.email_body
															? __(
																	'Click to edit your email template',
																	'quillcrm'
																)
															: __(
																	'Use our visual builder to create your email',
																	'quillcrm'
																)}
													</p>
												</div>
												<Button
													onClick={handleOpenBuilder}
													className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
												>
													{formData.email_body
														? __(
																'Edit Template',
																'quillcrm'
															)
														: __(
																'Open Builder',
																'quillcrm'
															)}
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Footer Actions - Fixed at bottom */}
					<div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-gray-100 bg-white">
						<Button
							variant="outline"
							onClick={onClose}
							className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							{__('Back', 'quillcrm')}
						</Button>
						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={onClose}
								className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
							>
								{__('Cancel', 'quillcrm')}
							</Button>
							<Button
								onClick={handleSave}
								className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
							>
								{__('Save', 'quillcrm')}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Builder Modal - Rendered separately outside the Dialog */}
			{isBuilderOpen && (
				<Builder
					key={formData.email_body || 'new-email'}
					initialData={getBuilderInitialData()}
					onSave={handleBuilderSave}
					onClose={handleBuilderClose}
				/>
			)}
		</>
	);
};

export default SequenceMailModal;
