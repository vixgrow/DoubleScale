/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { Card, CardHeader, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';

const SalesRepSkeleton: React.FC = () => {
	return (
		<div className="w-7xl max-w-[90vw] mx-auto flex flex-col gap-5">
			{/* Header Section Skeleton */}
			<div className="flex justify-between items-center py-6">
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<Skeleton className="w-12 h-12 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-[350px]" />
						<Skeleton className="h-4 w-[200px]" />
					</div>
				</div>
				<Skeleton className="h-10 w-[200px]" />
			</div>

			{/* Statistics Cards Skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b py-6 border-b-[#DEE1E6]">
				{Array.from({ length: 4 }).map((_, index) => (
					<Card key={index} className="p-4 border border-[#DEE1E6] rounded-[12px]">
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Skeleton className="h-10 w-10 rounded-full" />
								<Skeleton className="h-4 w-4 rounded" />
							</div>
							<Skeleton className="h-4 w-[120px]" />
							<Skeleton className="h-8 w-[100px]" />
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded" />
								<Skeleton className="h-3 w-[80px]" />
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* Charts Section Skeleton */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start border-b py-6 border-b-[#DEE1E6]">
				{/* Pipeline Stages Skeleton */}
				<Card className="lg:col-span-2 p-6 border border-[#DEE1E6] rounded-[20px]">
					<div className="space-y-4">
						<Skeleton className="h-6 w-[200px]" />
						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, index) => (
								<div key={index} className="space-y-2">
									<div className="flex items-center justify-between">
										<Skeleton className="h-4 w-[120px]" />
										<Skeleton className="h-4 w-[60px]" />
									</div>
									<Skeleton className="h-8 w-full rounded-full" />
								</div>
							))}
						</div>
					</div>
				</Card>

				{/* Win/Loss Analysis Skeleton */}
				<Card className="p-6 border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8]">
					<div className="space-y-4">
						<Skeleton className="h-6 w-[180px]" />
						<div className="flex items-center justify-between gap-4">
							<Skeleton className="h-[260px] w-[260px] rounded-full flex-shrink-0" />
							<div className="space-y-4 flex-1">
								{Array.from({ length: 3 }).map((_, index) => (
									<div key={index} className="flex items-center gap-3">
										<Skeleton className="h-4 w-4 rounded-full" />
										<div className="space-y-1 flex-1">
											<Skeleton className="h-4 w-full" />
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</Card>
			</div>

			{/* Table Skeleton */}
			<div className="border-b py-6 border-b-[#DEE1E6]">
				<Card className="border border-[#DEE1E6] rounded-[20px]">
					<CardHeader className="p-6">
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-[180px]" />
						</div>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="border border-[#DEE1E6] rounded-[8px] overflow-hidden">
							{/* Table Header */}
							<div className="bg-[#F8F8F8] p-4">
								<div className="flex gap-4">
									<Skeleton className="h-4 w-[150px]" />
									<Skeleton className="h-4 w-[100px]" />
									<Skeleton className="h-4 w-[100px]" />
									<Skeleton className="h-4 w-[120px]" />
									<Skeleton className="h-4 w-[100px]" />
									<Skeleton className="h-4 w-[120px]" />
								</div>
							</div>
							{/* Table Rows */}
							<div className="divide-y divide-[#DEE1E6]">
								{Array.from({ length: 5 }).map((_, index) => (
									<div key={index} className="p-4">
										<div className="flex gap-4">
											<Skeleton className="h-4 w-[150px]" />
											<Skeleton className="h-4 w-[100px]" />
											<Skeleton className="h-6 w-[100px] rounded-full" />
											<Skeleton className="h-4 w-[120px]" />
											<Skeleton className="h-4 w-[100px]" />
											<Skeleton className="h-4 w-[120px]" />
										</div>
									</div>
								))}
							</div>
							{/* Pagination */}
							<div className="border-t border-[#DEE1E6] p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-[200px]" />
										<Skeleton className="h-10 w-[120px]" />
									</div>
									<div className="flex items-center gap-2">
										<Skeleton className="h-10 w-[80px]" />
										<Skeleton className="h-10 w-[40px]" />
										<Skeleton className="h-10 w-[40px]" />
										<Skeleton className="h-10 w-[40px]" />
										<Skeleton className="h-10 w-[80px]" />
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activities Skeleton */}
			<div className="py-6">
				<Card className="border border-[#DEE1E6] rounded-[20px]">
					<CardHeader className="p-6">
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-[180px]" />
							<Skeleton className="h-8 w-[100px]" />
						</div>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="space-y-4">
							{Array.from({ length: 4 }).map((_, index) => (
								<div key={index} className="flex gap-3 items-start">
									<Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
									<div className="space-y-2 flex-1">
										<Skeleton className="h-4 w-full max-w-[400px]" />
										<Skeleton className="h-3 w-[150px]" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default SalesRepSkeleton;