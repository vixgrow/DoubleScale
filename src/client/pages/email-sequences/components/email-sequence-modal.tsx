import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmailSequenceData } from '../types';
import { FromEmailSelector } from '@/components/from-email-selector';

interface EmailSequenceModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: EmailSequenceData) => void;
	title: string;
	initialValue?: Partial<EmailSequenceData>;
	isLoading?: boolean;
}

const EmailSequenceModal: React.FC<EmailSequenceModalProps> = ({
	open,
	onOpenChange,
	onSubmit,
	title,
	initialValue = {},
	isLoading = false,
}) => {
	const [formData, setFormData] = useState<EmailSequenceData>({
		name: initialValue.name || '',
		fromName: initialValue.fromName || '',
		fromEmail: initialValue.fromEmail || '',
		replyToName: initialValue.replyToName || '',
		replyToEmail: initialValue.replyToEmail || '',
		setCustomFromNameAndEmail:
			initialValue.setCustomFromNameAndEmail || false,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.name.trim()) {
			onSubmit(formData);
		}
	};

	const updateFormData = (
		field: keyof EmailSequenceData,
		value: string | boolean
	) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						{/* Internal Title */}
						<div className="grid gap-2">
							<Label htmlFor="name">
								{__('Internal Title', 'doublescale')}
							</Label>
							<Input
								id="name"
								placeholder={__(
									'Enter a name for your email sequence',
									'doublescale'
								)}
								value={formData.name}
								onChange={(e) =>
									updateFormData('name', e.target.value)
								}
								autoFocus
								required
							/>
						</div>

						{/* Set Custom From Name and Email Checkbox */}
						<div className="flex items-center space-x-2">
							<Checkbox
								id="setCustomFromNameAndEmail"
								checked={formData.setCustomFromNameAndEmail}
								onCheckedChange={(checked) =>
									updateFormData(
										'setCustomFromNameAndEmail',
										checked as boolean
									)
								}
							/>
							<Label
								htmlFor="setCustomFromNameAndEmail"
								className="text-blue-600"
							>
								{__(
									'Set Custom From Name and Email',
									'doublescale'
								)}
							</Label>
						</div>

						{/* Custom From Fields - Only show when checkbox is checked */}
						{formData.setCustomFromNameAndEmail && (
							<div className="grid gap-4 p-4 bg-gray-50 rounded-lg">
								{/* From Name and From Email Row */}
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<Label htmlFor="fromName">
											{__('From Name', 'doublescale')}
										</Label>
										<Input
											id="fromName"
											placeholder={__(
												'From Name',
												'doublescale'
											)}
											value={formData.fromName}
											onChange={(e) =>
												updateFormData(
													'fromName',
													e.target.value
												)
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="fromEmail">
											{__('From Email', 'doublescale')}
										</Label>
										<FromEmailSelector
											value={formData.fromEmail}
											onChange={(email, name) => {
												updateFormData('fromEmail', email);
												// Auto-fill from name if provided and current fromName is empty
												if (name && !formData.fromName) {
													updateFormData('fromName', name);
												}
											}}
										/>
									</div>
								</div>

								{/* Reply To Name and Reply To Email Row */}
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<Label htmlFor="replyToName">
											{__('Reply To Name', 'doublescale')}
										</Label>
										<Input
											id="replyToName"
											placeholder={__(
												'Reply To Name',
												'doublescale'
											)}
											value={formData.replyToName}
											onChange={(e) =>
												updateFormData(
													'replyToName',
													e.target.value
												)
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="replyToEmail">
											{__('Reply To Email', 'doublescale')}
										</Label>
										<Input
											id="replyToEmail"
											type="email"
											placeholder={__(
												'Reply To Email',
												'doublescale'
											)}
											value={formData.replyToEmail}
											onChange={(e) =>
												updateFormData(
													'replyToEmail',
													e.target.value
												)
											}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							type="button"
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="submit"
							disabled={!formData.name.trim() || isLoading}
						>
							{isLoading
								? __('Saving...', 'doublescale')
								: __('Save', 'doublescale')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default EmailSequenceModal;
export type { EmailSequenceData };
