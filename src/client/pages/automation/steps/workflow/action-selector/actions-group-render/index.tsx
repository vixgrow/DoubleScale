/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map, pickBy } from 'lodash';
import { Check, ChevronUp, ChevronDown, Lock } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { ActionsGroup } from '@doublescale/config';
import config from '@doublescale/config';
import { isProActive as checkProActive } from '@doublescale/hooks/use-is-pro-active';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
interface ActionsGroupRenderProps {
	groups: { [key: string]: ActionsGroup };
	onChange: (value: string) => void;
	value: string;
	isSaving?: boolean;
}

const ActionsGroupRender: React.FC<ActionsGroupRenderProps> = ({
	groups,
	onChange,
	value,
	isSaving = false,
}) => {
	const [collapsedGroups, setCollapsedGroups] = useState<
		Record<string, boolean>
	>({});

	// Check if Pro plugin is active once
	const isProActive = checkProActive();

	// Helper function to get tooltip message for disabled actions
	const getDisabledTooltip = (groupLabel: string) => {
		if (groupLabel === 'Deal') {
			return __(
				'The Pipelines & Deals module is turned off. Enable it under Settings → Modules to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'Booking') {
			return __(
				'The Booking module is turned off. Enable it under Settings → Modules to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'Ticket' || groupLabel === 'Helpdesk') {
			return __(
				'The Helpdesk module is turned off. Enable it under Settings → Modules to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'Task') {
			return __(
				'The Tasks module is turned off. Enable it under Settings → Modules to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'WooCommerce') {
			return __(
				'WooCommerce plugin is not installed or activated. Install WooCommerce to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'LearnDash') {
			return __(
				'LearnDash plugin is not installed or activated. Install LearnDash to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'Tutor LMS') {
			return __(
				'Tutor LMS plugin is not installed or activated. Install Tutor LMS to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'LifterLMS') {
			return __(
				'LifterLMS plugin is not installed or activated. Install LifterLMS to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'LearnPress') {
			return __(
				'LearnPress plugin is not installed or activated. Install LearnPress to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'MemberPress') {
			return __(
				'MemberPress plugin is not installed or activated. Install MemberPress to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'Paid Memberships Pro') {
			return __(
				'Paid Memberships Pro plugin is not installed or activated. Install Paid Memberships Pro to use these actions.',
				'doublescale'
			);
		}
		if (groupLabel === 'Presto Player') {
			return __(
				'Presto Player plugin is not installed or activated. Install Presto Player to use these actions.',
				'doublescale'
			);
		}
		return __(
			'This integration is not available. Enable the required module under Settings → Modules, or install the required plugin.',
			'doublescale'
		);
	};

	const toggleGroup = (key: string) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handleActionClick = (
		actionKey: string,
		action: any,
		groupDisabled: boolean
	) => {
		// Group-disabled and Pro-locked actions are inert — the Select
		// button is disabled below.
		if (groupDisabled || (action.is_pro && !isProActive)) {
			return;
		}

		onChange(actionKey);
	};

	// Hide unnamed placeholder groups, and groups that ship no actions at all —
	// a declared-but-unimplemented source would otherwise render as a permanently
	// empty card. Disabled integrations keep their actions, so they stay visible
	// with a tooltip explaining what to enable.
	const visibleGroups = pickBy(
		groups,
		(group) =>
			typeof group.label === 'string' &&
			group.label.trim() !== '' &&
			Object.keys(group.actions ?? {}).length > 0
	);

	return (
		<>
			<div className="flex flex-col gap-4">
				{map(visibleGroups, (group, key) => (
					<Card key={key} className="shadow-none">
						<CardHeader className="px-4 py-2 border-b-2">
							<CardTitle className="flex items-center justify-between font-bold text-base">
								<div className="flex items-center gap-2">
									{group.label}
									{group.is_disabled && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="text-sm text-muted-foreground">
														(
														{__(
															'Not Available',
															'doublescale'
														)}
														)
													</span>
												</TooltipTrigger>
												<TooltipContent>
													{getDisabledTooltip(
														group.label
													)}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleGroup(key)}
									className="h-8 w-8 p-0"
								>
									{collapsedGroups[key] ? (
										<ChevronDown className="h-6 w-6" />
									) : (
										<ChevronUp className="h-6 w-6" />
									)}
								</Button>
							</CardTitle>
						</CardHeader>
						{!collapsedGroups[key] && (
							<CardContent className="p-0">
								<div className="flex flex-col divide-y">
									{map(group.actions, (action, actionKey) => {
										const isSelected = value === actionKey;
										const actionButton = (
											<div
												key={actionKey}
												className={`flex items-center justify-between gap-4 border-l-4 px-4 py-2.5 transition-colors ${isSelected ? 'border-l-brandPrimary bg-brandPrimary/10' : 'border-l-transparent hover:bg-muted/50'}`}
											>
												<div className="flex items-center gap-2">
													{isSelected && (
														<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brandPrimary text-white">
															<Check
																className="h-3.5 w-3.5"
																strokeWidth={3}
																aria-hidden
															/>
														</span>
													)}
													<span
														className={`text-sm ${isSelected ? 'font-semibold text-brandPrimary' : ''}`}
													>
														{action.label}
													</span>
													{action.is_pro && !isProActive && (
														<Lock className="h-4 w-4 text-orange-500" />
													)}
												</div>
												<Button
													onClick={() =>
														handleActionClick(
															actionKey,
															action,
															!!group.is_disabled
														)
													}
													disabled={
														group.is_disabled ||
														isSaving ||
														(action.is_pro &&
															!isProActive)
													}
													variant={
														isSelected
															? 'default'
															: 'secondaryDeepBlue'
													}
													size="sm"
													className="h-8 shrink-0 rounded-md px-4 text-xs font-semibold uppercase tracking-wide shadow-none"
												>
													{isSaving && isSelected && (
														<span>
															{__(
																'Selecting...',
																'doublescale'
															)}
														</span>
													)}
													{!(isSaving && isSelected) && (
														<>
															{isSelected && (
																<Check
																	className="h-3.5 w-3.5"
																	strokeWidth={3}
																	aria-hidden
																/>
															)}
															{isSelected
																? __(
																		'Selected',
																		'doublescale'
																	)
																: __(
																		'Select',
																		'doublescale'
																	)}
														</>
													)}
												</Button>
											</div>
										);

										if (group.is_disabled) {
											return (
												<TooltipProvider
													key={actionKey}
												>
													<Tooltip>
														<TooltipTrigger asChild>
															{actionButton}
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

										return actionButton;
									})}
								</div>
							</CardContent>
						)}
					</Card>
				))}
			</div>
		</>
	);
};

export default ActionsGroupRender;
