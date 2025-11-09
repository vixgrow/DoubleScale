import TriangleUpIcon from '@quillcrm/components/icons/triangleUp';
import { Card, CardContent } from '../../../../components/ui/card';
import TriangleDownIcon from '@quillcrm/components/icons/triangleDown';


export type CardsStatisticsProps = {
	label: string;
	value: string;
	change: string;
	isArrow?: boolean;
	isColor: boolean;
};

const CardsStatistics: React.FC<CardsStatisticsProps> = ({
	label,
	value,
	change,
	isArrow,
	isColor,
}) => (
	<Card className={` shadow-none hover:shadow-lg transition-all  border-l-[4px] rounded-[8px]  duration-300 hover:-translate-y-1 ${
		isColor ? 'border-l-[#16A34A]' : 'border-l-[#E13B3B]'} `}>
		<CardContent className="p-6">
		    <div className="text-2xl font-semibold text-[#09090B] mb-1">{value}</div>
			<div className="text-base font-medium text-[#777] capitalize tracking-wide mb-2">
				{label}
			</div>
			<div
				className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
					isColor
						? ' text-green-700'
						: ' text-red-700'
				}`}
			>
				{/* {isArrow ? (
					<TrendingUp className="w-3 h-3" />
				) : (
					<TrendingDown className="w-3 h-3" />
				)} */}
				{isArrow ? (
					<TriangleUpIcon  />
				) : (
					<TriangleDownIcon  />
				)}
				{change}
			</div>
		</CardContent>
	</Card>
);

export default CardsStatistics;
