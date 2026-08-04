/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	ActionAutomationIcon,
	ConditionAutomationIcon,
	GoalsAutomationIcon,
	PlusIcon,
	TimerBlockIcon,
} from '@doublescale/components';
import EndAutomationIcon from '@doublescale/shared/icons/end-automation';

interface StepTypeOption {
	label: string;
	description: string;
	icon: React.ReactNode;
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
		description: __('Do something in your workflow', 'doublescale'),
		icon: <ActionAutomationIcon />,
		iconWrap: 'bg-[#16A34A]/10 text-[#16A34A]',
	},
	condition: {
		label: __('Condition', 'doublescale'),
		description: __('Branch based on a condition', 'doublescale'),
		icon: <ConditionAutomationIcon />,
		iconWrap: 'bg-[#0D9DFC]/10 text-[#0D9DFC]',
	},
	delay: {
		label: __('Delay', 'doublescale'),
		description: __('Wait before continuing', 'doublescale'),
		icon: <TimerBlockIcon />,
		iconWrap: 'bg-[#896900]/10 text-[#896900]',
	},
	goal: {
		label: __('Goal', 'doublescale'),
		description: __('Wait until a chosen event happens', 'doublescale'),
		icon: <GoalsAutomationIcon />,
		iconWrap: 'bg-[#262666]/10 text-[#262666]',
	},
	end_automation: {
		label: __('End Automation', 'doublescale'),
		description: __('Stop the automation here', 'doublescale'),
		icon: <EndAutomationIcon />,
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

	return (
		<div
			className="doublescale-automation-workflow__add-step-wrapper"
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
			onMouseDown={(e) => e.stopPropagation()}
			onMouseUp={(e) => e.stopPropagation()}
		>
			<DropdownMenu open={visible} onOpenChange={onVisibleChange}>
				<DropdownMenuTrigger
					asChild
					onClick={(e) => e.stopPropagation()}
				>
					<button
						type="button"
						disabled={disabled}
						className={cn(
							'doublescale-automation-workflow__add-step nodrag nopan mx-auto flex items-center justify-center border-0 bg-transparent p-0 shadow-none outline-none disabled:pointer-events-none disabled:opacity-40',
							!disabled && 'cursor-pointer'
						)}
						title={__('Add step here', 'doublescale')}
					>
						<span className="doublescale-add-step-trigger">
							<PlusIcon width={14} height={14} />
						</span>
					</button>
				</DropdownMenuTrigger>

				{/* Renders inline (no portal) — a portalled menu here doesn't
				 * receive pointer events reliably inside the React Flow canvas
				 * (see node-actions-dropdown.tsx for the same fix). */}
				<DropdownMenuContent
					side="right"
					align="start"
					sideOffset={12}
					avoidCollisions={true}
					collisionPadding={16}
					removePortal={true}
					className="z-[150000] max-h-none w-80 rounded-2xl border-border/50 p-3 shadow-[0_22px_60px_-18px_rgba(15,23,42,0.28)]"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex flex-col divide-y divide-neutral-100">
						{map(defaultTypesOptions, (type, key) => {
							const isConditionLocked =
								key === 'condition' && !isProActive;
							const isDisabled = loading || isConditionLocked;

							return (
								<DropdownMenuItem
									key={key}
									disabled={isDisabled}
									onSelect={(e) => {
										if (isDisabled) {
											e.preventDefault();
											return;
										}
										onStepSelection(key);
									}}
									className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-3 pointer-events-auto transition-colors focus:bg-neutral-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
								>
									<span
										className={cn(
											'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
											type.iconWrap
										)}
									>
										{type.icon}
									</span>
									<span className="min-w-0 flex-1">
										<span className="flex items-center gap-2 text-base font-medium text-foreground">
											{type.label}
											{isConditionLocked && (
												<Lock className="h-4 w-4 shrink-0 text-amber-500" />
											)}
										</span>
										<span className="block truncate text-xs text-muted-foreground">
											{type.description}
										</span>
									</span>
								</DropdownMenuItem>
							);
						})}
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
