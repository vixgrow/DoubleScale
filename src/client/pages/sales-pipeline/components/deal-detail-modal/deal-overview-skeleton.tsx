import { Skeleton } from "@/components/ui/skeleton";

export default function DealOverviewSkeleton() {
  return (
    <div className="border flex flex-col gap-6 border-[#DEE1E6] bg-[#F8F8F8] rounded-[20px] p-6">
      <Skeleton className="h-7 w-40" />

      <div className="grid grid-cols-2 gap-5">
        {/* Contact */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>

        {/* Owner */}
        <div className="flex justify-between items-center border-l border-[#DEE1E6] pl-4">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>

        {/* Source */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>

        {/* Expected Close Date */}
        <div className="flex justify-between items-center border-l border-[#DEE1E6] pl-4">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>

        {/* Priority */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
