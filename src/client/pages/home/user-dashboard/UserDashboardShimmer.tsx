/**
 * Internal dependencies
 */
import { DashboardContentCard } from '@doublescale/components';
import { Skeleton } from '@/components/ui/skeleton';
import { __ } from '@wordpress/i18n';
import { cn } from '@/lib/utils';

export const UserDashboardShimmer: React.FC = () => {
	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl bg-[#f8f9fa] ">
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
					<DashboardContentCard
						title={__('Analytics Overview', 'doublescale')}
						cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] lg:col-span-2"
						contentClassName="flex min-h-0 flex-1 flex-col"
					>
						<div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
							{Array.from({ length: 8 }).map((_, index) => (
								<div
									key={index}
									className="flex flex-col items-center rounded-xl border border-border/60 bg-card p-5"
								>
									<Skeleton className="mb-3 h-14 w-14 shrink-0 rounded-full" />
									<Skeleton className="mb-2 h-3 w-24" />
									<Skeleton className="h-8 w-16" />
								</div>
							))}
						</div>
					</DashboardContentCard>

					<DashboardContentCard
						title={__('Quick Links', 'doublescale')}
						cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
						contentClassName="flex min-h-0 flex-1 flex-col"
						headerContent={__('(Most Used Functions)', 'doublescale')}
					>
						<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
							{Array.from({ length: 5 }).map((_, index) => (
								<div
									key={index}
									className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4"
								>
									<div className="flex w-full items-start justify-between">
										<Skeleton className="h-10 w-10 shrink-0 rounded-full" />
										<Skeleton className="h-4 w-4 rounded" />
									</div>
									<Skeleton className="h-5 w-full max-w-[11rem]" />
								</div>
							))}
						</div>
					</DashboardContentCard>
				</div>
			</div>

			{/* Recent Contacts & Contact Analytics Chart */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
				<div className="flex h-full min-h-0 flex-col">
					<DashboardContentCard
						title={__('Recent Contacts', 'doublescale')}
						cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
						contentClassName="flex min-h-0 flex-1 flex-col"
						viewAllLink={true}
						viewAllLinkUrl="contacts"
					>
						<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
							{Array.from({ length: 5 }).map((_, index) => (
								<div
									key={index}
									className="rounded-xl border border-border bg-[#F7F8FA] p-4"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex flex-1 items-center gap-3">
											<Skeleton className="h-11 w-11 shrink-0 rounded-full" />
											<Skeleton className="h-5 w-36" />
										</div>
										<Skeleton className="h-5 w-24 shrink-0" />
									</div>
									<div className="mt-3 flex justify-between gap-3">
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-4 w-28" />
									</div>
								</div>
							))}
						</div>
					</DashboardContentCard>
				</div>
				<div className="flex h-full min-h-0 flex-col">
					<DashboardContentCard
						title={__('Contact Analytics', 'doublescale')}
						cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
						contentClassName="flex min-h-0 flex-1 flex-col"
					>
						<div className="space-y-4">
							<div className="flex justify-end">
								<Skeleton className="h-9 w-28" />
							</div>
							<Skeleton className="min-h-[300px] w-full rounded-lg" />
						</div>
					</DashboardContentCard>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
				<div className="flex h-full min-h-0 flex-col">
					<DashboardContentCard
						title={__('Recent Automations', 'doublescale')}
						cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
						contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
						viewAllLink={true}
						viewAllLinkUrl="automations"
					>
						<div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border">
							<div className="bg-[#DEE1E666] border-b border-[#E1E3EA] px-3 py-3">
								<div className="flex gap-3">
									<Skeleton className="h-3 w-8" />
									<Skeleton className="h-3 w-14" />
									<Skeleton className="h-3 w-14" />
									<Skeleton className="h-3 w-12" />
									<Skeleton className="ml-auto h-3 w-10" />
								</div>
							</div>
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className={cn(
										'flex items-center gap-3 px-3 py-3',
										index % 2 === 0 ? 'bg-white' : 'bg-[#F7F8FA]',
										index < 2 && 'border-b border-[#E1E3EA]'
									)}
								>
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-6 w-20 rounded-full" />
									<Skeleton className="ml-auto h-8 w-8 rounded-lg" />
								</div>
							))}
						</div>
					</DashboardContentCard>
				</div>
				<div className="flex h-full min-h-0 flex-col">
					<DashboardContentCard
						title={__('Recent Campaigns', 'doublescale')}
						cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
						contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
						viewAllLink={true}
						viewAllLinkUrl="campaigns"
					>
						<div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border">
							<div className="bg-[#DEE1E666] border-b border-[#E1E3EA] px-3 py-3">
								<div className="flex flex-wrap gap-3">
									<Skeleton className="h-3 w-8" />
									<Skeleton className="h-3 w-12" />
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-3 w-14" />
									<Skeleton className="h-3 w-12" />
									<Skeleton className="ml-auto h-3 w-10" />
								</div>
							</div>
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className={cn(
										'flex flex-wrap items-center gap-3 px-3 py-3',
										index % 2 === 0 ? 'bg-white' : 'bg-[#F7F8FA]',
										index < 2 && 'border-b border-[#E1E3EA]'
									)}
								>
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-10" />
									<Skeleton className="h-6 w-20 rounded-full" />
									<Skeleton className="ml-auto h-8 w-8 rounded-lg" />
								</div>
							))}
						</div>
					</DashboardContentCard>
				</div>
			</div>
		</div>
	);
};

