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
	automationDialogAccentBarClassName,
	automationDialogBodyClassName,
	automationDialogHeaderClassName,
	automationDialogSurfaceMedium,
} from '../automation-dialog-presets';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	ActionIcon,
	ConditionsIcon,
	EndLinkIcon,
	GoalIcon,
	GradientArrowIcon,
	PlusIcon,
	TimerBlockIcon,
} from '@doublescale/components';
import { ProAutomationModal } from '@doublescale/components/pro-automation-modal';

interface StepTypeOption {
	label: string;
	description: string;
	icon: React.ReactNode;
}

interface AddStepDialogProps {
	/** Whether the dialog is visible */
	visible: boolean;
	/** Callback to change dialog visibility */
	onVisibleChange: (visible: boolean) => void;
	/** Whether a step creation is in progress */
	loading: boolean;
	/** Callback when a step type is selected */
	onStepSelection: (type: string) => void;
	/** Whether the dialog is disabled */
	disabled?: boolean;
}

const defaultTypesOptions: Record<string, StepTypeOption> = {
	action: {
		label: __('Action', 'doublescale'),
		description: __(
			'Select one of the Actions to continue your workflow.',
			'doublescale'
		),
		icon: <ActionIcon />,
	},
	condition: {
		label: __('Condition', 'doublescale'),
		description: __(
			'Select one of the Conditions to continue your workflow.',
			'doublescale'
		),
		icon: <ConditionsIcon />,
	},
	delay: {
		label: __('Delay', 'doublescale'),
		description: __(
			'A pause or waiting period introduced into a sequence of automated actions.',
			'doublescale'
		),
		icon: <TimerBlockIcon />,
	},
	goal: {
		label: __('Goal', 'doublescale'),
		description: __(
			'Select one of the Goals to continue your workflow.',
			'doublescale'
		),
		icon: <GoalIcon />,
	},
	end_automation: {
		label: __('End Automation', 'doublescale'),
		description: __('End your Automation workflow.', 'doublescale'),
		icon: <EndLinkIcon />,
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
						className={`doublescale-automation-workflow__add-step flex items-center justify-center ${!disabled ? 'pointer-events-auto' : ''}`}
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
				<DialogContent className={cn(automationDialogSurfaceMedium)}>
					<div
						className={automationDialogAccentBarClassName}
						aria-hidden
					/>
					<DialogHeader
						className={cn(automationDialogHeaderClassName, 'space-y-2')}
					>
						<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							{__('Workflow', 'doublescale')}
						</p>
						<DialogTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
							{__('Add Step', 'doublescale')}
						</DialogTitle>
						<DialogDescription className="text-base text-muted-foreground">
							{__(
								'Pick the next block in your automation. Each type controls how contacts move forward.',
								'doublescale'
							)}
						</DialogDescription>
					</DialogHeader>
					<div
						className={cn(
							automationDialogBodyClassName,
							'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'
						)}
					>
						{map(defaultTypesOptions, (type, key) => {
							const isConditionLocked =
								key === 'condition' && !isProActive;
							const isEnd = key === 'end_automation';
							return (
								<Card
									key={key}
									className={cn(
										'group cursor-pointer overflow-hidden border-border/60 bg-card/95 p-0 shadow-sm transition-all duration-200',
										'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md',
										loading && 'pointer-events-none opacity-50'
									)}
									onClick={(e) => {
										e.stopPropagation();
										if (isConditionLocked) {
											setShowProModal(true);
											return;
										}
										onStepSelection(key);
									}}
								>
									<div className="flex items-stretch">
										<div
											className={cn(
												'w-1 shrink-0 bg-gradient-to-b transition-opacity group-hover:opacity-100',
												isEnd
													? 'from-slate-500 to-slate-400 opacity-80'
													: 'from-indigo-600 to-sky-500 opacity-90'
											)}
											aria-hidden
										/>
										<div className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4 sm:p-5">
											<div className="flex min-w-0 items-center gap-3 sm:gap-4">
												<div
													className={cn(
														'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-white/20',
														isEnd
															? 'bg-gradient-to-br from-slate-600 to-slate-500'
															: 'bg-gradient-to-br from-indigo-700 to-sky-500'
													)}
												>
													{type.icon}
												</div>
												<div className="min-w-0">
													<h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
														{type.label}
														{isConditionLocked && (
															<Lock className="h-4 w-4 shrink-0 text-amber-500" />
														)}
													</h3>
													<p className="mt-0.5 text-sm leading-snug text-muted-foreground">
														{type.description}
													</p>
												</div>
											</div>
											<div className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary">
												<GradientArrowIcon />
											</div>
										</div>
									</div>
								</Card>
							);
						})}
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
