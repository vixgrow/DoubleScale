/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface GoalSelectorProps {
	value: string;
	onChange: (value: string) => void;
	onSave: (goalKey: string) => void;
}

const GoalSelector: React.FC<GoalSelectorProps> = ({
	onChange,
	value,
	onSave,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
	const automationGoals = ConfigAPI.getAutomationGoals();

	const toggleGroup = (key: string) => {
		setCollapsedGroups(prev => ({
			...prev,
			[key]: !prev[key]
		}));
	};

	const handleSelect = async (goalKey: string) => {
		onChange(goalKey);
		setIsSaving(true);
		try {
			await onSave(goalKey);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="py-4">
			<div className="flex flex-col gap-4">
				{map(automationGoals, (goalCategory, categoryKey) => (
					<div key={categoryKey} className="flex flex-col gap-4">
						{map(goalCategory.groups, (group, groupIndex) => (
							<Card key={`${categoryKey}-${groupIndex}`} className="shadow-none">
								<CardHeader className="px-4 py-2 border-b-2">
									<CardTitle className="flex items-center justify-between font-bold text-base">
										<div className="flex items-center gap-2">
											{goalCategory.label}
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => toggleGroup(`${categoryKey}-${groupIndex}`)}
											className="h-8 w-8 p-0"
										>
											{collapsedGroups[`${categoryKey}-${groupIndex}`] ? (
												<ChevronDown className="h-6 w-6" />
											) : (
												<ChevronUp className="h-6 w-6" />
											)}
										</Button>
									</CardTitle>
								</CardHeader>
								{!collapsedGroups[`${categoryKey}-${groupIndex}`] && (
									<CardContent className="p-0">
										<div className="flex flex-col divide-y">
											{map(group.goals, (goal, goalKey) => {
												return (
													<div
														key={goalKey}
														className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
													>
														<span className="text-sm">{goal.label}</span>
														<Button
															onClick={() => handleSelect(goalKey)}
															disabled={isSaving}
															className={`text-primary bg-transparent shadow-none font-semibold rounded-full p-2 hover:bg-primary/10 ${value === goalKey ? 'border-2 border-primary' : 'border'}`}
														>
															{isSaving && value === goalKey
																? __('Saving...', 'quillcrm')
																: __('Select', 'quillcrm')}
														</Button>
													</div>
												);
											})}
										</div>
									</CardContent>
								)}
							</Card>
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default GoalSelector;
