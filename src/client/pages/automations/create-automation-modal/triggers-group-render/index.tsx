/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useEffect, useMemo, useState } from 'react';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import {
	AccordingRightIcon,
	BookingIcon,
	CartIcon,
	ContactsIcon,
	CoursesIcon,
	CurrencyIcon,
	DealsIcon,
	FormsIcon,
	IntegrationsIcon,
	LinkTriggersIcon,
	OrdersIcon,
	PremiumIcon,
	VideoBlockIcon,
} from '@doublescale/components/icons/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import ProAutomationModal from '@doublescale/components/pro-automation-modal';
import type { TriggersGroup } from '@doublescale/config';
import type { IconProps } from '@doublescale/config';
import config from '@doublescale/config';
import { cn } from '@/lib/utils';

type GroupIconComponent = React.FC<IconProps>;

function getGroupIcon(label: string): GroupIconComponent {
	const l = label.toLowerCase();
	if (
		l.includes('contact') ||
		l.includes('subscriber') ||
		l.includes('list') ||
		l.includes('tag')
	) {
		return ContactsIcon;
	}
	if (l.includes('link')) {
		return LinkTriggersIcon;
	}
	if (l.includes('deal')) {
		return DealsIcon;
	}
	if (l.includes('woo') || l.includes('commerce') || l.includes('cart')) {
		return CartIcon;
	}
	if (l.includes('booking')) {
		return BookingIcon;
	}
	if (l.includes('form')) {
		return FormsIcon;
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
	if (l.includes('order') || l.includes('surecart')) {
		return OrdersIcon;
	}
	if (l.includes('presto')) {
		return VideoBlockIcon;
	}
	if (l.includes('paid')) {
		return CurrencyIcon;
	}
	return IntegrationsIcon;
}

interface TriggersGroupRenderProps {
	groups: TriggersGroup[];
	onChange: (value: string) => void;
	value: string;
}

const TriggersGroupRender: React.FC<TriggersGroupRenderProps> = ({
	groups,
	onChange,
	value: _value,
}) => {
	const [collapsedGroups, setCollapsedGroups] = useState<
		Record<string, boolean>
	>({});

	// `groups` may arrive as an object (PHP-encoded assoc array) — normalise to an array.
	const groupsList = useMemo<TriggersGroup[]>(
		() =>
			Array.isArray(groups)
				? groups
				: groups && typeof groups === 'object'
					? (Object.values(groups) as TriggersGroup[])
					: [],
		[groups]
	);

	const groupsSignature = useMemo(
		() => groupsList.map((g) => g?.label ?? '').join('|'),
		[groupsList]
	);

	useEffect(() => {
		const initial: Record<string, boolean> = {};
		groupsList.forEach((_, idx) => {
			if (idx !== 0) {
				initial[String(idx)] = true;
			}
		});
		setCollapsedGroups(initial);
		// We only want to reset when the category (signature) changes — the
		// groupsList reference itself may be stable inside one category.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupsSignature]);

	const [showProModal, setShowProModal] = useState(false);
	const [selectedProTrigger, setSelectedProTrigger] = useState<{
		name: string;
		key: string;
	} | null>(null);

	// Check if Pro plugin is active once
	const proPluginData = config.getProPluginData();
	const isProActive = proPluginData.is_active;

	// Helper function to get tooltip message for disabled triggers
	const getDisabledTooltip = (groupLabel: string) => {
		if (groupLabel === 'Booking') {
			return __(
				'Booking module is not enabled. Enable the Booking module to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'WooCommerce') {
			return __(
				'WooCommerce plugin is not installed or activated. Install WooCommerce to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'LearnDash') {
			return __(
				'LearnDash plugin is not installed or activated. Install LearnDash to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Tutor LMS') {
			return __(
				'Tutor LMS plugin is not installed or activated. Install Tutor LMS to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'LifterLMS') {
			return __(
				'LifterLMS plugin is not installed or activated. Install LifterLMS to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'LearnPress') {
			return __(
				'LearnPress plugin is not installed or activated. Install LearnPress to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'MemberPress') {
			return __(
				'MemberPress plugin is not installed or activated. Install MemberPress to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Paid Memberships Pro') {
			return __(
				'Paid Memberships Pro plugin is not installed or activated. Install Paid Memberships Pro to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Order' || groupLabel === 'SureCart') {
			return __(
				'SureCart plugin is not installed or activated. Install SureCart to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Presto Player') {
			return __(
				'Presto Player plugin is not installed or activated. Install Presto Player to use these triggers.',
				'doublescale'
			);
		}
		return __(
			'This integration is not available. Please install the required plugin.',
			'doublescale'
		);
	};

	const toggleGroup = (key: string | number) => {
		const k = String(key);
		setCollapsedGroups((prev) => ({
			...prev,
			[k]: !prev[k],
		}));
	};

	const handleTriggerClick = (triggerKey: string, trigger: any) => {
		// Check if this is a Pro feature AND Pro plugin is not active
		const isProFeatureLockedOut = trigger.is_pro && !isProActive;

		if (isProFeatureLockedOut) {
			setSelectedProTrigger({ name: trigger.label, key: triggerKey });
			setShowProModal(true);
		} else {
			onChange(triggerKey);
		}
	};

	const handleCloseProModal = () => {
		setShowProModal(false);
		setSelectedProTrigger(null);
	};

	return (
		<>
			<div className="flex flex-col gap-4">
				{map(groupsList, (group, key) => {
					const isCollapsed = !!collapsedGroups[String(key)];
					const GroupIcon = getGroupIcon(group.label);

					return (
					<Card
						key={key}
						className="shadow-none overflow-hidden rounded-[10px] border border-neutral-200 bg-white"
					>
						<CardHeader
							className={cn(
								'cursor-pointer select-none space-y-0 p-0 transition-colors hover:bg-neutral-50/80',
								!isCollapsed && 'border-b border-neutral-200'
							)}
						>
							<button
								type="button"
								className="flex w-full items-center gap-3 px-4 py-4 text-left"
								onClick={() => toggleGroup(key)}
							>
								<span
									className={cn(
										'flex  shrink-0 items-center justify-center text-sky-500',
										group.is_disabled &&
											'bg-neutral-100 text-neutral-400'
									)}
								>
									<GroupIcon
										width={24}
										height={24}
										color="currentColor"
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
									<AccordingRightIcon width={24} height={24} />
								</span>
							</button>
						</CardHeader>
						{!isCollapsed && (
							<CardContent className="p-0">
								<div className="flex flex-col divide-y divide-neutral-200">
									{map(
										group.triggers,
										(trigger, triggerKey) => {
											const triggerButton = (
												<div
													key={triggerKey}
													className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-neutral-50/60"
												>
													<div className="flex min-w-0 flex-1 items-center gap-2">
														<span className="text-sm leading-6 text-foreground">
															{trigger.label}
														</span>
														{trigger.is_pro &&
															!isProActive && (
																<span className="inline-flex shrink-0">
																	<PremiumIcon
																		width={16}
																		height={16}
																	/>
																</span>
															)}
													</div>
													<Button
														onClick={(e) => {
															e.stopPropagation();
															handleTriggerClick(
																triggerKey,
																trigger
															);
														}}
														variant="secondaryDeepBlue"
														size="sm"
														disabled={
															!trigger.is_pro &&
															group.is_disabled
														}
														className="h-8 shrink-0 rounded-md border px-4 text-xs font-semibold uppercase tracking-wide shadow-none"
													>
														{__(
															'Select',
															'doublescale'
														)}
													</Button>
												</div>
											);

											if (
												!trigger.is_pro &&
												group.is_disabled
											) {
												return (
													<TooltipProvider
														key={triggerKey}
													>
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																{triggerButton}
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

											return triggerButton;
										}
									)}
								</div>
							</CardContent>
						)}
					</Card>
					);
				})}
			</div>

			{/* PRO Modal */}
			{selectedProTrigger && (
				<ProAutomationModal
					visible={showProModal}
					onClose={handleCloseProModal}
					featureName={selectedProTrigger.name}
				/>
			)}
		</>
	);
};

export default TriggersGroupRender;
