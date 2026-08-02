/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useEffect, useMemo, useState } from 'react';
import { map } from 'lodash';
import { Star } from 'lucide-react';

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
	HelpdeskIcon,
	IntegrationsIcon,
	LinkTriggersIcon,
	OrdersIcon,
	PremiumIcon,
	SalesIcon,
	TaskDoneIcon,
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
import TriggerDocumentationCallout from '../../components/trigger-documentation-callout';
import type { TriggersGroup, Trigger } from '@doublescale/config';
import type { IconProps } from '@doublescale/config';
import config from '@doublescale/config';
import { isProActive as checkProActive } from '@doublescale/hooks/use-is-pro-active';
import { cn } from '@/lib/utils';

type GroupIconComponent = React.FC<IconProps>;

type FormProviderKey =
	| 'contact'
	| 'elementor'
	| 'fluentforms'
	| 'formidable'
	| 'forminator'
	| 'gravityforms'
	| 'metform'
	| 'ninjaforms'
	| 'quillforms'
	| 'wpforms'
	| 'wsforms'
	| 'bitform'
	| 'sureforms'
	| 'eform'
	| 'jetform'
	| 'typeform'
	| 'jotform';

const makeFormIconComponent = (src: string): GroupIconComponent => {
	return ({ width = 24, height = 24 }) => (
		<img
			src={src}
			alt="form provider"
			width={width}
			height={height}
			className="object-contain"
		/>
	);
};

const basePluginUrl = config.getPluginDirUrl().replace(/\/?$/, '/');

const formProviderIconSrcByKey: Record<FormProviderKey, string> = {
	contact: `${basePluginUrl}assets/images/form-types/contact.png`,
	elementor: `${basePluginUrl}assets/images/form-types/elementor.png`,
	fluentforms: `${basePluginUrl}assets/images/form-types/fluentforms.png`,
	formidable: `${basePluginUrl}assets/images/form-types/formidable.png`,
	forminator: `${basePluginUrl}assets/images/form-types/forminator.png`,
	gravityforms: `${basePluginUrl}assets/images/form-types/gravityforms.png`,
	metform: `${basePluginUrl}assets/images/form-types/metform.png`,
	ninjaforms: `${basePluginUrl}assets/images/form-types/ninjaforms.png`,
	quillforms: `${basePluginUrl}assets/images/form-types/quillforms.png`,
	wpforms: `${basePluginUrl}assets/images/form-types/wpforms.png`,
	wsforms: `${basePluginUrl}assets/images/form-types/wsforms.png`,
	bitform: `${basePluginUrl}assets/images/form-types/bitforms.png`,
	sureforms: `${basePluginUrl}assets/images/form-types/sureforms.png`,
	eform: `${basePluginUrl}assets/images/form-types/eform.png`,
	jetform: `${basePluginUrl}assets/images/form-types/jetform.svg`,
	// Free plugin ships these under assets/images/ (release packaging must include them).
	typeform: `${basePluginUrl}assets/images/typeform/typeform.svg`,
	jotform: `${basePluginUrl}assets/images/jotform/jotform.png`,
};

const getFormProviderKey = (label: string | undefined): FormProviderKey | null => {
	const l = (label ?? '').toLowerCase();

	if (l.includes('typeform')) return 'typeform';
	if (l.includes('jotform')) return 'jotform';

	// WordPress form plugins
	if (l.includes('elementor')) return 'elementor';
	if (l.includes('fluent')) return 'fluentforms';
	if (l.includes('formidable')) return 'formidable';
	if (l.includes('forminator')) return 'forminator';
	if (l.includes('gravity')) return 'gravityforms';
	if (l.includes('metform')) return 'metform';
	if (l.includes('ninja')) return 'ninjaforms';
	if (l.includes('quill')) return 'quillforms';
	if (l.includes('wpforms')) return 'wpforms';
	if (l.includes('wsforms') || l.includes('ws form')) return 'wsforms';
	if (l.includes('bitform') || l.includes('bit form')) return 'bitform';
	if (l.includes('sureforms')) return 'sureforms';
	if (l.includes('jetform')) return 'jetform';
	if (l.includes('eform')) return 'eform';

	// Contact Form 7 and similar wording
	if (l.includes('contact') && l.includes('form')) return 'contact';

	return null;
};

