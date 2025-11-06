/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Skeleton } from '@quillcrm/components/ui/skeleton';

const InitialShimmer: React.FC = () => {
    return (
        <div className="qcrm-fields">
            {/* Basic Information Header */}
            <div className="text-[#09090B] font-bold text-2xl mb-4">
                {__('Basic Information', 'quillcrm')}
            </div>

            {/* Form Name and Form Selection Row */}
            <div className="flex gap-5 items-start">
                {/* Form Name Field */}
                <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-12 w-full" />
                </div>

                {/* Form Selection Field */}
                <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>

            {/* Form Type Cards Section */}
            <div className="mt-5">
                <div className="mb-4">
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="border border-[#E4E4E4] bg-white p-4 shadow-none">
                            <div className="flex space-x-3">
                                {/* Form Type Icon */}
                                <div className="flex-shrink-0">
                                    <Skeleton className="h-12 w-12" />
                                </div>

                                {/* Form Type Name and Description */}
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InitialShimmer;
