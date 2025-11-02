/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Skeleton } from '@quillcrm/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const OverviewShimmer: React.FC = () => {
    return (
        <div className="flex gap-5">
            {/* Analytics Card Shimmer */}
            <Card className="w-1/3 bg-[#F8F8F8] shadow-none">
                <CardHeader className="border-b pb-6">
                    {/* Campaign Name/Title */}
                    <Skeleton className="h-6 w-48 mb-4" />
                    
                    {/* Status and Actions Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                        <Skeleton className="h-2 w-full rounded" />
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                    </div>

                    {/* Stats Rows */}
                    <div className="space-y-3">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-4 w-12" />
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4">
                        <Skeleton className="h-10 w-full rounded" />
                        <Skeleton className="h-10 w-full rounded" />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Selection Card Shimmer */}
            <Card className="w-2/3 bg-[#F8F8F8] shadow-none p-5">
                {/* Tabs shimmer */}
                <div className="bg-transparent gap-2 border-b pb-4 pt-5 px-6 flex">
                    {['Campaign Details', 'Emails', 'Unsubscribes'].map((tab, index) => (
                        <Skeleton
                            key={index}
                            className="h-10 w-36 rounded-md"
                        />
                    ))}
                </div>

                {/* Content shimmer */}
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {/* Title */}
                        <Skeleton className="h-6 w-48 mb-6" />
                        
                        {/* Form-like rows */}
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full rounded" />
                            </div>
                        ))}
                        
                        {/* Large content area */}
                        <div className="pt-4">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-40 w-full rounded" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OverviewShimmer;

