/**
 * Internal dependencies
 */
import { Skeleton } from '@/components/ui/skeleton';

const SettingsShimmer: React.FC = () => {
    return (
        <div className="space-y-6 p-6">
            {/* Section Title */}
            <Skeleton className="h-8 w-48" />

            {/* Form Fields */}
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        {/* Label */}
                        <Skeleton className="h-4 w-32" />
                        {/* Input Field */}
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>

            {/* Additional Section */}
            <div className="space-y-4 pt-4 border-t">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>

            {/* Another Fields Group */}
            <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsShimmer;

