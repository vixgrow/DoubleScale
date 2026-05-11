// PluginsLoadingSkeleton.tsx
const Skeleton = ({ className = "" }) => {
    return <div className={`rounded-md bg-gray-200 ${className}`} />;
  };
  
  const PluginCardSkeleton = () => {
    return (
      <div className="flex items-start justify-between gap-4 p-4 border border-border/60 bg-muted/50 rounded-2xl">
        <div className="flex flex-col items-start gap-3 flex-1">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2 items-center flex-1">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  };
  
  const AccordionSectionSkeleton = ({ isOptional = false }) => {
    return (
      <div className="border border-border/60 rounded-lg shadow-sm flex flex-col gap-4">
        <div className="px-4 py-3 bg-muted/50 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        
        <div className="px-4 pb-3 flex flex-col gap-4">
          <PluginCardSkeleton />
          {isOptional && <PluginCardSkeleton />}
        </div>
      </div>
    );
  };
  
  export const PluginsLoadingSkeleton = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <AccordionSectionSkeleton isOptional={false} />
        <AccordionSectionSkeleton isOptional={true} />
      </div>
    );
  };