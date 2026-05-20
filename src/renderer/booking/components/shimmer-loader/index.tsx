import { Skeleton } from '@doublescale/shared/ui/skeleton';

const ShimmerLoader = () => {
	return (
		<div
			style={{
				margin: 'auto',
				padding: 24,
				background: '#fff',
			}}
		>

			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10 shrink-0 rounded-full" />
			</div>
			<div
				className="mt-6 flex w-full flex-col"
				style={{ gap: 16 }}
			>
				<Skeleton className="h-8 w-[70%] rounded-md" />

				<Skeleton className="h-6 w-[90%] rounded-md" />

				<Skeleton className="h-6 w-[80%] rounded-md" />
			</div>

			<div className="mt-8">
				<Skeleton
					className="w-full rounded-lg"
					style={{ height: 200 }}
				/>
			</div>

			<div className="mt-6 grid grid-cols-12 gap-4">
				<div className="col-span-3">
					<Skeleton className="h-8 w-1/2 rounded-md" />
				</div>
			</div>
		</div>
	);
};

export default ShimmerLoader;
