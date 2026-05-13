// WordPress dependencies
import { __ } from '@wordpress/i18n';

interface CustomDialogHeaderProps {
	title: string;
	subtitle: string;
	icon: React.ReactNode;
}

const CustomDialogHeader: React.FC<CustomDialogHeaderProps> = ({
	subtitle,
	title,
	icon,
}) => {
	return (
		<div className="flex items-center  gap-3 p-0">
			<span className="flex items-center justify-center w-10 h-10 p-2 bg-secondary text-primary rounded-lg">{icon}</span>

			<div>
				<p className="text-foreground font-semibold text-lg leading-tight">{title}</p>
				<p className="text-muted-foreground text-sm font-normal mt-0.5">{subtitle}</p>
			</div>
		</div>
	);
};

export default CustomDialogHeader;
