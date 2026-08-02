/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useLayoutEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { map } from 'lodash';
import { ChevronDown, ChevronRight, Layers, Lock } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { AutomationsIcon, SureCartIcon } from '@doublescale/components'; 
import { cn } from '@/lib/utils';
import config from '@doublescale/config';
import { isProActive as checkProActive } from '@doublescale/hooks/use-is-pro-active';
import { getFilteredGoalsByTrigger } from '@doublescale/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import WocommerceIcon from '@doublescale/shared/icons/wocommerce';


const GoalCategoryHeaderIcon = ({
	sourceKey,
}: {
	sourceKey: string;
}) => {
	switch (sourceKey) {
		case 'automation':
			return (
				<span className=" text-[#0D9DFC]">
					<AutomationsIcon width={24} height={24} />
				</span>
			);
		case 'woocommerce':
			return (
				<span className="">
					<WocommerceIcon width={24} height={24} />
				</span>
			);
		case 'surecart':
			return (
				<span className="text-[#08A4A8]">
					<SureCartIcon />
				</span>
			);
		default:
			return (
				<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
					<Layers className="size-5" strokeWidth={1.75} />
				</span>
			);
	}
};

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

	// Check if Pro plugin is active once
	const isProActive = checkProActive();

	// Get current trigger from store
	const currentTrigger = useSelect((select: any) => {
		return select('doublescale/core').getCurrentTrigger();
	}, []);

	// Get filtered goals based on current trigger
	const filteredAutomationGoals = getFilteredGoalsByTrigger(currentTrigger);
	const goalCategoryIds = Object.keys(filteredAutomationGoals).sort().join('|');

	// Helper function to get tooltip message for disabled goals
	const getDisabledTooltip = (groupLabel: string) => {
		if (groupLabel === 'Helpdesk') {
			return __(
				'The Helpdesk module is turned off. Enable it under Settings → Modules to use these goals.',
				'doublescale'
			);
		}
		if (groupLabel === 'Booking') {
			return __(
				'The Booking module is turned off. Enable it under Settings → Modules to use these goals.',
				'doublescale'
			);
		}
		if (groupLabel === 'Deal') {
			return __(
				'The Pipelines & Deals module is turned off. Enable it under Settings → Modules to use these goals.',
				'doublescale'
			);
		}
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
			'This integration is not available. Enable the required module under Settings → Modules, or install the required plugin.',
			'doublescale'
		);
	};

	// Match reference: first two sources expanded (e.g. Automation, WooCommerce), rest collapsed
	useLayoutEffect(() => {
		const keys = Object.keys(filteredAutomationGoals);
		setCollapsedGroups((prev) => {
			const hasExisting = keys.some((k) =>
				Object.prototype.hasOwnProperty.call(prev, k)
			);
			if (hasExisting || keys.length === 0) {
				return prev;
			}
			return keys.reduce<Record<string, boolean>>((acc, key, index) => {
				acc[key] = index >= 2;
				return acc;
			}, {});
		});
	}, [goalCategoryIds]);

	const toggleGroup = (key: string) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handleSelect = async (goalKey: string, goal: any) => {
		// Pro-locked goals are inert — the Select button is disabled below.
		if (goal.is_pro && !isProActive) {
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

	return (
		<>

				<div className="flex flex-col gap-5">
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

							const isCollapsed = !!collapsedGroups[categoryKey];

							return (
								<Card
									key={categoryKey}
									className="doublescale-goal-selector-card overflow-hidden rounded-lg border border-border bg-[#F7F8FA] shadow-none dark:border-border/60 dark:bg-card"
								>
									<CardHeader
										className={cn(
											'p-4',
											!isCollapsed &&
												'border-b border-border dark:border-border/50'
										)}
									>
										<CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
											<GoalCategoryHeaderIcon
												sourceKey={categoryKey}
											/>
											<span className="min-w-0 flex-1 truncate text-foreground">
												{goalCategory.label}
											</span>
											<Button
												variant="ghost"
												size="sm"
												type="button"
												onClick={() =>
													toggleGroup(categoryKey)
												}
												className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
												aria-expanded={!isCollapsed}
												aria-label={
													isCollapsed
														? __(
																'Expand section',
																'doublescale'
															)
														: __(
																'Collapse section',
																'doublescale'
															)
												}
											>
												{isCollapsed ? (
													<ChevronRight className="h-5 w-5" />
												) : (
													<ChevronDown className="h-5 w-5" />
												)}
											</Button>
										</CardTitle>
									</CardHeader>
									{!isCollapsed && (
										<CardContent className="p-0">
											<div className="flex flex-col divide-y divide-border dark:divide-border/50">
												{allGoalsInCategory.map(
													({
														goal,
														goalKey,
														group,
													}) => {
														const goalButton = (
															<div
																key={goalKey}
																className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40"
															>
																<div className="min-w-0 flex items-center gap-2">
																	<span className="truncate text-sm leading-6 text-foreground">
																		{
																			goal.label
																		}
																	</span>
																	{goal.is_pro &&
																		!isProActive && (
																			<Lock className="h-4 w-4 shrink-0 text-orange-500" />
																		)}
																</div>
																<Button
																	type="button"
																	variant={
																		value ===
																		goalKey
																			? 'outline'
																			: 'secondaryDeepBlue'
																	}
																	size="sm"
																	onClick={() =>
																		handleSelect(
																			goalKey,
																			goal
																		)
																	}
											disabled={
												(goal.is_pro &&
													!isProActive) ||
												(!goal.is_pro &&
													(group.is_disabled ||
														isSaving))
											}
																	className={cn(
																		'h-9  shrink-0 rounded-md px-4 py-1 ',
																		value !==
																			goalKey &&
																			'hover:bg-brandPrimary/5',
																		'disabled:border-border disabled:text-muted-foreground'
																	)}
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

		</>
	);
};

export default GoalSelector;
