/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Skeleton } from '@/components/ui/skeleton';

const StepsShimmer: React.FC = () => {
	return (
		<div className="fixed inset-0 w-full h-full bg-white z-[1700000] flex flex-col overflow-y-auto">
			{/* Header Section - Fixed */}
			<div className="flex-none p-4 bg-white px-12">
				<div className="flex justify-between items-center">
					{/* Breadcrumb shimmer */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-24" />
						<span className="text-gray-400">/</span>
						<Skeleton className="h-5 w-32" />
						<span className="text-gray-400">/</span>
						<Skeleton className="h-5 w-28" />
					</div>

					{/* Panel button shimmer */}
					<Skeleton className="h-10 w-40" />
				</div>
			</div>

			{/* Scrollable Content Section */}
			<div className="flex-1 bg-white px-12 pt-4">
				<div className="pb-8 h-full">
					{/* Main Card with Settings Panel layout */}
					<div className="rounded-lg border border-gray-200 bg-[#F8F8F8] shadow-sm overflow-hidden">
						{/* Card Header */}
						<div className="border-b border-gray-200 bg-white p-6">
							<div className="flex items-center gap-3">
								<Skeleton className="w-12 h-12 rounded" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-6 w-48" />
									<Skeleton className="h-4 w-96" />
								</div>
							</div>
						</div>

						{/* Card Content */}
						<div className="p-6 space-y-6">
							{/* Form fields shimmer */}
							{[...Array(4)].map((_, index) => (
								<div key={index} className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
							))}

							{/* Additional section */}
							<div className="border-t pt-6 space-y-4">
								<Skeleton className="h-5 w-40" />
								<div className="grid grid-cols-2 gap-4">
									<Skeleton className="h-32 w-full rounded-lg" />
									<Skeleton className="h-32 w-full rounded-lg" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Footer Section - Fixed */}
			<div className="flex-none pb-6 bg-white mt-10">
				{/* Progress bar shimmer */}
				<Skeleton className="h-4 w-full rounded-none" />
				
				<div className="py-6 flex justify-between items-center px-8">
					{/* Back button */}
					<Skeleton className="h-10 w-24 rounded-lg" />

					{/* Next buttons */}
					<div className="flex gap-4">
						<Skeleton className="h-10 w-32 rounded-lg" />
						<Skeleton className="h-10 w-24 rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
};

export default StepsShimmer;

