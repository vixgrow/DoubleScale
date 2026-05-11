import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Shimmer = () => {
	return (
        <div className="grid grid-cols-2 gap-5 px-9">
            <Card className="rounded-lg"><CardContent>
                    <div className="animate-pulse">
                        {/* Header shimmer */}
                        <div className='flex gap-3 items-center mb-6'>
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className='flex flex-col gap-0.5'>
                                <div className="h-5 bg-gray-200 rounded w-32"></div>
                                <div className="h-4 bg-gray-200 rounded w-64"></div>
                            </div>
                        </div>

                        {/* Team toggle shimmer */}
                        <div className='flex items-center justify-between mb-6'>
                            <div className='flex flex-col gap-0.5'>
                                <div className="h-5 bg-gray-200 rounded w-48"></div>
                                <div className="h-4 bg-gray-200 rounded w-96"></div>
                            </div>
                            <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                        </div>

                        {/* Schedule blocks shimmer */}
                        <div className="space-y-4 mb-6">
                            {[...Array(7)].map((_, index) => (
                                <div key={index} className='flex items-center gap-4'>
                                    <div className="w-24 h-6 bg-gray-200 rounded"></div>
                                    <div className="flex-1 h-12 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>

                        {/* Range section shimmer */}
                        <div className="space-y-4 mb-6">
                            <div className="h-6 bg-gray-200 rounded w-40"></div>
                            <div className="h-12 bg-gray-200 rounded"></div>
                        </div>

                        {/* Reserve times section shimmer */}
                        <div className='flex items-center justify-between'>
                            <div className='flex flex-col gap-0.5'>
                                <div className="h-5 bg-gray-200 rounded w-36"></div>
                                <div className="h-4 bg-gray-200 rounded w-80"></div>
                            </div>
                            <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </CardContent></Card>
            <Card className="rounded-lg"><CardContent>
                    <div className='flex flex-col gap-4'>
                        <Skeleton className='h-10 w-full rounded-md' />
                        {/* Buffer sections */}
                        <div>
                            <Skeleton className='h-10 w-full rounded-md' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                        <div>
                            <Skeleton className='h-10 w-full rounded-md' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                        {/* Minimum Notice */}
                        <div>
                            <Skeleton className='h-10 w-full rounded-md' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                        {/* Time Slots */}
                        <div>
                            <Skeleton className='h-10 w-full rounded-md' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                        {/* Booking Frequency */}
                        <div>
                            <Skeleton className='h-10 w-full rounded-md' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                        {/* Booking Duration */}
                        <div>
                            <Skeleton className='h-10 w-full rounded-md' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                        {/* Timezone */}
                        <div>
                            <Skeleton className='h-10 w-full rounded-md' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                    </div>
                </CardContent></Card>
        </div>
    );
};

export default Shimmer;
