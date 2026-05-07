/**
 * Internal dependencies
 */
import { DashboardContentCard } from '@doublescale/components';
import { Skeleton } from '@/components/ui/skeleton';
import { __ } from '@wordpress/i18n';

export const UserDashboardShimmer: React.FC = () => {
	return (
		<div className="flex flex-col gap-5 mt-5">
			{/* Dashboard Cards - Analytics Overview */}
			<DashboardContentCard
				title={__('Analytics Overview', 'doublescale')}
				cardClassName="w-full"
			>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
					{Array.from({ length: 8 }).map((_, index) => (
						<div
							key={index}
							className="flex items-center gap-3 p-4 bg-white border-l-4 border-l-gray-300 rounded-lg"
						>
							<Skeleton className="w-12 h-12 rounded-lg" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-16" />
							</div>
						</div>
					))}
				</div>
			</DashboardContentCard>

			{/* Recent Contacts & Contact Analytics Chart */}
			<div className="flex gap-5">
				{/* Recent Contacts */}
				<DashboardContentCard
					title={__('Recent Contacts', 'doublescale')}
					cardClassName="w-1/2"
					viewAllLink={true}
					viewAllLinkUrl="contacts"
				>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={index}
								className={`flex justify-between items-center py-4 ${
									index < 4 ? 'border-b border-dashed border-gray-200' : ''
								}`}
							>
								<div className="flex items-center gap-4">
									<Skeleton className="w-12 h-12 rounded-lg" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-40" />
									</div>
								</div>
								<Skeleton className="h-4 w-24" />
							</div>
						))}
					</div>
				</DashboardContentCard>

				{/* Contact Analytics Chart */}
				<DashboardContentCard
					title={__('Contact Analytics', 'doublescale')}
					cardClassName="w-1/2"
				>
					<div className="space-y-4">
						<div className="flex gap-2 justify-end mb-4">
							<Skeleton className="h-9 w-24" />
							<Skeleton className="h-9 w-32" />
							<Skeleton className="h-9 w-32" />
							<Skeleton className="h-9 w-24" />
						</div>
						<Skeleton className="h-64 w-full" />
					</div>
				</DashboardContentCard>
			</div>

			{/* Recent Automations & Quick Links */}
			<div className="flex gap-5">
				{/* Recent Automations */}
				<DashboardContentCard
					title={__('Recent Automations', 'doublescale')}
					cardClassName="w-3/5"
					viewAllLink={true}
					viewAllLinkUrl="automations"
				>
					<div className="border rounded-lg">
						{/* Table Header */}
						<div className="bg-[#DEE1E666] border-b">
							<div className="flex gap-4 p-3">
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-16" />
							</div>
						</div>
						{/* Table Rows */}
						{Array.from({ length: 3 }).map((_, index) => (
							<div
								key={index}
								className={`flex gap-4 p-3 bg-white ${
									index < 2 ? 'border-b' : ''
								}`}
							>
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-20 rounded-full" />
								<Skeleton className="h-6 w-6 rounded-lg ml-auto" />
							</div>
						))}
					</div>
				</DashboardContentCard>

				{/* Quick Links */}
				<DashboardContentCard
					title={__('Quick Links', 'doublescale')}
					cardClassName="w-2/5"
					headerContent={__('(Most Used Functions)', 'doublescale')}
				>
					<div className="border-t"></div>
					<div>
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={index}
								className={`flex items-center justify-between py-4 ${
									index < 4
										? 'border-b-[1.25px] border-dashed border-[#E1E3EA]'
										: ''
								}`}
							>
								<div className="flex items-center gap-3">
									<Skeleton className="w-10 h-10 rounded-xl" />
									<Skeleton className="h-5 w-40" />
								</div>
								<Skeleton className="w-8 h-8 rounded" />
							</div>
						))}
					</div>
				</DashboardContentCard>
			</div>

			{/* Recent Campaigns */}
			<DashboardContentCard
				title={__('Recent Campaigns', 'doublescale')}
				cardClassName="w-full"
				viewAllLink={true}
				viewAllLinkUrl="campaigns"
			>
				<div className="border rounded-lg">
					{/* Table Header */}
					<div className="bg-[#DEE1E666] border-b">
						<div className="flex gap-4 p-3">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-16" />
						</div>
					</div>
					{/* Table Rows */}
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={index}
							className={`flex gap-4 p-3 bg-white ${
								index < 2 ? 'border-b' : ''
							}`}
						>
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-6 rounded-lg ml-auto" />
						</div>
					))}
				</div>
			</DashboardContentCard>
		</div>
	);
};

