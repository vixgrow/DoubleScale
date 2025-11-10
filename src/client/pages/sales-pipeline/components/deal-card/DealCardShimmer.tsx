/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Internal dependencies
 */
import './style.scss';

interface DealCardShimmerProps {
	style?: React.CSSProperties;
}

export const DealCardShimmer: React.FC<DealCardShimmerProps> = ({
	style: customStyle = {},
}) => {
	const style = {
		'--stage-color': '#6d78d8',
		...customStyle,
	} as React.CSSProperties;

	return (
		<div style={style} className="deal-card m-4 shimmer-card">
			<Card className="w-full flex flex-col gap-1.5 rounded-[16px] border border-[#DEE1E6]">
				<CardHeader className="flex flex-col gap-1 text-[#09090B]">
					<div className="flex items-center justify-between">
						{/* Title skeleton */}
						<CardTitle className="text-lg font-bold leading-[28px] tracking-[-.5px]">
							<Skeleton className="h-7 w-48" />
						</CardTitle>
						{/* Menu button skeleton */}
						<Skeleton className="h-8 w-8 rounded-md" />
					</div>

					{/* Contact and date info skeleton */}
					<div className="flex flex-wrap items-center gap-1 text-[#777] text-base font-medium font-[Inter] leading-[26px]">
						<span className="flex items-center gap-1">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-32" />
						</span>

						<div className="h-5 w-[1px] bg-[#DEE1E6]" />
						<span className="flex items-center gap-1">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-24" />
						</span>
					</div>
				</CardHeader>

				<CardContent className="flex justify-between mb-0">
					{/* Deal Value skeleton */}
					<div className="flex flex-col">
						<span className="text-[#660FF1] text-base font-medium landing-[26px] flex items-center gap-1">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-20" />
						</span>
						<p className="text-[#09090B] text-lg font-bold landing-[28px] text-center">
							<Skeleton className="h-7 w-24 mx-auto" />
						</p>
					</div>

					{/* Weighted Value skeleton */}
					<div className="flex flex-col">
						<span className="text-[#458DC7] text-base font-medium landing-[26px] flex items-center gap-1">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-20" />
						</span>
						<p className="text-[#09090B] text-lg font-bold landing-[28px] text-center">
							<Skeleton className="h-7 w-24 mx-auto" />
						</p>
					</div>
				</CardContent>

				<div className="h-0.5 bg-[#DEE1E6] mx-6"></div>

				<CardFooter className="flex justify-between items-center">
					{/* Owner skeleton */}
					<div className="flex items-center gap-1">
						<div className="flex items-center gap-1">
							<Skeleton className="w-8 h-8 rounded-full" />
							<Skeleton className="h-4 w-16" />
						</div>
						<Skeleton className="h-4 w-24" />
					</div>

					{/* Priority badge skeleton */}
					<div className="flex mt-1 gap-3">
						<Skeleton className="h-7 w-16 rounded-[8px]" />
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};
