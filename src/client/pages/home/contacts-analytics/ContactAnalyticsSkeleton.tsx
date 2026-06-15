import React from 'react';
import { User } from 'lucide-react';

// Skeleton Component
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Stats Card Skeleton
const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg p-5 border-l-4 border-gray-200">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

// Chart Skeleton
const ChartSkeleton = () => (
  <div className="flex h-full min-h-0 flex-col rounded-lg bg-white p-6 w-full">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="h-[280px] flex items-end gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="animate-pulse bg-gray-200 rounded w-full"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
            <Skeleton className="h-3 w-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Recent Contacts Skeleton
const RecentContactsSkeleton = () => (
  <div className="flex h-full min-h-0 flex-col rounded-lg bg-white p-6 w-full">
    <Skeleton className="h-6 w-40 mb-6" />
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// Unsubscribed Table Skeleton
const UnsubscribedTableSkeleton = () => (
  <div className="min-w-0 w-full rounded-lg bg-white p-6 lg:col-span-2">
    <Skeleton className="h-6 w-56 mb-6" />
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 pb-3 border-b">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Table Rows */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4 py-4 border-b items-center">
          <Skeleton className="h-4 w-8" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Main Component
const ContactAnalyticsSkeleton = () => {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <div className="mb-2">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-stretch">
        <div className="col-span-1 space-y-5">
          <div className="rounded-lg bg-white p-4">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-5">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
          </div>
        </div>

        <UnsubscribedTableSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
        <RecentContactsSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
};

export default ContactAnalyticsSkeleton;