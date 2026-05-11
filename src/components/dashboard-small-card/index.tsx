// WordPress dependencies
import { __ } from '@wordpress/i18n';

interface DashboardSmallCardProps {
	title: string;
	subtitle: string | number;
	icon: React.ReactNode;
	color?: string;
}

const DashboardSmallCard: React.FC<DashboardSmallCardProps> = ({
	subtitle,
	title,
	icon,
	color,
}) => {
	return (
		<div className="flex flex-1 flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 transition-all hover:shadow-sm">
			<div className="flex items-center gap-3">
				<span
					className={`${color ? color : 'bg-primary/10 text-primary'} flex h-10 w-10 items-center justify-center rounded-lg`}
				>
					{icon}
				</span>
				<span className="text-sm font-medium text-muted-foreground">
					{title}
				</span>
			</div>
			<div>
				<span className="text-3xl font-bold text-foreground">
					{subtitle}
				</span>
			</div>
		</div>
	);
};

export default DashboardSmallCard;
