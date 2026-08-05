/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map, pickBy } from 'lodash';
import { Check, Lock } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { ActionsGroup } from '@doublescale/config';
import type { IconProps } from '@doublescale/config';
import { isProActive as checkProActive } from '@doublescale/hooks/use-is-pro-active';
import {
	AccordingRightIcon,
	BookingIcon,
	CartIcon,
	ContactSMSIcon,
	ContactsIcon,
	CoursesIcon,
	DealsIcon,
	HelpdeskIcon,
	IntegrationsIcon,
	OrdersIcon,
	ProjectsIcon,
	SalesIcon,
	SendEmailIcon,
	TaskDoneIcon,
	WebhooksIcon,
} from '@doublescale/components/icons/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type GroupIconComponent = React.FC<IconProps>;

function getGroupIcon(label: string | undefined): GroupIconComponent {
	const l = (label ?? '').toLowerCase();

	if (
		l.includes('contact') ||
		l.includes('subscriber') ||
		l.includes('list') ||
		l.includes('tag') ||
		l.includes('user') ||
		l.includes('delay')
	) {
		return ContactsIcon;
	}
	if (l.includes('deal')) {
		return DealsIcon;
	}
	if (
		l.includes('woo') ||
		l.includes('commerce') ||
		l.includes('cart') ||
		l.includes('coupon')
	) {
		return CartIcon;
	}
	if (l.includes('booking')) {
		return BookingIcon;
	}
	if (
		l.includes('helpdesk') ||
		l.includes('support') ||
		l.includes('ticket')
	) {
		return HelpdeskIcon;
	}
	if (
		l.includes('sms') ||
		l.includes('whatsapp') ||
		l.includes('messaging')
	) {
		return ContactSMSIcon;
	}
	if (l.includes('email') || l.includes('mail')) {
		return SendEmailIcon;
	}
	if (
		l.includes('webhook') ||
		l.includes('http') ||
		l.includes('zapier') ||
		l.includes('slack')
	) {
		return WebhooksIcon;
	}
	if (l.includes('project')) {
		return ProjectsIcon;
	}
	if (l.includes('task')) {
		return TaskDoneIcon;
	}
	if (l.includes('sales')) {
		return SalesIcon;
	}
	if (
		l.includes('learn') ||
		l.includes('tutor') ||
		l.includes('lifter') ||
		l.includes('member') ||
		l.includes('course')
	) {
		return CoursesIcon;
	}
	if (l.includes('order')) {
		return OrdersIcon;
	}
	return IntegrationsIcon;
}

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

	const isProActive = checkProActive();

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
		if (groupLabel === 'Project') {
			return __(
				'The Projects module is turned off. Enable it under Settings → Modules to use these actions.',
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
		if (groupDisabled || (action.is_pro && !isProActive)) {
			return;
		}

		onChange(actionKey);
	};

	const visibleGroups = pickBy(
		groups,
		(group) =>
			typeof group.label === 'string' &&
			group.label.trim() !== '' &&
			Object.keys(group.actions ?? {}).length > 0
	);

	return (
		<div className="flex flex-col gap-4">
			{map(visibleGroups, (group, key) => {
				const isCollapsed = !!collapsedGroups[String(key)];
				const GroupIcon = getGroupIcon(group.label);

				return (
					<Card
						key={key}
						className="overflow-hidden rounded-[10px] border border-border bg-[#F7F8FA] shadow-none"
					>
						<CardHeader
							className={cn(
								'cursor-pointer select-none space-y-0 p-0 transition-colors hover:bg-neutral-50/80',
								!isCollapsed && 'border-b border-border'
							)}
						>
							<button
								type="button"
								className="flex w-full items-center gap-3 px-4 py-4 text-left"
								onClick={() => toggleGroup(key)}
							>
								<span
									className={cn(
										'flex shrink-0 items-center justify-center',
										group.is_disabled && 'text-neutral-400'
									)}
								>
									<GroupIcon
										width={24}
										height={24}
										color={
											group.is_disabled
												? 'currentColor'
												: '#0D9DFC'
										}
									/>
								</span>
								<CardTitle className="flex flex-1 flex-wrap items-center gap-2 text-base font-bold text-neutral-800">
									<span>{group.label}</span>
									{group.is_disabled && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="text-sm font-normal text-muted-foreground">
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
								</CardTitle>
								<span
									className={cn(
										'shrink-0 transition-transform duration-200',
										!isCollapsed && 'rotate-90'
									)}
								>
									<AccordingRightIcon
										width={24}
										height={24}
									/>
								</span>
							</button>
						</CardHeader>
						{!isCollapsed && (
							<CardContent className="p-0">
								<div className="flex flex-col divide-y divide-neutral-200">
									{map(group.actions, (action, actionKey) => {
										const isSelected = value === actionKey;
										const actionButton = (
											<div
												key={actionKey}
												className={cn(
													'flex items-center justify-between gap-4 border-l-4 border-l-transparent px-4 py-3.5 transition-colors',
													isSelected
														? 'border-l-brandPrimary bg-brandPrimary/10'
														: 'hover:bg-neutral-50/60'
												)}
											>
												<div className="flex min-w-0 flex-1 items-center gap-3">
													{isSelected ? (
														<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brandPrimary text-white">
															<Check
																className="h-3.5 w-3.5"
																strokeWidth={3}
																aria-hidden
															/>
														</span>
													) : null}
													<span
														className={cn(
															'text-sm',
															isSelected &&
																'font-semibold text-brandPrimary'
														)}
													>
														{action.label}
													</span>
													{action.is_pro &&
														!isProActive && (
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
													{isSaving && isSelected ? (
														<span>
															{__(
																'Selecting...',
																'doublescale'
															)}
														</span>
													) : (
														<>
															{isSelected && (
																<Check
																	className="h-3.5 w-3.5"
																	strokeWidth={
																		3
																	}
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
				);
			})}
		</div>
	);
};

export default ActionsGroupRender;
