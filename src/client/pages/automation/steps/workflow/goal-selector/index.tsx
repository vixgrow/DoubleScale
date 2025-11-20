/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { map } from 'lodash';
import { ChevronUp, ChevronDown, Lock } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import './style.scss';
import { getFilteredGoalsByTrigger } from '@quillcrm/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProAutomationModal from '@quillcrm/components/pro-automation-modal';

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
	const [collapsedGroups, setCollapsedGroups] = useState<
		Record<string, boolean>
	>({});
	const [showProModal, setShowProModal] = useState(false);
	const [selectedProGoal, setSelectedProGoal] = useState<{
		name: string;
		key: string;
	} | null>(null);

	// Get current trigger from store
	const currentTrigger = useSelect((select: any) => {
		return select('quillcrm/core').getCurrentTrigger();
	}, []);

	// Get filtered goals based on current trigger
	const filteredAutomationGoals = getFilteredGoalsByTrigger(currentTrigger);

	const toggleGroup = (key: string) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handleSelect = async (goalKey: string, goal: any) => {
		if (goal.is_pro) {
			setSelectedProGoal({ name: goal.label, key: goalKey });
			setShowProModal(true);
			return;
		}

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

	const handleCloseProModal = () => {
		setShowProModal(false);
		setSelectedProGoal(null);
	};

	return (
		<>
			<div className="py-4">
				<div className="flex flex-col gap-4">
					{map(
						filteredAutomationGoals,
						(goalCategory, categoryKey) => (
							<div
								key={categoryKey}
								className="flex flex-col gap-4"
							>
								{map(
									goalCategory.groups,
									(group, groupIndex) => (
										<Card
											key={`${categoryKey}-${groupIndex}`}
											className="shadow-none"
										>
											<CardHeader className="px-4 py-2 border-b-2">
												<CardTitle className="flex items-center justify-between font-bold text-base">
													<div className="flex items-center gap-2">
														{goalCategory.label}
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															toggleGroup(
																`${categoryKey}-${groupIndex}`
															)
														}
														className="h-8 w-8 p-0"
													>
														{collapsedGroups[
															`${categoryKey}-${groupIndex}`
														] ? (
															<ChevronDown className="h-6 w-6" />
														) : (
															<ChevronUp className="h-6 w-6" />
														)}
													</Button>
												</CardTitle>
											</CardHeader>
											{!collapsedGroups[
												`${categoryKey}-${groupIndex}`
											] && (
												<CardContent className="p-0">
													<div className="flex flex-col divide-y">
														{map(
															group.goals,
															(goal, goalKey) => {
																return (
																	<div
																		key={
																			goalKey
																		}
																		className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
																	>
																		<div className="flex items-center gap-2">
																			<span className="text-sm">
																				{
																					goal.label
																				}
																			</span>
																			{goal.is_pro && (
																				<Lock className="h-4 w-4 text-orange-500" />
																			)}
																		</div>
																		<Button
																			onClick={() =>
																				handleSelect(
																					goalKey,
																					goal
																				)
																			}
																			disabled={
																				!goal.is_pro &&
																				isSaving
																			}
																			className={`text-primary bg-transparent shadow-none font-semibold rounded-full p-2 hover:bg-primary/10 ${value === goalKey ? 'border-2 border-primary' : 'border'}`}
																		>
																			{isSaving &&
																			value ===
																				goalKey
																				? __(
																						'Saving...',
																						'quillcrm'
																					)
																				: __(
																						'Select',
																						'quillcrm'
																					)}
																		</Button>
																	</div>
																);
															}
														)}
													</div>
												</CardContent>
											)}
										</Card>
									)
								)}
							</div>
						)
					)}
				</div>
			</div>

			{/* PRO Modal */}
			{selectedProGoal && (
				<ProAutomationModal
					visible={showProModal}
					onClose={handleCloseProModal}
					featureName={selectedProGoal.name}
				/>
			)}
		</>
	);
};

export default GoalSelector;
