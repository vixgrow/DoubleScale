import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LeaderboardChartSkeleton: React.FC = () => {
  return (
    <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
      <CardContent className="p-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        {/* Chart Skeleton */}
        <div className="space-y-4" style={{ height: '400px' }}>
          {/* Bar 1 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 flex-1" style={{ maxWidth: '90%' }} />
          </div>

          {/* Bar 2 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 flex-1" style={{ maxWidth: '75%' }} />
          </div>

          {/* Bar 3 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 flex-1" style={{ maxWidth: '85%' }} />
          </div>

          {/* Bar 4 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 flex-1" style={{ maxWidth: '60%' }} />
          </div>

          {/* Bar 5 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 flex-1" style={{ maxWidth: '50%' }} />
          </div>

          {/* Bar 6 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 flex-1" style={{ maxWidth: '40%' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



export default LeaderboardChartSkeleton;
