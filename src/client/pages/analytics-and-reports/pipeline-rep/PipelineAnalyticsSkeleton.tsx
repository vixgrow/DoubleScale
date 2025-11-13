// src/components/analytics/PipelineAnalyticsSkeleton.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContentCard } from '@quillcrm/components';


export const PipelineAnalyticsSkeleton: React.FC = () => {
	return (
		<div className="pipeline-analytics-container w-full mx-auto animate-pulse">
			{/* Header with Filters */}
			<div className="report-header mb-6 px-6">
				<div className="flex justify-between items-center mb-4">
					{/* Page Header Skeleton */}
					<div className="flex-1">
						<Skeleton className="h-9 w-64 mb-2" />
						<Skeleton className="h-5 w-48" />
					</div>

					{/* Filters Skeleton */}
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-48" /> {/* Pipeline Select */}
						<Skeleton className="h-10 w-48" /> {/* Owner Select */}
						<Skeleton className="h-10 w-32" /> {/* Date Range */}
					</div>
				</div>
			</div>

			{/* Funnel Chart Card */}
			<DashboardContentCard
				title=""
				headerContent={<Skeleton className="h-6 w-6 rounded-full" />}
				cardClassName="!shadow-none"
			>
				<div className="p-6 space-y-6">
					{/* Chart Title */}
					<Skeleton className="h-7 w-64 mx-auto" />
                		<div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        

					{/* Labels Below */}
					<div className="flex justify-between px-8 mt-8">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="text-center flex-1">
								<Skeleton className="h-4 w-20 mx-auto mb-1" />
								<Skeleton className="h-3 w-16 mx-auto" />
							</div>
						))}
					</div>
				</div>
			</DashboardContentCard>

			{/* Bottom Charts */}
			<div className="grid grid-cols-2 gap-5 mx-5 mt-5">
				{/* Conversion Rates Chart */}
				<Card className="border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8]">
					<CardContent className="p-6">
						<Skeleton className="h-7 w-48 mb-4" />
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="flex items-center gap-3">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-8 flex-1 rounded-full bg-gray-200" />
									<Skeleton className="h-4 w-12" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Average Duration Chart */}
				<Card className="border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8]">
					<CardContent className="p-6">
						<Skeleton className="h-7 w-48 mb-4" />
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="flex items-center gap-3">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-8 flex-1 rounded-full bg-gray-200" />
									<Skeleton className="h-4 w-12" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};