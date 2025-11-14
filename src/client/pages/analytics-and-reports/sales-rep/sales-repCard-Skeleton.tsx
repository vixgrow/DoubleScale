import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesRepCardSkeletonProps {
	count?: number;
}

const SalesRepCardSkeleton = ({ count = 6 }: SalesRepCardSkeletonProps) => {
	return (
		<>
			{/* Page Header Skeleton */}
			<div className="mb-6">
				<Skeleton className="h-8 w-64 mb-2" />
				<Skeleton className="h-4 w-48" />
			</div>

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{Array.from({ length: count }).map((_, index) => (
					<Card
						key={index}
						className="shadow-sm border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8]"
					>
						<CardHeader className="pb-4">
							{/* Header Section */}
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3 flex-1">
									{/* Avatar Skeleton */}
									<Skeleton className="h-10 w-10 rounded-full" />
									
									{/* Name and Activity Skeleton */}
									<div className="flex-1">
										<Skeleton className="h-5 w-32 mb-2" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
								
								{/* View Button Skeleton */}
								<Skeleton className="h-8 w-16 rounded-md" />
							</div>
						</CardHeader>

						<CardContent className="p-6 pt-0">
							{/* First Row of Metrics */}
							<div className="grid grid-cols-2 gap-2 mb-2">
								{/* Metric Card 1 */}
								<div className="bg-white p-4 rounded-lg">
									<Skeleton className="h-3 w-20 mb-2" />
									<Skeleton className="h-6 w-12 mb-2" />
									<Skeleton className="h-3 w-16" />
								</div>
								
								{/* Metric Card 2 */}
								<div className="bg-white p-4 rounded-lg">
									<Skeleton className="h-3 w-20 mb-2" />
									<Skeleton className="h-6 w-12 mb-2" />
									<Skeleton className="h-3 w-16" />
								</div>
							</div>

							{/* Second Row of Metrics */}
							<div className="grid grid-cols-2 gap-2">
								{/* Metric Card 3 */}
								<div className="bg-white p-4 rounded-lg">
									<Skeleton className="h-3 w-24 mb-2" />
									<Skeleton className="h-6 w-16 mb-2" />
									<Skeleton className="h-3 w-16" />
								</div>
								
								{/* Metric Card 4 */}
								<div className="bg-white p-4 rounded-lg">
									<Skeleton className="h-3 w-24 mb-2" />
									<Skeleton className="h-6 w-16 mb-2" />
									<Skeleton className="h-3 w-16" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</>
	);
};

export default SalesRepCardSkeleton;