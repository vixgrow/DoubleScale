// WordPress dependencies
import { __ } from '@wordpress/i18n';

interface DashboardSmallCardProps {
	title: string;
	subtitle: string | number;
	icon: React.ReactNode;
}

const DashboardSmallCard: React.FC<DashboardSmallCardProps> = ({
	subtitle,
	title,
	icon,
}) => {
	return (
		<div className="flex flex-1 flex-col items-start gap-[30px] border border-[#F1F1F2] rounded-xl py-8 px-6">
			<div className="flex items-center gap-6 p-0">
				<span className="bg-[#ECF3FC] p-2 rounded-lg">{icon}</span>
				<p className="text-[#7E8299] font-semibold text-lg">{title}</p>
			</div>
			<div>
				<p className="text-4xl text-black font-bold">{subtitle}</p>
			</div>
		</div>
	);
};

export default DashboardSmallCard;
