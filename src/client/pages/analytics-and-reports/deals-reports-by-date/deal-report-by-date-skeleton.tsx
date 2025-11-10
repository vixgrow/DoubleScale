import { Card, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DealsReportsByDateSkeleton: React.FC = () => {
  return (
    <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5 animate-pulse">
      <CardContent className="p-6 space-y-6">
        
        {/* Chart Placeholder */}
        <div className="mt-6 h-[450px] w-full flex justify-between items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DealsReportsByDateSkeleton;
