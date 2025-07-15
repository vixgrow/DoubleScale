/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import '@xyflow/react/dist/style.css';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { OrganizedStep } from '@quillcrm/client';
import WorkflowVisualization from './WorkflowVisualization';

const ReactFlowWorkflow: React.FC = () => {
	const { automation, steps, isLoading } = useAutomationContext();
	const [currentStep, setCurrentStep] = useState<OrganizedStep | null>(null);

	// Handle step clicks - open the appropriate modal
	const handleStepClick = useCallback((step: OrganizedStep) => {
		setCurrentStep(step);
		// Trigger modal opening logic here
		// This should integrate with the existing modal system
	}, []);

	// Handle trigger clicks
	const handleTriggerClick = useCallback(() => {
		// Trigger modal opening logic here
		// This should integrate with the existing trigger modal system
	}, []);

	return (
		<div className="qcrm-reactflow-container">
			<WorkflowVisualization
				automation={automation || undefined}
				steps={steps}
				isLoading={isLoading}
				onStepClick={handleStepClick}
				onTriggerClick={handleTriggerClick}
			/>
		</div>
	);
};

export default ReactFlowWorkflow;
