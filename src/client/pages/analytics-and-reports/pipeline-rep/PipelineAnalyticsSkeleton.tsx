import React from 'react';

// Skeleton Component
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Funnel Chart Skeleton
const FunnelChartSkeleton = () => (
  <div className="bg-white rounded-lg p-6 mb-6">
   <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        {/* Chart Skeleton - Vertical Bars */}
        <div className="flex items-end justify-around gap-4" style={{ height: '400px', paddingBottom: '40px' }}>
          {/* Bar 1 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full rounded-t-md" style={{ height: '180px' }}>
              <Skeleton className="w-full rounded-t-md h-full" />
            </div>
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 2 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full rounded-t-md" style={{ height: '240px' }}>
              <Skeleton className="w-full rounded-t-md h-full" />
            </div>
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 3 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full rounded-t-md" style={{ height: '120px' }}>
              <Skeleton className="w-full rounded-t-md h-full" />
            </div>
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 4 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full rounded-t-md" style={{ height: '200px' }}>
              <Skeleton className="w-full rounded-t-md h-full" />
            </div>
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 5 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full rounded-t-md" style={{ height: '300px' }}>
              <Skeleton className="w-full rounded-t-md h-full" />
            </div>
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 6 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full rounded-t-md" style={{ height: '160px' }}>
              <Skeleton className="w-full rounded-t-md h-full" />
            </div>
            <Skeleton className="h-10 w-2" />
          </div>
        </div>
  </div>
);

// Conversion Rate Chart Skeleton
const ConversionRateChartSkeleton = () => (
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="h-6 w-6 rounded" />
    </div>
    
    <div className="space-y-4 h-[400px]">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex-1 flex items-center gap-2">
            <div
              className="h-10 rounded bg-gray-200 dark:bg-gray-700"
              style={{ width: `${Math.random() * 40 + 50}%` }}
            />
            <Skeleton className="h-4 w-12" />
			</div>
			</div>
      ))}
    </div>
  </div>
);

// Average Duration Chart Skeleton
const AverageDurationChartSkeleton = () => (
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center gap-2 mb-6">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-8 w-16 rounded" />
    </div>
    
    <div className="h-[400px] flex items-end gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full" style={{ height: `${Math.random() * 60 + 30}%` }}>
            <Skeleton className="w-full h-full" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// Main Pipeline Analytics Skeleton (Content Only)
const PipelineAnalyticsSkeleton = () => {
  return (
    <>
      {/* Funnel Chart Card */}
      <FunnelChartSkeleton />
      
      {/* Conversion Rates and Average Duration Charts */}
      <div className="grid grid-cols-2 gap-5 mx-5">
        <ConversionRateChartSkeleton />
        <AverageDurationChartSkeleton />
      </div>
    </>
  );
};

export default PipelineAnalyticsSkeleton;