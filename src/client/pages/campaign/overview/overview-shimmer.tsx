/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Skeleton } from '@quillcrm/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OverviewShimmer: React.FC = () => {
    return (
        <div className="flex gap-5">
            {/* Analytics Section Shimmer */}
            <div className="flex flex-col gap-5 w-1/3">
                {/* Campaign Performance Card */}
                <Card className="bg-[#F8F8F8] shadow-none w-full px-5">
                    <CardHeader className="border-b pb-4 px-0">
                        <CardTitle className="text-xl font-medium text-[#09090B]">
                            <Skeleton className="h-6 w-64" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5 pt-5">
                        {/* Metrics Cards - MessageStatsCard style */}
                        {[...Array(4)].map((_, index) => (
                            <Card key={index} className="shadow-none bg-white border-l-4">
                                <CardContent className="flex items-center gap-3 p-4">
                                    {/* Icon skeleton */}
                                    <div className="flex items-center justify-center w-12 h-12 rounded">
                                        <Skeleton className="w-10 h-10" />
                                    </div>
                                    {/* Text content */}
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>

                {/* Statistics Card */}
                <Card className="bg-[#F8F8F8] shadow-none w-full px-5">
                    <CardHeader className="px-0">
                        <CardTitle className="text-xl font-medium text-[#09090B]">
                            <Skeleton className="h-6 w-32" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        {/* Chart skeleton */}
                        <div className="flex items-center justify-center h-64">
                            <Skeleton className="w-48 h-48 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Selection Card Shimmer */}
            <Card className="bg-[#F8F8F8] shadow-none p-5 w-2/3">
                {/* Tabs shimmer */}
                <div className="border-b pb-4 pt-5">
                    <div className="flex gap-2">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="flex items-center gap-2 px-4 py-2">
                                <Skeleton className="w-6 h-6" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Campaign Details Content shimmer */}
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Campaign Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(4)].map((_, index) => (
                                <div key={index} className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                            ))}
                        </div>

                        {/* Email Template Section */}
                        <div className="space-y-3 border-t pt-4">
                            <Skeleton className="h-7 w-40 mb-3" />
                            <div className="space-y-4 bg-[#E3EEFF99] p-4 rounded-lg border">
                                <Skeleton className="h-64 w-full rounded" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OverviewShimmer;

