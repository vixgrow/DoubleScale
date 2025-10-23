/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { map } from 'lodash';

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
} from '@quillcrm/components';

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
}

const defaultTypesOptions: Record<string, StepTypeOption> = {
	action: {
		label: __('Action', 'quillcrm'),
		description: __(
			'Select one of the Actions to continue your workflow.',
			'quillcrm'
		),
		icon: <ActionIcon />,
	},
	condition: {
		label: __('Condition', 'quillcrm'),
		description: __(
			'Select one of the Conditions to continue your workflow.',
			'quillcrm'
		),
		icon: <ConditionsIcon />,
	},
	delay: {
		label: __('Delay', 'quillcrm'),
		description: __(
			'A pause or waiting period introduced into a sequence of automated actions.',
			'quillcrm'
		),
		icon: <TimerBlockIcon />,
	},
	goal: {
		label: __('Goal', 'quillcrm'),
		description: __(
			'Select one of the Goals to continue your workflow.',
			'quillcrm'
		),
		icon: <GoalIcon />,
	},
	end_automation: {
		label: __('End Automation', 'quillcrm'),
		description: __('End your Automation workflow.', 'quillcrm'),
		icon: <EndLinkIcon />,
	},
};

export const AddStepDialog: React.FC<AddStepDialogProps> = ({
	visible,
	onVisibleChange,
	loading,
	onStepSelection,
}) => {
	return (
		<Dialog open={visible} onOpenChange={onVisibleChange}>
			<DialogTrigger asChild>
				<div
					className="qcrm-automation-workflow__add-step flex items-center justify-center pointer-events-auto"
					onClick={(e) => {
						e.stopPropagation();
						onVisibleChange(!visible);
					}}
				>
					<Button
						variant="secondary"
						size="icon"
						className="h-8 w-8 rounded-full bg-white"
						title={__('Add step here', 'quillcrm')}
					>
						<PlusIcon />
					</Button>
				</div>
			</DialogTrigger>
			<DialogPortal>
				<DialogOverlay className="z-[150200]" />
				<DialogContent className="max-w-[800px] z-[150200] p-6">
					<DialogHeader>
						<DialogTitle>{__('Add Step', 'quillcrm')}</DialogTitle>
						<DialogDescription className="mt-1">
							{__('Select one of the Steps', 'quillcrm')}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-5">
						{map(defaultTypesOptions, (type, key) => (
							<Card
								key={key}
								className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
								onClick={(e) => {
									e.stopPropagation();
									onStepSelection(key);
								}}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="flex-shrink-0 p-2 text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg">
											{type.icon}
										</div>
										<div className="">
											<h3 className="font-semibold text-xl text-[#3F4254]">
												{type.label}
											</h3>
											<p className="text-sm text-[#333333] mt-1">
												{type.description}
											</p>
										</div>
									</div>
									<GradientArrowIcon />
								</div>
							</Card>
						))}
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
