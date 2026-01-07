/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import { LeadScoringRule } from './index';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import RulesBuilder, { RuleItem } from '@quillcrm/components/rules-builder';
import { getFilteredRulesGroups } from '@quillcrm/utils';

interface RuleDialogProps {
	visible: boolean;
	selectedRule: LeadScoringRule | null;
	rule: {
		title: string;
		status: 'active' | 'inactive';
		points: number;
		is_adding: boolean;
		settings?: Record<string, any>;
	};
	isSaving: boolean;
	onClose: () => void;
	onSubmit: () => void;
	onRuleChange: (rule: any) => void;
	onSelectedRuleChange: (rule: LeadScoringRule | null) => void;
}

export const RuleDialog: React.FC<RuleDialogProps> = ({
	visible,
	selectedRule,
	rule,
	isSaving,
	onClose,
	onSubmit,
	onRuleChange,
	onSelectedRuleChange,
}) => {
	const isEditing = !!selectedRule;
	const [conditions, setConditions] = useState<Array<Array<RuleItem>>>([]);
	const rulesGroups = getFilteredRulesGroups(false); // false = non-automation rules

	// Initialize conditions from settings
	useEffect(() => {
		const currentSettings = selectedRule?.settings || rule.settings || {};
		if (
			currentSettings.conditions &&
			Array.isArray(currentSettings.conditions)
		) {
			setConditions(currentSettings.conditions);
		} else {
			// Initialize with one empty condition if none exist
			const firstGroup = Object.keys(rulesGroups)[0];
			const firstRule = firstGroup
				? Object.keys(rulesGroups[firstGroup].rules)[0]
				: '';
			setConditions([
				[
					{
						rule: firstRule,
						operator: 'is',
						value: '',
						selectedGroup: firstGroup,
					},
				],
			]);
		}
	}, [visible, selectedRule, rule]);

	const handleChange = (field: string, value: any) => {
		if (selectedRule) {
			onSelectedRuleChange({
				...selectedRule,
				[field]: value,
			});
		} else {
			onRuleChange({
				...rule,
				[field]: value,
			});
		}
	};

	const handleConditionsChange = (newConditions: Array<Array<RuleItem>>) => {
		setConditions(newConditions);
		// Update the settings with the new conditions
		const updatedSettings = {
			...(selectedRule?.settings || rule.settings || {}),
			conditions: newConditions,
		};
		handleChange('settings', updatedSettings);
	};

	const currentData = selectedRule || rule;

	return (
		<Dialog open={visible} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? __('Edit Lead Scoring Rule', 'quillcrm')
							: __('Create Lead Scoring Rule', 'quillcrm')}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? __(
									'Update the lead scoring rule details below.',
									'quillcrm'
								)
							: __(
									'Create a new lead scoring rule to automatically score your contacts.',
									'quillcrm'
								)}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Title */}
					<div className="grid gap-2">
						<Label htmlFor="title">
							{__('Rule Title', 'quillcrm')}{' '}
							<span className="text-red-500">*</span>
						</Label>
						<Input
							id="title"
							placeholder={__('Enter rule title', 'quillcrm')}
							value={currentData.title}
							onChange={(e) =>
								handleChange('title', e.target.value)
							}
							className="col-span-3"
						/>
					</div>

					{/* Points and Type */}
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="points">
								{__('Points', 'quillcrm')}{' '}
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="points"
								type="number"
								min="0"
								placeholder={__('Enter points', 'quillcrm')}
								value={currentData.points}
								onChange={(e) =>
									handleChange(
										'points',
										parseInt(e.target.value) || 0
									)
								}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="type">
								{__('Type', 'quillcrm')}{' '}
								<span className="text-red-500">*</span>
							</Label>
							<Select
								value={
									currentData.is_adding ? 'add' : 'subtract'
								}
								onValueChange={(value) =>
									handleChange('is_adding', value === 'add')
								}
							>
								<SelectTrigger id="type">
									<SelectValue
										placeholder={__(
											'Select type',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="add">
										{__('Add Points', 'quillcrm')}
									</SelectItem>
									<SelectItem value="subtract">
										{__('Subtract Points', 'quillcrm')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Status */}
					<div className="grid gap-2">
						<Label htmlFor="status">
							{__('Status', 'quillcrm')}
						</Label>
						<Select
							value={currentData.status}
							onValueChange={(value) =>
								handleChange('status', value)
							}
						>
							<SelectTrigger id="status">
								<SelectValue
									placeholder={__(
										'Select status',
										'quillcrm'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">
									{__('Active', 'quillcrm')}
								</SelectItem>
								<SelectItem value="inactive">
									{__('Inactive', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Conditions */}
					<div className="grid gap-2 mt-4">
						<Label className="text-base font-semibold">
							{__('When to apply this rule?', 'quillcrm')}
						</Label>
						<p className="text-sm text-gray-500 mb-2">
							{__(
								'Define conditions that must be met for this rule to apply to a contact.',
								'quillcrm'
							)}
						</p>
						<RulesBuilder
							rules={conditions}
							onChange={handleConditionsChange}
							rulesGroups={rulesGroups}
							className="w-full"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isSaving}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						onClick={onSubmit}
						disabled={isSaving}
						variant="gradient"
					>
						{isSaving
							? __('Saving...', 'quillcrm')
							: isEditing
								? __('Update Rule', 'quillcrm')
								: __('Create Rule', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
