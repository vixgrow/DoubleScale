// BusinessFormSkeleton.tsx
const Skeleton = ({ className = "" }) => {
    return <div className={`rounded-md bg-gray-200 ${className}`} />;
  };
  
  export const BusinessFormSkeleton = () => {
    return (
      <div className="flex flex-col gap-10">
        {/* Form Skeleton */}
        <div className="space-y-6">
          {/* Business Name Field */}
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
  
          {/* Grid: Address + Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Field */}
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-[190px] w-full rounded-lg" />
            </div>
  
            {/* Logo Upload */}
            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <div className="border-2 border-dashed border-gray-300 rounded-2xl h-[190px] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                  <Skeleton className="h-5 w-40 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };