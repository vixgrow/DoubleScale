/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { useState } from '@wordpress/element';
import { map } from 'lodash';

/**
 * External dependencies
 */
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	automationDialogBodyClassName,
	automationDialogHeaderClassName,
	automationDialogSurfaceMedium,
} from '../automation-dialog-presets';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	ActionAutomationIcon,
	ConditionAutomationIcon,
	CustomDialogHeader,
	GoalsAutomationIcon,
	PlusIcon,
	TimerBlockIcon,
	WorkflowIcon,
} from '@doublescale/components';
import { ProAutomationModal } from '@doublescale/components/pro-automation-modal';
import EndAutomationIcon from '@doublescale/shared/icons/end-automation';

interface StepTypeOption {
	label: string;
	description: string;
	icon: React.ReactNode;
	topBorder: string;
	iconWrap: string;
}

interface AddStepDialogProps {
	visible: boolean;
	onVisibleChange: (visible: boolean) => void;
	loading: boolean;
	onStepSelection: (type: string) => void;
	disabled?: boolean;
}

const defaultTypesOptions: Record<string, StepTypeOption> = {
	action: {
		label: __('Action', 'doublescale'),
		description: __(
			'Select one of the Actions to continue your workflow.',
			'doublescale'
		),
		icon: <ActionAutomationIcon />,
		topBorder: 'border-t-[3px] border-t-[#16A34A]',
		iconWrap: 'bg-[#16A34A]/10 text-[#16A34A]',
	},
	condition: {
		label: __('Condition', 'doublescale'),
		description: __(
			'Select one of the Conditions to continue your workflow.',
			'doublescale'
		),
		icon: <ConditionAutomationIcon />,
		topBorder: 'border-t-[3px] border-t-[#0D9DFC]',
		iconWrap: 'bg-[#0D9DFC]/10 text-[#0D9DFC]',
	},
	delay: {
		label: __('Delay', 'doublescale'),
		description: __(
			'A pause or waiting period introduced into a sequence of automated actions.',
			'doublescale'
		),
		icon: <TimerBlockIcon />,
		topBorder: 'border-t-[3px] border-[#896900]',
		iconWrap: 'bg-[#896900]/10 text-[#896900]',
	},
	goal: {
		label: __('Goal', 'doublescale'),
		description: __(
			'Select one of the Goals to continue your workflow.',
			'doublescale'
		),
		icon: <GoalsAutomationIcon />,
		topBorder: 'border-t-[3px] border-t-[#262666]',
		iconWrap: 'bg-[#262666]/10 text-[#262666]',
	},
	end_automation: {
		label: __('End Automation', 'doublescale'),
		description: __(
			'A pause or waiting period introduced into a sequence of automated actions.',
			'doublescale'
		),
		icon: <EndAutomationIcon />,
		topBorder: 'border-t-[3px] border-t-[#C30A0A]',
		iconWrap: 'bg-[#C30A0A]/10 text-[#C30A0A]',
	},
};

export const AddStepDialog: React.FC<AddStepDialogProps> = ({
	visible,
	onVisibleChange,
	loading,
	onStepSelection,
	disabled = false,
}) => {
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const [showProModal, setShowProModal] = useState(false);

	return (
		<>
			<Dialog open={visible} onOpenChange={onVisibleChange}>
				<DialogTrigger asChild>
					<div
						className={`doublescale-automation-workflow__add-step  mx-auto flex items-center justify-center ${!disabled ? 'pointer-events-auto' : ''}`}
						onClick={(e) => {
							if (disabled) return;
							e.stopPropagation();
							onVisibleChange(!visible);
						}}
					>
						<Button
							variant="secondary"
							size="icon"
							className="h-8 w-8 rounded-full bg-white"
							title={__('Add step here', 'doublescale')}
						>
							<PlusIcon />
						</Button>
					</div>
				</DialogTrigger>

				<DialogContent
					className={cn(automationDialogSurfaceMedium, 'gap-0 p-0')}
				>
					{/* Sticky header */}
					<DialogHeader
						className={cn(
							automationDialogHeaderClassName,
							'shrink-0'
						)}
					>
						<CustomDialogHeader
							title={__('Add Step', 'doublescale')}
							subtitle={__(
								'Pick the next block in your automation. Each type controls how contacts move forward.',
								'doublescale'
							)}
							icon={<WorkflowIcon />}
						/>
						<DialogTitle className="sr-only">
							{__('Add Step', 'doublescale')}
						</DialogTitle>
						<DialogDescription className="sr-only">
							{__(
								'Pick the next block in your automation.',
								'doublescale'
							)}
						</DialogDescription>
					</DialogHeader>

					{/* Scrollable body — 24 px gap */}
					<div className={cn(automationDialogBodyClassName)}>
						<div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
							{map(defaultTypesOptions, (type, key) => {
								const isConditionLocked =
									key === 'condition' && !isProActive;
								const isEnd = key === 'end_automation';

								return (
									<div
										key={key}
										className={cn(
											'flex',
											isEnd &&
											'col-span-full justify-center'
										)}
									>
										<Card
											className={cn(
												'group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border-0 bg-white p-0 transition-shadow duration-150',
												'shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] hover:shadow-[0_6px_24px_0_rgba(59,130,246,0.22)]',
												type.topBorder,
												isEnd &&
												'max-w-full sm:max-w-[calc(50%-0.75rem)]',
												loading &&
												'pointer-events-none opacity-50'
											)}
										>
											<div className="flex flex-1 items-start gap-4 px-4 py-4 sm:px-5 sm:py-5">
												{/* Icon */}
												<div
													className={cn(
														'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
														type.iconWrap
													)}
												>
													{type.icon}
												</div>

												{/* Text */}
												<div className="min-w-0 flex-1">
													<h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
														{type.label}
														{isConditionLocked && (
															<Lock className="h-4 w-4 shrink-0 text-amber-500" />
														)}
													</h3>
													<p className="mt-0.5 text-sm leading-snug text-muted-foreground">
														{type.description}
													</p>
												</div>

												{/* Select button */}
												<Button
													variant="secondaryDeepBlue"
													size="sm"
													className="mt-0.5 shrink-0 self-start shadow-none"
													disabled={loading}
													onClick={(e) => {
														e.stopPropagation();
														if (isConditionLocked) {
															setShowProModal(true);
															return;
														}
														onStepSelection(key);
													}}
												>
													{__('Select', 'doublescale')}
												</Button>
											</div>
										</Card>
									</div>
								);
							})}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<ProAutomationModal
				visible={showProModal}
				onClose={() => setShowProModal(false)}
				featureName={__('Condition Step', 'doublescale')}
			/>
		</>
	);
};
