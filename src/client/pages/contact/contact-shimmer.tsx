/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Skeleton } from '@doublescale/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const ContactShimmer: React.FC = () => {
	return (
		<div className="flex min-h-[480px] w-full flex-col gap-8 lg:flex-row lg:items-start">
			<Card className="w-full shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm ring-1 ring-black/[0.03] lg:w-[min(100%,380px)] lg:max-w-[380px]">
				<CardHeader className="space-y-0 border-b border-border/40 bg-gradient-to-b from-muted/40 to-transparent p-6">
					<div className="flex flex-col items-center">
						<Skeleton className="mb-4 h-[5.25rem] w-[5.25rem] rounded-full" />
						<Skeleton className="mb-3 h-7 w-40" />
						<Skeleton className="mb-2 h-10 w-full max-w-[280px] rounded-xl" />
						<Skeleton className="h-10 w-full max-w-[220px] rounded-xl" />
					</div>
					<div className="mt-6 grid grid-cols-3 gap-2">
						<Skeleton className="h-24 rounded-xl" />
						<Skeleton className="h-24 rounded-xl" />
						<Skeleton className="h-24 rounded-xl" />
					</div>
					<div className="mt-4 flex justify-center gap-2">
						<Skeleton className="h-8 w-24 rounded-full" />
						<Skeleton className="h-8 w-20 rounded-full" />
						<Skeleton className="h-8 w-28 rounded-full" />
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-5 px-5 py-5">
					<div className="space-y-3">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-20 w-full rounded-xl" />
					</div>
					<div className="space-y-3">
						<Skeleton className="h-5 w-36" />
						<Skeleton className="h-36 w-full rounded-xl" />
					</div>
				</CardContent>
			</Card>

			<Card className="min-h-[min(70vh,560px)] w-full flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card p-0 shadow-sm ring-1 ring-black/[0.03]">
				<div className="border-b border-border/50 bg-muted/20 px-4 py-4 sm:px-5">
					<div className="flex flex-wrap gap-2 rounded-xl bg-background/85 p-2 ring-1 ring-border/40">
						{[
							'Activities',
							'Emails',
							'Deals',
							'Notes',
							'Tasks',
						].map((_, index) => (
							<Skeleton
								key={index}
								className="h-9 w-[5.5rem] rounded-lg sm:w-24"
							/>
						))}
					</div>
				</div>
				<CardContent className="px-5 pt-8">
					<div className="space-y-4">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="mt-4 h-32 w-full rounded-xl" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-2/3" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ContactShimmer;

