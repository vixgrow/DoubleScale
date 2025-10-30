import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Automation } from '@quillcrm/client';
import apiFetch from '@wordpress/api-fetch';
import './style.scss';
import { __ } from '@wordpress/i18n';
import ReactFlowWorkflow from '../../automation/steps/workflow/reactflow-workflow';
import { Provider, useAutomationContext } from '../../automation/state/context';

interface AutomationFunnelProps {
	automation: Automation | null;
}

interface FunnelDataItem {
	label: string;
	value: number;
	percentage: number;
	step_id: number | null;
	step_type: string;
}

interface FunnelResponse {
	funnel_data: FunnelDataItem[];
	total_contacts: number;
	completion_rate: number;
	automation: {
		id: number;
		name: string;
	};
}

const AutomationFunnel: React.FC<AutomationFunnelProps> = ({ automation }) => {
	const [analyticsData, setAnalyticsData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const context = useAutomationContext();

	const fetchAnalyticsData = useCallback(async () => {
		if (!automation?.id) {
			setAnalyticsData([]);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const response = (await apiFetch({
				path: `/qc/v1/automation-reports/${automation.id}/get-chart-report`,
			})) as FunnelResponse;

			if (response.funnel_data) {
				// Transform funnel data to analytics format
				const analytics = response.funnel_data.map((item) => ({
					step_id: item.step_id,
					contacts: item.value || 0,
					conversion_rate: item.percentage || 0,
					step_type: item.step_type,
				}));
				setAnalyticsData(analytics);
			}
			setLoading(false);
		} catch (error: any) {
			console.error('Failed to fetch analytics data:', error);
			setAnalyticsData([]);
			setLoading(false);
		}
	}, [automation?.id]);

	useEffect(() => {
		fetchAnalyticsData();
	}, [fetchAnalyticsData]);

	// Create a new context value that includes viewMode and analyticsData
	const contextValue = useMemo(() => ({
		...context,
		viewMode: true,
		analyticsData,
	}), [context, analyticsData]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-lg">{__('Loading analytics...', 'quillcrm')}</div>
			</div>
		);
	}

	return (
		<Provider value={contextValue}>
			<div className="h-screen overflow-auto">
				<ReactFlowWorkflow
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
