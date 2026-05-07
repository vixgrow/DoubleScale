/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Skeleton } from '@doublescale/components/ui/skeleton';

const SettingsShimmer: React.FC = () => {
    return (
        <div className="doublescale-fields">
            {/* Form Fields Mapping Section */}
            <div className="doublescale-field">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Settings Section */}
            <div className="doublescale-field">
                <Skeleton className="h-8 w-32 my-5" />
                <div className="doublescale-field-input">
                    <div className="flex flex-col gap-5">
                        {/* Lists and Tags Row */}
                        <div className="flex justify-between gap-[10px]">
                            <div className="flex flex-col gap-[10px] flex-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="flex flex-col flex-1 gap-[10px]">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>

                        {/* Settings Card */}
                        <div className="shadow-none pt-6 border rounded-lg p-6">
                            <div className="space-y-6">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-6 w-11 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsShimmer;
