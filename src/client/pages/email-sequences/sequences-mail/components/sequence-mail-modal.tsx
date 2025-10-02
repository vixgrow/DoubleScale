import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

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

// Import types
import { SequenceMailModalProps, SequenceMailFormData } from '../../types';

const defaultData: SequenceMailFormData = {
	subject: '',
	preHeader: '',
	delay: {
		value: 0,
		unit: 'Minutes',
	},
	sendingTimeRange: {
		from: '',
		to: '',
	},
	enableSpecificDays: false,
	days: {
		monday: false,
		tuesday: false,
		wednesday: false,
		thursday: false,
		friday: false,
		saturday: false,
		sunday: false,
	},
	addUtmParameters: false,
	emailBody: '',
};

const SequenceMailModal: React.FC<SequenceMailModalProps> = ({
	isOpen,
	onClose,
	title,
	initialData = defaultData,
	onSave,
}) => {
	const [formData, setFormData] = useState<SequenceMailFormData>(initialData);
	const [delayValue, setDelayValue] = useState(initialData.delay.value);

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
			sendingTimeRange: {
				...prev.sendingTimeRange,
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

	const handleSave = () => {
		onSave(formData);
		onClose();
	};

	const handleDecrease = () => {
		if (delayValue > 0) {
			const newValue = delayValue - 1;
			setDelayValue(newValue);
			handleDelayChange('value', newValue);
		}
	};

	const handleIncrease = () => {
		const newValue = delayValue + 1;
		setDelayValue(newValue);
		handleDelayChange('value', newValue);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-6 py-4">
					<div className="grid grid-cols-2 gap-6">
						<div>
							<Label htmlFor="emailSubject">
								{__('Email Subject', 'quillcrm')}
							</Label>
							<div className="flex mt-1">
								<Input
									id="emailSubject"
									value={formData.subject}
									onChange={(e) =>
										handleChange('subject', e.target.value)
									}
									className="flex-grow"
								/>
								<Button variant="outline" className="ml-2 px-3">
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<rect
											x="3"
											y="3"
											width="18"
											height="18"
											rx="2"
											ry="2"
										></rect>
										<circle
											cx="8.5"
											cy="8.5"
											r="1.5"
										></circle>
										<polyline points="21 15 16 10 5 21"></polyline>
									</svg>
								</Button>
								<Button variant="outline" className="ml-2 px-3">
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="12" cy="12" r="1"></circle>
										<circle cx="19" cy="12" r="1"></circle>
										<circle cx="5" cy="12" r="1"></circle>
									</svg>
								</Button>
							</div>
						</div>
						<div>
							<Label htmlFor="emailPreHeader">
								{__('Email Pre-Header', 'quillcrm')}
							</Label>
							<Textarea
								id="emailPreHeader"
								value={formData.preHeader}
								onChange={(e) =>
									handleChange('preHeader', e.target.value)
								}
								className="mt-1"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div>
							<Label>{__('Delay', 'quillcrm')}</Label>
							<div className="flex items-center mt-1">
								<div className="flex border rounded-md">
									<Button
										type="button"
										variant="ghost"
										onClick={handleDecrease}
										className="px-3 border-r"
									>
										-
									</Button>
									<Input
										type="number"
										value={delayValue}
										onChange={(e) => {
											const value = parseInt(
												e.target.value
											);
											setDelayValue(value);
											handleDelayChange('value', value);
										}}
										className="w-16 border-0 text-center"
									/>
									<Button
										type="button"
										variant="ghost"
										onClick={handleIncrease}
										className="px-3 border-l"
									>
										+
									</Button>
								</div>
								<Select
									value={formData.delay.unit}
									onValueChange={(value) =>
										handleDelayChange('unit', value)
									}
								>
									<SelectTrigger className="ml-2 w-[180px]">
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
							<p className="text-sm text-muted-foreground mt-1">
								{__(
									'Set after how many minutes the email will be triggered from the starting date',
									'quillcrm'
								)}
							</p>
						</div>

						<div>
							<Label>
								{__('Sending Time Range', 'quillcrm')}
							</Label>
							<div className="flex items-center mt-1">
								<div className="flex items-center">
									<svg
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="12" cy="12" r="10"></circle>
										<polyline points="12 6 12 12 16 14"></polyline>
									</svg>
									<Input
										type="time"
										value={formData.sendingTimeRange.from}
										onChange={(e) =>
											handleTimeRangeChange(
												'from',
												e.target.value
											)
										}
										className="ml-2 w-24"
									/>
								</div>
								<span className="mx-4">
									{__('To', 'quillcrm')}
								</span>
								<Input
									type="time"
									value={formData.sendingTimeRange.to}
									onChange={(e) =>
										handleTimeRangeChange(
											'to',
											e.target.value
										)
									}
									className="w-24"
								/>
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								{__(
									'If you select a time range then FluentCRM schedule the email to that time range',
									'quillcrm'
								)}
							</p>
						</div>
					</div>

					<div>
						<div className="flex items-center space-x-2">
							<Checkbox
								id="enableSpecificDays"
								checked={formData.enableSpecificDays}
								onCheckedChange={(checked) =>
									handleChange('enableSpecificDays', checked)
								}
							/>
							<Label htmlFor="enableSpecificDays">
								{__('Enable Specific Days Only', 'quillcrm')}
							</Label>
						</div>

						{formData.enableSpecificDays && (
							<div className="mt-2">
								<p className="text-sm mb-2">
									{__(
										'Please select allowed days to send emails',
										'quillcrm'
									)}
								</p>
								<div className="flex flex-wrap gap-4">
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
												/>
												<Label htmlFor={`day-${day}`}>
													{__(
														day
															.charAt(0)
															.toUpperCase() +
															day.slice(1),
														'quillcrm'
													)}
												</Label>
											</div>
										)
									)}
								</div>
							</div>
						)}
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="addUtmParameters"
							checked={formData.addUtmParameters}
							onCheckedChange={(checked) =>
								handleChange('addUtmParameters', !!checked)
							}
						/>
						<Label htmlFor="addUtmParameters">
							{__('Add UTM Parameters For URLs', 'quillcrm')}
						</Label>
					</div>

					<div>
						<Label>{__('Email Body', 'quillcrm')}</Label>
						<div className="border rounded-md mt-1 p-4 min-h-[200px] bg-white">
							<Textarea
								value={formData.emailBody}
								onChange={(e) =>
									handleChange('emailBody', e.target.value)
								}
								className="min-h-[200px]"
							/>
						</div>
					</div>
				</div>

				<div className="flex justify-between">
					<div>
						<Button variant="outline" onClick={onClose}>
							{__('Back', 'quillcrm')}
						</Button>
					</div>
					<div className="flex space-x-2">
						<Button variant="outline" onClick={onClose}>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							onClick={handleSave}
							className="bg-green-500 hover:bg-green-600 text-white"
						>
							{__('Save', 'quillcrm')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SequenceMailModal;
