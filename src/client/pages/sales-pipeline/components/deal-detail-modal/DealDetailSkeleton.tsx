import { Skeleton } from '@/components/ui/skeleton';
import DealOverviewSkeleton from './deal-overview-skeleton';
export const DealDetailSkeleton = () => {
	return (
		<div className="space-y-8 animate-pulse">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-[200px]" />
					<Skeleton className="h-6 w-[120px]" />
				</div>
				<Skeleton className="h-8 w-[80px] rounded-full" />
			</div>

			<div className="grid grid-cols-2 gap-12">
				{/*  overview shimmer */}
				{/* <div className="border flex flex-col gap-6 border-[#DEE1E6] bg-[#F8F8F8] rounded-[20px] p-6">
					<Skeleton className="h-7 w-[180px] mb-4" />
					<div className="grid grid-cols-2 gap-5">
						{Array(6)
							.fill(0)
							.map((_, i) => (
								<div
									key={i}
									className={`flex justify-between items-center ${
										i % 2 === 1
											? 'border-l border-[#DEE1E6] pl-4'
											: ''
									}`}
								>
									<div className="flex flex-col gap-2 w-full">
										<Skeleton className="h-4 w-[120px]" />
										<Skeleton className="h-5 w-[160px]" />
									</div>
									<Skeleton className="w-7 h-7 rounded-full" />
								</div>
							))}
					</div>
				</div> */}
				<DealOverviewSkeleton/>

				{/*  custom fields shimmer */}
				<div className="border flex flex-col gap-6 border-[#DEE1E6] bg-[#F8F8F8] rounded-[20px] p-6">
					<Skeleton className="h-5 w-1/2" />
					<Skeleton className="h-5 w-2/3" />
					<Skeleton className="h-5 w-1/3" />
					<Skeleton className="h-5 w-4/5" />
					<Skeleton className="h-5 w-3/4" />
				</div>
			</div>

			{/* Pipeline section */}
			<div className="flex flex-wrap justify-between items-center gap-6">
				{Array(4)
					.fill(0)
					.map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-5 w-[120px]" />
							<Skeleton className="h-6 w-[100px]" />
						</div>
					))}
			</div>

			{/* Activities */}
			<div className="space-y-3">
				{Array(3)
					.fill(0)
					.map((_, i) => (
						<Skeleton key={i} className="h-16 w-full rounded-lg" />
					))}
			</div>
		</div>
	);
};
