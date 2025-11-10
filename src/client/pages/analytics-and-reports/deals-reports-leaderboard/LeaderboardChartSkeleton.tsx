import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LeaderboardChartSkeleton = () => {
    return (
        <Card className="border border-[#DEE1E6] p-5" style={{ backgroundColor: '#F5F5F5', boxShadow: 'none' }}>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-1/3" />

                
                <div className="pt-2" />

                
                <div className="space-y-3 mt-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-6 w-full rounded-lg"
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default LeaderboardChartSkeleton;
