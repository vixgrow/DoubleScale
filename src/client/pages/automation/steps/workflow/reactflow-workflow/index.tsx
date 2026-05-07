/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { OrganizedStep } from '@doublescale/client';
import WorkflowVisualization from './workflow-visualization';

interface ReactFlowWorkflowProps {
	currentStep?: OrganizedStep | null;
	isTriggerVisible?: boolean;
	isSidebarOpen?: boolean;
	viewMode?: boolean;
	analyticsData?: any[];
	onStepClick?: (step: OrganizedStep) => void;
	onTriggerClick?: () => void;
}

const ReactFlowWorkflow: React.FC<ReactFlowWorkflowProps> = ({
	currentStep,
	isTriggerVisible,
	isSidebarOpen,
	viewMode = false,
	analyticsData = [],
	onStepClick,
	onTriggerClick,
}) => {
	const { automation, steps, isLoading } = useAutomationContext();

	// Handle step clicks - delegate to parent component
	const handleStepClick = useCallback(
		(step: OrganizedStep) => {
			if (onStepClick) {
				onStepClick(step);
			}
		},
		[onStepClick]
	);

	// Handle trigger clicks - delegate to parent component
	const handleTriggerClick = useCallback(() => {
		if (onTriggerClick) {
			onTriggerClick();
		}
	}, [onTriggerClick]);

	return (
		<div className="qcrm-reactflow-container">
			<ReactFlowProvider>
				<WorkflowVisualization
					automation={automation || undefined}
					steps={steps}
					isLoading={isLoading}
					currentStep={currentStep}
					isTriggerVisible={isTriggerVisible}
					isSidebarOpen={isSidebarOpen}
					viewMode={viewMode}
					analyticsData={analyticsData}
					onStepClick={handleStepClick}
					onTriggerClick={handleTriggerClick}
				/>
			</ReactFlowProvider>
		</div>
	);
};

export default ReactFlowWorkflow;
