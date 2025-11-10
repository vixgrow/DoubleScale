import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const SalesPipelineSkeleton: React.FC = () => {
	return (
		<div className="p-6 space-y-6 h-screen flex flex-col">

			{/* 4 boxes row */}
			<div className="grid grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 w-full rounded-xl" />
				))}
			</div>

			{/* Main pipeline columns */}
			<div className="grid grid-cols-4 gap-6 flex-1 overflow-hidden mt-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="flex flex-col h-full rounded-2xl border border-gray-200 p-4 bg-white"
					>
						{/* Column Header */}
						<div className="space-y-3 mb-12">
							<Skeleton className="h-6 w-32 rounded-md" />
							<div className="flex gap-3">
								<Skeleton className="h-5 w-16 rounded" />
								<Skeleton className="h-5 w-20 rounded" />
							</div>
						</div>

						{/* Deals list shimmer */}
						<div className="flex-1 overflow-y-auto space-y-3 mt-6">
							{Array.from({ length: 4 }).map((_, j) => (
								<Skeleton
									key={j}
									className="h-24 w-full rounded-xl"
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
