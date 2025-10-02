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
        <div className="flex h-full gap-[20px]">
            {/* Contact Information Card Shimmer */}
            <Card className="flex-1">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        {/* Avatar shimmer */}
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="flex-1 space-y-3">
                            {/* Name shimmer */}
                            <Skeleton className="h-7 w-48" />
                            {/* Badge and email shimmer */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Contact Details Section */}
                        <div>
                            <Skeleton className="h-6 w-32 mb-3" />
                            <div className="grid grid-cols-1 gap-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div>
                            <Skeleton className="h-6 w-24 mb-3" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <Skeleton
                                        key={index}
                                        className="h-6 w-16 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Lists Section */}
                        <div>
                            <Skeleton className="h-6 w-24 mb-3" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <Skeleton
                                        key={index}
                                        className="h-6 w-20 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Card Shimmer */}
            <Card className="flex-[2]">
                {/* Tabs shimmer */}
                <div className="w-full flex h-auto p-0 border-b">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex-1 p-4">
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>

                {/* Content shimmer */}
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-32 w-full mt-4" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-2/3" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ContactShimmer;