function getGroupIcon(label: string | undefined): GroupIconComponent {
	const l = (label ?? '').toLowerCase();

	const formProviderKey = getFormProviderKey(label);
	if (formProviderKey) {
		return makeFormIconComponent(
			formProviderIconSrcByKey[formProviderKey]
		);
	}

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
	if (l.includes('helpdesk') || l.includes('support') || l.includes('ticket')) {
		return HelpdeskIcon;
	}
	if (l.includes('task')) {
		return TaskDoneIcon;
	}
	if (
		l.includes('sales') ||
		l.includes('proposal') ||
		l.includes('invoice') ||
		l.includes('contract') ||
		l.includes('credit')
	) {
		return SalesIcon;
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
	value,
}) => {
	const [collapsedGroups, setCollapsedGroups] = useState<
		Record<string, boolean>
	>({});

	// `groups` may arrive as an object (PHP-encoded assoc array) — normalise to an array.
	// Groups with no triggers at all are dropped: a declared-but-unimplemented
	// source would otherwise render as a permanently empty card. Disabled
	// integrations keep their triggers, so they stay visible with a tooltip.
	const groupsList = useMemo<TriggersGroup[]>(() => {
		const normalised = Array.isArray(groups)
			? groups
			: groups && typeof groups === 'object'
				? (Object.values(groups) as TriggersGroup[])
				: [];

		return normalised.filter(
			(group) =>
				!!group &&
				typeof group.label === 'string' &&
				group.label.trim() !== '' &&
				Object.keys(group.triggers ?? {}).length > 0
		);
	}, [groups]);

	const groupsSignature = useMemo(
		() => groupsList.map((g) => g?.label ?? '').join('|'),
		[groupsList]
	);

	useEffect(() => {
		const initial: Record<string, boolean> = {};
		groupsList.forEach((group, idx) => {
			const hasSelectedTrigger =
				!!value &&
				group.triggers &&
				Object.prototype.hasOwnProperty.call(group.triggers, value);
			// Keep the group expanded when it contains the selected trigger.
			if (idx !== 0 && !hasSelectedTrigger) {
				initial[String(idx)] = true;
			}
		});
		setCollapsedGroups(initial);
		// We only want to reset when the category (signature) changes — the
		// groupsList reference itself may be stable inside one category.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupsSignature, value]);

	// Check if Pro plugin is active once
	const isProActive = checkProActive();

	// Helper function to get tooltip message for disabled triggers
	const getDisabledTooltip = (group: TriggersGroup) => {
		const groupLabel = group.label;
		if (group.disabled_reason === 'forms_module_off') {
			return __(
				'The Forms module is turned off. Enable it under Settings → Modules to use these triggers.',
				'doublescale'
			);
		}
		if (group.disabled_reason === 'typeform_not_connected') {
			return __(
				'Connect Typeform in Integrations with a personal access token to use this trigger.',
				'doublescale'
			);
		}
		if (groupLabel === 'Typeform') {
			return __(
				'Connect Typeform in Integrations with a personal access token to use this trigger.',
				'doublescale'
			);
		}
		if (group.disabled_reason === 'jotform_not_connected') {
			return __(
				'Connect Jotform in Integrations with an API key to use this trigger.',
				'doublescale'
			);
		}
		if (groupLabel === 'Jotform') {
			return __(
				'Connect Jotform in Integrations with an API key to use this trigger.',
				'doublescale'
			);
		}
		if (groupLabel === 'Deal') {
			return __(
				'The Pipelines & Deals module is turned off. Enable it under Settings → Modules to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Forms') {
			return __(
				'The Forms module is turned off. Enable it under Settings → Modules to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Booking') {
			return __(
				'The Booking module is turned off. Enable it under Settings → Modules to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Helpdesk') {
			return __(
				'The Helpdesk module is turned off. Enable it under Settings → Modules to use these triggers.',
				'doublescale'
			);
		}
		if (groupLabel === 'Task' || groupLabel === 'Subtask') {
			return __(
				'The Tasks module is turned off. Enable it under Settings → Modules to use these triggers.',
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
			'This integration is not available. Enable the required module under Settings → Modules, or install the required plugin.',
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
		// Pro-locked triggers are inert — the Select button is disabled below.
		if (trigger.is_pro && !isProActive) {
			return;
		}

		onChange(triggerKey);
	};

	const sortTriggers = (
		triggers: TriggersGroup['triggers'] | undefined
	): Array<[string, Trigger]> => {
		if (!triggers) {
			return [];
		}

		return Object.entries(triggers).sort(([, a], [, b]) => {
			if (a.is_featured && !b.is_featured) {
				return -1;
			}
			if (!a.is_featured && b.is_featured) {
				return 1;
			}
			return (a.label ?? '').localeCompare(b.label ?? '');
		});
	};

	const selectedTriggerDocumentation = useMemo(() => {
		if (!value) {
			return null;
		}

		for (const group of groupsList) {
			const trigger = group.triggers?.[value];
			if (trigger?.documentation) {
				return trigger.documentation;
			}
		}

		return null;
	}, [groupsList, value]);

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
														group
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
									{sortTriggers(group.triggers).map(
										([triggerKey, trigger]) => {
											const isSelected =
												value === triggerKey;
											const isFeatured =
												!!trigger.is_featured;
											const triggerButton = (
												<div
													key={triggerKey}
													className={cn(
														'flex items-center justify-between gap-4 px-4 py-3.5 transition-colors',
														isFeatured &&
															'border-l-4 border-l-amber-400 bg-amber-50/40',
														isSelected
															? isFeatured
																? 'bg-amber-50'
																: 'bg-brandPrimary/5'
															: !isFeatured &&
																	'hover:bg-neutral-50/60'
													)}
												>
													<div className="flex min-w-0 flex-1 items-center gap-3">
														{isFeatured && (
															<Star
																className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500"
																aria-hidden
															/>
														)}
														<span
															className={cn(
																'text-sm leading-6',
																isSelected
																	? 'font-medium text-brandPrimary'
																	: isFeatured
																		? 'font-medium text-amber-950'
																		: 'text-foreground'
															)}
														>
															{trigger.label}
														</span>
														{isFeatured && (
															<span className="inline-flex shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
																{__(
																	'Powerful',
																	'doublescale'
																)}
															</span>
														)}
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
														variant={
															isSelected
																? 'outline'
																: 'secondaryDeepBlue'
														}
														size="sm"
														disabled={
															(trigger.is_pro &&
																!isProActive) ||
															(!trigger.is_pro &&
																group.is_disabled)
														}
														className={cn(
															'h-8 shrink-0 rounded-md border px-4 text-xs font-semibold uppercase tracking-wide shadow-none',
															isSelected &&
																'border-brandPrimary text-brandPrimary'
														)}
													>
														{isSelected
															? __(
																	'Selected',
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
																	group
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
				{selectedTriggerDocumentation && (
					<TriggerDocumentationCallout
						documentation={selectedTriggerDocumentation}
					/>
				)}
			</div>
		</>
	);
};

export default TriggersGroupRender;
