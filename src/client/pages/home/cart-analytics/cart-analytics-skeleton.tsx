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
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  </div>
);

// Cart Stats Overview Skeleton
const CartStatsOverviewSkeleton = () => (
  <div className="bg-white rounded-lg p-6">
    <Skeleton className="h-6 w-52 mb-6" />
    <div className="flex gap-5">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  </div>
);

// Chart Skeleton
const ChartSkeleton = () => (
  <div className="bg-white rounded-lg p-6 h-full">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="h-[300px] flex items-end gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="animate-pulse bg-gray-200 rounded w-full"
              style={{ height: `${Math.random() * 50 + 30}%` }}
            />
            <Skeleton className="h-3 w-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Recent Carts Table Skeleton
const RecentCartsTableSkeleton = () => (
  <div className="bg-white rounded-lg p-6 h-full">
    <Skeleton className="h-6 w-36 mb-6" />
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-7 gap-4 pb-3 border-b">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Table Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4 py-4 border-b items-center">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Recovered Carts Table Skeleton
const RecoveredCartsTableSkeleton = () => (
  <div className="bg-white rounded-lg p-6">
    <Skeleton className="h-6 w-44 mb-6" />
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-7 gap-4 pb-3 border-b">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Table Rows */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4 py-4 border-b items-center">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Main Cart Analytics Skeleton
const CartAnalyticsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Page Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex flex-col gap-5">
        {/* Cart Stats Overview */}
        <CartStatsOverviewSkeleton />

        {/* Middle Section: Recent Carts Table + Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-full md:col-span-2">
            <RecentCartsTableSkeleton />
          </div>
          <div className="h-full md:col-span-1">
            <ChartSkeleton />
          </div>
        </div>

        {/* Recovered Carts Table */}
        <RecoveredCartsTableSkeleton />
      </div>
    </div>
  );
};

export default CartAnalyticsSkeleton;