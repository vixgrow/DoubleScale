import { Skeleton } from '@/components/ui/skeleton';

export const AutomationShimmer = () => {
	return (
		<div className="w-full space-y-6">
			{/* Header */}
			<div className="border-b border-[#E4E7EC] pr-14 pl-5 pb-4">
				<div className="flex items-center justify-between">
					{/* Left section */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-6 w-24" />
					</div>

					{/* Right section - Save button */}
					<div className="flex gap-2">
						<Skeleton className="h-9 w-32" />
					</div>
				</div>
			</div>

			{/* Content Area */}
			<div className="px-6">
				{/* Workflow Area */}
				<div className="w-full">
					{/* Main Content */}
					<div className="col-span-3">
						<div className="p-6">
							<div className="space-y-4">
								<Skeleton className="h-40 w-full" />
								<Skeleton className="h-40 w-full" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
