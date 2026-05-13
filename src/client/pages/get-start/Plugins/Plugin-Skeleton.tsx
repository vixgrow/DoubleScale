const Skeleton = ({ className = '' }) => {
	return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
};

export const PluginGridSkeleton = () => (
	<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
		{[1, 2, 3].map((key) => (
			<div
				key={key}
				className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-white p-6"
			>
				<Skeleton className="h-12 w-12 rounded-lg" />
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-5/6" />
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>
		))}
	</div>
);

/** @deprecated Use PluginGridSkeleton */
export const PluginsLoadingSkeleton = PluginGridSkeleton;
