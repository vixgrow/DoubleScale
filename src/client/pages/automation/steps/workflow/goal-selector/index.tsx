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
import config from '@doublescale/config';
import { getFilteredGoalsByTrigger } from '@doublescale/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import ProAutomationModal from '@doublescale/components/pro-automation-modal';

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

	// Check if Pro plugin is active once
	const proPluginData = config.getProPluginData();
	const isProActive = proPluginData.is_active;

	// Get current trigger from store
	const currentTrigger = useSelect((select: any) => {
		return select('doublescale/core').getCurrentTrigger();
	}, []);

	// Get filtered goals based on current trigger
	const filteredAutomationGoals = getFilteredGoalsByTrigger(currentTrigger);

	// Helper function to get tooltip message for disabled goals
	const getDisabledTooltip = (groupLabel: string) => {
		if (groupLabel === 'WooCommerce') {
			return __(
				'WooCommerce plugin is not installed or activated. Install WooCommerce to use these goals.',
				'doublescale'
			);
		}
		if (groupLabel === 'LearnDash') {
			return __(
				'LearnDash plugin is not installed or activated. Install LearnDash to use these goals.',
				'doublescale'
			);
		}
		if (groupLabel === 'MemberPress') {
			return __(
				'MemberPress plugin is not installed or activated. Install MemberPress to use these goals.',
				'doublescale'
			);
		}
		if (groupLabel === 'Paid Memberships Pro') {
			return __(
				'Paid Memberships Pro plugin is not installed or activated. Install Paid Memberships Pro to use these goals.',
				'doublescale'
			);
		}
		if (groupLabel === 'Order' || groupLabel === 'SureCart') {
			return __(
				'SureCart plugin is not installed or activated. Install SureCart to use these goals.',
				'doublescale'
			);
		}
		return __(
			'This integration is not available. Please install the required plugin.',
			'doublescale'
		);
	};

	const toggleGroup = (key: string) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handleSelect = async (goalKey: string, goal: any) => {
		// Check if this is a Pro feature AND Pro plugin is not active
		const isProFeatureLockedOut = goal.is_pro && !isProActive;

		if (isProFeatureLockedOut) {
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
						(goalCategory, categoryKey) => {
							// Flatten all goals from all groups into one list for display
							const allGoalsInCategory: Array<{
								goal: any;
								goalKey: string;
								group: any;
							}> = [];
							map(goalCategory.groups, (group) => {
								map(group.goals, (goal, goalKey) => {
									allGoalsInCategory.push({
										goal,
										goalKey,
										group,
									});
								});
							});

							// Skip categories with no goals
							if (allGoalsInCategory.length === 0) {
								return null;
							}

							return (
								<Card
									key={categoryKey}
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
													toggleGroup(categoryKey)
												}
												className="h-8 w-8 p-0"
											>
												{collapsedGroups[
													categoryKey
												] ? (
													<ChevronDown className="h-6 w-6" />
												) : (
													<ChevronUp className="h-6 w-6" />
												)}
											</Button>
										</CardTitle>
									</CardHeader>
									{!collapsedGroups[categoryKey] && (
										<CardContent className="p-0">
											<div className="flex flex-col divide-y">
												{allGoalsInCategory.map(
													({
														goal,
														goalKey,
														group,
													}) => {
														const goalButton = (
															<div
																key={goalKey}
																className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
															>
																<div className="flex items-center gap-2">
																	<span className="text-sm">
																		{
																			goal.label
																		}
																	</span>
																	{goal.is_pro &&
																		!isProActive && (
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
																		(group.is_disabled ||
																			isSaving)
																	}
																	className={`text-primary bg-transparent shadow-none font-semibold rounded-full p-2 hover:bg-primary/10 ${value === goalKey ? 'border-2 border-primary' : 'border'}`}
																>
																	{isSaving &&
																	value ===
																		goalKey
																		? __(
																				'Saving...',
																				'doublescale'
																			)
																		: __(
																				'Select',
																				'doublescale'
																			)}
																</Button>
															</div>
														);

														if (
															!goal.is_pro &&
															group.is_disabled
														) {
															return (
																<TooltipProvider
																	key={
																		goalKey
																	}
																>
																	<Tooltip>
																		<TooltipTrigger
																			asChild
																		>
																			{
																				goalButton
																			}
																		</TooltipTrigger>
																		<TooltipContent>
																			{getDisabledTooltip(
																				group.label
																			)}
																		</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
															);
														}

														return goalButton;
													}
												)}
											</div>
										</CardContent>
									)}
								</Card>
							);
						}
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
