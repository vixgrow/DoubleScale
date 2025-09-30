import { Card, CardContent } from '../../../../components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type CardsStatisticsProps = {
	label: string;
	value: string;
	change: string;
	isArrow: boolean;
	isColor: boolean;
};

const CardsStatistics: React.FC<CardsStatisticsProps> = ({
	label,
	value,
	change,
	isArrow,
	isColor,
}) => (
	<Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
		<CardContent className="p-6">
			<div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
				{label}
			</div>
			<div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
			<div
				className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
					isColor
						? 'bg-green-50 text-green-700'
						: 'bg-red-50 text-red-700'
				}`}
			>
				{isArrow ? (
					<TrendingUp className="w-3 h-3" />
				) : (
					<TrendingDown className="w-3 h-3" />
				)}
				{change}
			</div>
		</CardContent>
	</Card>
);

export default CardsStatistics;
