/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Skeleton } from '@quillcrm/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const ContactShimmer: React.FC = () => {
    return (
        <div className="flex h-full gap-5">
            {/* Contact Information Card Shimmer */}
            <Card className="w-1/3 bg-[#F8F8F8] shadow-none">
                <CardHeader>
                    <div className="flex items-center gap-4 border-b pb-4">
                        {/* Avatar shimmer */}
                        <Skeleton className="w-40 h-28 rounded-full" />
                        <div className="w-full space-y-2">
                            {/* Name and status shimmer */}
                            <div className="flex justify-between items-center gap-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-8 w-[120px] rounded" />
                            </div>
                            {/* Email shimmer */}
                            <Skeleton className="h-4 w-40" />
                            {/* Stats shimmer */}
                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex gap-1 items-center border-r pr-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className="h-4 w-6" />
                                </div>
                                <div className="flex gap-1 items-center border-r pr-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                                <div className="flex gap-1 items-center">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                    {/* Lists/Tags Cards Section */}
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>

                    {/* Info Card Section */}
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                </CardContent>
            </Card>

            {/* Data Card Shimmer */}
            <Card className="w-2/3 bg-[#F8F8F8] shadow-none p-5">
                {/* Tabs shimmer */}
                <div className="bg-transparent gap-5 border-b pb-9 pt-5 flex">
                    {['Emails', 'Deals', 'Notes', 'Automation', 'Purchase History'].map((tab, index) => (
                        <Skeleton
                            key={index}
                            className="h-9 w-24 rounded-md"
                        />
                    ))}
                </div>

                {/* Content shimmer */}
                <CardContent className="pt-6 px-0">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-32 w-full mt-4" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-2/3" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ContactShimmer;

