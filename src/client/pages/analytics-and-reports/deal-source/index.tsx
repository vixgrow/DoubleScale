import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import dayjs from 'dayjs';
import PipelineFilters from '../components/pipeline-rep-filter';
import { PageHeader } from '@quillcrm/components';
import NumberOfDealsChart from '../number-deal-rep';
import ClosedDealsValueChart from '../close-deal-rep';


interface PipelineAnalyticsProps {
	pipelineId?: number;
	ownerId?: number;
}

interface Owner {
	id: number;
	name: string;
}

const DealSourceAnalytics: React.FC<PipelineAnalyticsProps> = ({
	pipelineId,
	ownerId: initialOwnerId,
}) => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [availablePipelines, setAvailablePipelines] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [availableOwners, setAvailableOwners] = useState<Owner[]>([]);

	// Filter states
	const [selectedPipeline, setSelectedPipeline] = useState<number | null>(
		pipelineId ?? null
	);
	const [selectedOwner, setSelectedOwner] = useState<number | null>(
		initialOwnerId ?? null
	);
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({ from: null, to: null });

	const fetchPipelines = useCallback(async () => {
		try {
			const response = (await apiFetch({
				path: '/qc/v1/pipelines',
			})) as Array<{ id: number; name: string }>;

			setAvailablePipelines(response);

			if (!selectedPipeline && response.length > 0) {
				setSelectedPipeline(response[0].id);
			}
		} catch (error: any) {
			console.error('Failed to fetch pipelines:', error);
		}
	}, [selectedPipeline]);

	const fetchOwners = useCallback(async () => {
		try {
			const response = (await apiFetch({
				path: '/qc/v1/users',
			})) as any[];

			const formattedOwners = response.map((user) => ({
				id: user.id || user.ID,
				name:
					user.display_name ||
					user.name ||
					`${user.first_name || ''} ${user.last_name || ''}`.trim() ||
					'Unknown User',
			}));

			setAvailableOwners(formattedOwners);
		} catch (error: any) {
			console.error('Failed to fetch owners:', error);
		}
	}, []);

	useEffect(() => {
		fetchPipelines();
		fetchOwners();
	}, [fetchPipelines, fetchOwners]);

	if (error) {
		return (
			<div className="pipeline-analytics-container p-6">
				<div className="report-header mb-4">
					<h2 className="text-2xl font-semibold text-[#09090B]">
						{__('Deal Source Analytics', 'quillcrm')}
					</h2>
				</div>
				<div className="text-red-500 p-4 bg-red-50 rounded">
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className="deal-source-analytics-container w-full mx-auto">
			{/* Header with Filters */}
			<div className="report-header mb-6 px-6">
				<div className="flex justify-between items-center mb-4">
					<PageHeader
						title={__('Deal Source Analytics', 'quillcrm')}
						subtitle={__('Deal Source Analytics', 'quillcrm')}
						actions={[]}
					/>

					<PipelineFilters
						selectedPipeline={selectedPipeline}
						onPipelineChange={setSelectedPipeline}
						selectedOwner={selectedOwner}
						onOwnerChange={setSelectedOwner}
						dateRange={dateRange}
						onDateRangeChange={setDateRange}
						availablePipelines={availablePipelines}
						availableOwners={availableOwners}
					/>
				</div>
			</div>

			{/* Charts Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mx-5 mt-5">
				<NumberOfDealsChart
					selectedPipelineId={selectedPipeline}
					ownerId={selectedOwner ?? undefined}
					dateRange={dateRange}
				/>
				<ClosedDealsValueChart
					selectedPipelineId={selectedPipeline}
					ownerId={selectedOwner ?? undefined}
					dateRange={dateRange}
				/>
			</div>
		</div>
	);
};

export default DealSourceAnalytics;