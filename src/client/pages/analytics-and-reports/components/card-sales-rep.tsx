import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import CardsStatistics, {
	CardsStatisticsProps,
} from '../components/card-statistics';

export interface SalesRepCardProps {
	id: number;
	name: string;
	email: string;

	ranking: 'TOP 1' | 'ON TRACK' | 'AT RISK';

	total_deals_close_won_number: CardsStatisticsProps;
	total_deals_close_lost_number: CardsStatisticsProps;
	performance_rate_number: CardsStatisticsProps;
	performance_rate_value: CardsStatisticsProps;

	lastActivity: string;
}

const SalesRepCard = ({
	rep,
	onClick,
}: {
	rep: SalesRepCardProps;
	onClick: () => void;
}) => {
	const getStatusColor = (ranking: string) => {
		switch (ranking) {
			case 'TOP 1':
				return 'bg-green-100 text-green-800';
			case 'ON TRACK':
				return 'bg-yellow-100 text-yellow-800';
			case 'AT RISK':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getAvatarColor = (ranking: string) => {
		switch (ranking) {
			case 'TOP 1':
				return 'bg-purple-500';
			case 'ON TRACK':
				return 'bg-blue-500';
			case 'AT RISK':
				return 'bg-green-500';
			default:
				return 'bg-gray-500';
		}
	};

	const getBorderColor = (ranking: string) => {
		switch (ranking) {
			case 'TOP 1':
				return 'border-purple-200';
			case 'ON TRACK':
				return 'border-yellow-200';
			case 'AT RISK':
				return 'border-red-200';
			default:
				return 'border-gray-200';
		}
	};

	return (
		<Card
			className={`border-2 ${getBorderColor(rep.ranking)} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
			onClick={onClick}
		>
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0 flex-1">
						<div
							className={`w-12 h-12 rounded-full ${getAvatarColor(rep.ranking)} flex items-center justify-center text-white font-semibold flex-shrink-0`}
						>
							{rep.name.charAt(0).toUpperCase()}
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="font-semibold text-gray-900 text-lg truncate">
								{rep.name}
							</h3>
							<p className="text-gray-500 text-sm truncate">
								{rep.email}
							</p>
						</div>
					</div>
					<Badge
						variant="outline"
						className={`${getStatusColor(rep.ranking)} border-0 flex-shrink-0`}
					>
						{rep.ranking}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="p-6 pt-0">
				{/* Metrics Grid */}
				<div className="grid grid-cols-2 gap-2 mb-2">
					<CardsStatistics
						key={0}
						label={rep.total_deals_close_won_number.label}
						value={rep.total_deals_close_won_number.value}
						change={rep.total_deals_close_won_number.change}
						isArrow={rep.total_deals_close_won_number.isArrow}
						isColor={rep.total_deals_close_won_number.isColor}
					/>
					<CardsStatistics
						key={1}
						label={rep.total_deals_close_lost_number.label}
						value={rep.total_deals_close_lost_number.value}
						change={rep.total_deals_close_lost_number.change}
						isArrow={rep.total_deals_close_lost_number.isArrow}
						isColor={rep.total_deals_close_lost_number.isColor}
					/>
				</div>
				<div className="grid grid-cols-2 gap-2 mb-2">
					<CardsStatistics
						key={2}
						label={rep.performance_rate_number.label}
						value={rep.performance_rate_number.value}
						change={rep.performance_rate_number.change}
						isArrow={rep.performance_rate_number.isArrow}
						isColor={rep.performance_rate_number.isColor}
					/>
					<CardsStatistics
						key={3}
						label={rep.performance_rate_value.label}
						value={rep.performance_rate_value.value}
						change={rep.performance_rate_value.change}
						isArrow={rep.performance_rate_value.isArrow}
						isColor={rep.performance_rate_value.isColor}
					/>
				</div>
			</CardContent>

			<CardFooter className="pt-4 border-t border-gray-100 justify-center">
				<span className="text-sm text-gray-500">
					Last activity: {rep.lastActivity}
				</span>
			</CardFooter>
		</Card>
	);
};

export default SalesRepCard;
