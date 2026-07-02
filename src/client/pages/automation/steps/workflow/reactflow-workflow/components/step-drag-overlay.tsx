/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { GripVertical } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@doublescale/client';

const getStepTypeLabel = (step: AutomationStep): string => {
	switch (step.type) {
		case 'action':
			return __('Action', 'doublescale');
		case 'condition':
			return __('Condition', 'doublescale');
		case 'delay':
			return __('Delay', 'doublescale');
		case 'goal':
			return __('Goal', 'doublescale');
		case 'end_automation':
			return __('Exit', 'doublescale');
		default:
			return __('Step', 'doublescale');
	}
};

interface StepDragOverlayProps {
	step: AutomationStep;
}

const StepDragOverlay: React.FC<StepDragOverlayProps> = ({ step }) => {
	return (
		<div className="doublescale-step-drag-overlay">
			<div className="doublescale-step-drag-overlay__grip">
				<GripVertical className="h-4 w-4" />
			</div>
			<div className="doublescale-step-drag-overlay__content">
				<span className="doublescale-step-drag-overlay__type">
					{getStepTypeLabel(step)}
				</span>
				<span className="doublescale-step-drag-overlay__hint">
					{__('Drop on a step to reorder', 'doublescale')}
				</span>
			</div>
		</div>
	);
};

export default StepDragOverlay;
