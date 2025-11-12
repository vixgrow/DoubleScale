// import React, { useState, useEffect, useCallback } from 'react';
// import { __ } from '@wordpress/i18n';
// import apiFetch from '@wordpress/api-fetch';
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from '@/components/ui/select';
// import { DateRangePopup } from '@/client/pages/analytics-and-reports/components/DateRangePopup';

// interface PipelineFiltersProps {
// 	selectedPipeline: number | null;
// 	onPipelineChange: (pipelineId: number) => void;
// 	selectedOwner: number | null;
// 	onOwnerChange: (ownerId: number | null) => void;
// 	dateRange: { from: Date | null; to: Date | null };
// 	onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
// }

// interface Pipeline {
// 	id: number;
// 	name: string;
// }

// interface Owner {
// 	id: number;
// 	name: string;
// }

// const PipelineFilters: React.FC<PipelineFiltersProps> = ({
// 	selectedPipeline,
// 	onPipelineChange,
// 	selectedOwner,
// 	onOwnerChange,
// 	dateRange,
// 	onDateRangeChange,
// }) => {
// 	const [availablePipelines, setAvailablePipelines] = useState<Pipeline[]>([]);
// 	const [availableOwners, setAvailableOwners] = useState<Owner[]>([]);

// 	// Fetch pipelines
// 	const fetchPipelines = useCallback(async () => {
// 		try {
// 			const response = (await apiFetch({
// 				path: '/qc/v1/pipelines',
// 			})) as Pipeline[];

// 			setAvailablePipelines(response);
// 		} catch (error: any) {
// 			console.error('Failed to fetch pipelines:', error);
// 		}
// 	}, []);

// 	// Fetch owners
// 	const fetchOwners = useCallback(async () => {
// 		try {
// 			const response = (await apiFetch({
// 				path: '/qc/v1/users',
// 			})) as any[];

// 			const formattedOwners = response.map((user) => ({
// 				id: user.id || user.ID,
// 				name: user.display_name || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
// 			}));

// 			setAvailableOwners(formattedOwners);
// 		} catch (error: any) {
// 			console.error('Failed to fetch owners:', error);
// 		}
// 	}, []);

// 	useEffect(() => {
// 		fetchPipelines();
// 		fetchOwners();
// 	}, [fetchPipelines, fetchOwners]);

// 	return (
// 		<div className="flex items-end gap-3">
// 			{/* Date Range Filter */}
// 			<div className="flex flex-col gap-1">
// 				<label className="text-sm font-medium text-[#09090B]">
// 					{__('Date Range', 'quillcrm')}
// 				</label>
// 				<DateRangePopup 
// 					value={dateRange} 
// 					onChange={onDateRangeChange} 
// 					className="w-[200px] h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px]"
// 				/>
// 			</div>

// 			{/* Pipeline Filter */}
// 			<div className="flex flex-col gap-1">
// 				<label className="text-sm font-medium text-[#09090B]">
// 					{__('Pipeline Name', 'quillcrm')}
// 				</label>
// 				<Select 
// 					value={selectedPipeline?.toString()} 
// 					onValueChange={(value) => onPipelineChange(Number(value))}
// 				>
// 					<SelectTrigger className="w-[180px] h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4">
// 						<SelectValue placeholder={__('Select Pipeline', 'quillcrm')} />
// 					</SelectTrigger>
// 					<SelectContent>
// 						{availablePipelines.map((pipeline) => (
// 							<SelectItem key={pipeline.id} value={pipeline.id.toString()}>
// 								{pipeline.name}
// 							</SelectItem>
// 						))}
// 					</SelectContent>
// 				</Select>
// 			</div>

// 			{/* Owner Filter */}
// 			<div className="flex flex-col gap-1">
// 				<label className="text-sm font-medium text-[#09090B]">
// 					{__('Deal Owner', 'quillcrm')}
// 				</label>
// 				<Select 
// 					value={selectedOwner?.toString() ?? 'all'} 
// 					onValueChange={(value) => onOwnerChange(value === 'all' ? null : Number(value))}
// 				>
// 					<SelectTrigger className="w-[180px] h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4">
// 						<SelectValue placeholder={__('All Owners', 'quillcrm')} />
// 					</SelectTrigger>
// 					<SelectContent>
// 						<SelectItem value="all">
// 							{__('All Owners', 'quillcrm')}
// 						</SelectItem>
// 						{availableOwners.map((owner) => (
// 							<SelectItem key={owner.id} value={owner.id.toString()}>
// 								{owner.name}
// 							</SelectItem>
// 						))}
// 					</SelectContent>
// 				</Select>
// 			</div>
// 		</div>
// 	);
// };

// export default PipelineFilters;

import React from 'react';
import { __ } from '@wordpress/i18n';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DateRangePopup } from '@/client/pages/analytics-and-reports/components/DateRangePopup';

interface PipelineFiltersProps {
	selectedPipeline: number | null;
	onPipelineChange: (pipelineId: number) => void;
	selectedOwner: number | null;
	onOwnerChange: (ownerId: number | null) => void;
	dateRange: { from: Date | null; to: Date | null };
	onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
	availablePipelines: Array<{ id: number; name: string }>;
	availableOwners: Array<{ id: number; name: string }>;
}

const PipelineFilters: React.FC<PipelineFiltersProps> = ({
	selectedPipeline,
	onPipelineChange,
	selectedOwner,
	onOwnerChange,
	dateRange,
	onDateRangeChange,
	availablePipelines,
	availableOwners,
}) => {
	return (
		<div className="flex items-end gap-3">
			{/* Date Range Filter */}
			<div className="flex flex-col gap-1">
				<DateRangePopup 
					value={dateRange} 
					onChange={onDateRangeChange} 
					className="w-[200px] "
				/>
			</div>

			{/* Pipeline Filter */}
			<div className="flex flex-col gap-1">
				<Select 
					value={selectedPipeline?.toString()} 
					onValueChange={(value) => onPipelineChange(Number(value))}
				>
					<SelectTrigger className="w-[180px] h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4 text-[#09090B] text-base font-medium">
						<SelectValue placeholder={__('Select Pipeline', 'quillcrm')} />
					</SelectTrigger>
					<SelectContent>
						{availablePipelines.map((pipeline) => (
							<SelectItem key={pipeline.id} value={pipeline.id.toString()}>
								{pipeline.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Owner Filter */}
			<div className="flex flex-col gap-1">
				<Select 
					value={selectedOwner?.toString() ?? 'all'} 
					onValueChange={(value) => onOwnerChange(value === 'all' ? null : Number(value))}
				>
					<SelectTrigger className="w-[180px] h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4 text-[#09090B] text-base font-medium">
						<SelectValue placeholder={__('All Owners', 'quillcrm')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{__('All Owners', 'quillcrm')}
						</SelectItem>
						{availableOwners.map((owner) => (
							<SelectItem key={owner.id} value={owner.id.toString()}>
								{owner.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};

export default PipelineFilters;