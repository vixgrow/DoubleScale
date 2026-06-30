import React, { useMemo } from 'react';
import type { Automation } from '@doublescale/client';
import './style.scss';
import { __ } from '@wordpress/i18n';
import ReactFlowWorkflow from '../../automation/steps/workflow/reactflow-workflow';
import { Provider, useAutomationContext } from '../../automation/state/context';

interface AutomationFunnelProps {
	automation: Automation | null;
	analyticsData?: any[];
	loading?: boolean;
}

const AutomationFunnel: React.FC<AutomationFunnelProps> = ({
	automation,
	analyticsData = [],
	loading = false,
}) => {
	const context = useAutomationContext();

	// Create a new context value that includes viewMode and analyticsData
	const contextValue = useMemo(
		() => ({
			...context,
			viewMode: true,
			analyticsData,
		}),
		[context, analyticsData]
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-lg">
					{__('Loading analytics...', 'doublescale')}
				</div>
			</div>
		);
	}

	if (!automation) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-lg text-[#667085]">
					{__('No automation data available.', 'doublescale')}
				</div>
			</div>
		);
	}

	return (
		<Provider value={contextValue}>
			<div className="h-full min-h-0 overflow-hidden flex flex-col">
				<ReactFlowWorkflow
					key={analyticsData
						.map(
							(item) =>
								`${item.step_id}:${item.contacts}:${item.conversion_rate}`
						)
						.join('|') || 'empty'}
					currentStep={null}
					isTriggerVisible={false}
					isSidebarOpen={false}
					onStepClick={() => { }}
					onTriggerClick={() => { }}
					viewMode={true}
					analyticsData={analyticsData}
				/>
			</div>
		</Provider>
	);
};

export default AutomationFunnel;
