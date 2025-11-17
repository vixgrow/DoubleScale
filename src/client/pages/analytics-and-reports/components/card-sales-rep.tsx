import {
	Card,
	CardContent,

	CardHeader,
} from '@/components/ui/card';

import { __ } from '@wordpress/i18n';

import CardsStatistics, {
	CardsStatisticsProps,
} from '../components/card-statistics';

import SaleRepHeader from './sale-rep-header';

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
	// const getStatusColor = (ranking: string) => {
	// 	switch (ranking) {
	// 		case 'TOP 1':
	// 			return 'bg-green-100 text-green-800';
	// 		case 'ON TRACK':
	// 			return 'bg-yellow-100 text-yellow-800';
	// 		case 'AT RISK':
	// 			return 'bg-red-100 text-red-800';
	// 		default:
	// 			return 'bg-gray-100 text-gray-800';
	// 	}
	// };

	// const getAvatarColor = (ranking: string) => {
	// 	switch (ranking) {
	// 		case 'TOP 1':
	// 			return 'bg-purple-500';
	// 		case 'ON TRACK':
	// 			return 'bg-blue-500';
	// 		case 'AT RISK':
	// 			return 'bg-green-500';
	// 		default:
	// 			return 'bg-gray-500';
	// 	}
	// };

	// const getBorderColor = (ranking: string) => {
	// 	switch (ranking) {
	// 		case 'TOP 1':
	// 			return 'border-purple-200';
	// 		case 'ON TRACK':
	// 			return 'border-yellow-200';
	// 		case 'AT RISK':
	// 			return 'border-red-200';
	// 		default:
	// 			return 'border-gray-200';
	// 	}
	// };

	return (
		<Card
			className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8]"
			onClick={onClick}
		>
			<CardHeader className="pb-4">
				<SaleRepHeader
	name={rep.name}
	lastActivity={rep.lastActivity}
	showViewButton={true}
	onViewClick={onClick}
/>
			</CardHeader>

			<CardContent className="p-6 pt-0">
				{/* Metrics Grid */}
				<div className="grid grid-cols-2 gap-2 mb-2">
					<CardsStatistics
						key={0}
						value={rep.total_deals_close_won_number.value}
						label={rep.total_deals_close_won_number.label}
						change={rep.total_deals_close_won_number.change}
						isArrow={rep.total_deals_close_won_number.isArrow}
						isColor={rep.total_deals_close_won_number.isColor}
					/>
					<CardsStatistics
						key={1}
						label={rep.total_deals_close_lost_number.label}
						value={rep.total_deals_close_lost_number.value}
						change={rep.total_deals_close_lost_number.change}
						// isArrow={rep.total_deals_close_lost_number.isArrow}
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

			
		</Card>
	);
};

export default SalesRepCard;
