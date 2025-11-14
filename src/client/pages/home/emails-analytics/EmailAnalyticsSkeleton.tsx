import React from 'react';

// Skeleton Component
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Stats Card Skeleton
const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg p-5 border-l-4 border-gray-200 flex-1">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

// Email Stats Overview Skeleton
const EmailStatsOverviewSkeleton = () => (
  <div className="bg-white rounded-lg p-6">
    <Skeleton className="h-6 w-56 mb-6" />
    <div className="flex gap-5">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  </div>
);

// Recent Emails Table Skeleton
const RecentEmailsTableSkeleton = () => (
  <div className="bg-white rounded-lg p-6">
    <Skeleton className="h-6 w-40 mb-6" />
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-8 gap-4 pb-3 border-b">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Table Rows */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="grid grid-cols-8 gap-4 py-4 border-b items-center">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

// Main Email Analytics Skeleton
const EmailAnalyticsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Page Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="flex flex-col gap-5">
        {/* Email Stats Overview */}
        <EmailStatsOverviewSkeleton />

        {/* Recent Emails Table */}
        <RecentEmailsTableSkeleton />
      </div>
    </div>
  );
};

export default EmailAnalyticsSkeleton;