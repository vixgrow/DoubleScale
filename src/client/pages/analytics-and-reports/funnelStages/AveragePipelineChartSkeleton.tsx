
import { Skeleton } from '@/components/ui/skeleton';
import { __ } from '@wordpress/i18n';


const AveragePipelineChartSkeleton = () => {
	return (
		<>
		<div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        {/* Chart Skeleton - Vertical Bars */}
        <div className="flex items-end justify-around gap-4" style={{ height: '400px', paddingBottom: '40px' }}>
          {/* Bar 1 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-full rounded-t-md" style={{ height: '180px' }} />
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 2 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-full rounded-t-md" style={{ height: '240px' }} />
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 3 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-full rounded-t-md" style={{ height: '120px' }} />
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 4 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-full rounded-t-md" style={{ height: '200px' }} />
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 5 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-full rounded-t-md" style={{ height: '300px' }} />
            <Skeleton className="h-10 w-2" />
          </div>

          {/* Bar 6 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-full rounded-t-md" style={{ height: '160px' }} />
            <Skeleton className="h-10 w-2" />
          </div>
        </div>
		</>
	);
};

export default AveragePipelineChartSkeleton;
