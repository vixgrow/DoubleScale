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

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
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
						className={`qcrm-automation-workflow__add-step flex items-center justify-center ${!disabled ? 'pointer-events-auto' : ''}`}
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
				<DialogPortal>
					<DialogOverlay className="z-[150200]" />
					<DialogContent className="max-w-[800px] z-[150200] p-6">
						<DialogHeader>
							<DialogTitle>
								{__('Add Step', 'doublescale')}
							</DialogTitle>
							<DialogDescription className="mt-1">
								{__('Select one of the Steps', 'doublescale')}
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-5">
							{map(defaultTypesOptions, (type, key) => {
								const isConditionLocked =
									key === 'condition' && !isProActive;
								return (
									<Card
										key={key}
										className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
										onClick={(e) => {
											e.stopPropagation();
											if (isConditionLocked) {
												setShowProModal(true);
												return;
											}
											onStepSelection(key);
										}}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-4">
												<div className="flex-shrink-0 p-2 text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg">
													{type.icon}
												</div>
												<div className="">
													<h3 className="font-semibold text-xl text-[#3F4254] flex items-center gap-2">
														{type.label}
														{isConditionLocked && (
															<Lock className="h-4 w-4 text-orange-500" />
														)}
													</h3>
													<p className="text-sm text-[#333333] mt-1">
														{type.description}
													</p>
												</div>
											</div>
											<GradientArrowIcon />
										</div>
									</Card>
								);
							})}
						</div>
					</DialogContent>
				</DialogPortal>
			</Dialog>

			<ProAutomationModal
				visible={showProModal}
				onClose={() => setShowProModal(false)}
				featureName={__('Condition Step', 'doublescale')}
			/>
		</>
	);
};
