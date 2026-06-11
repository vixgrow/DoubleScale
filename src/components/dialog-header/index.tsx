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
		<div className="flex items-start gap-3 p-0">
			<span className="doublescale-control-modules-dialog-header-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
				{icon}
			</span>

			<div className="min-w-0 flex-1 pt-0.5">
				<p className="text-lg font-semibold leading-tight text-foreground">
					{title}
				</p>
				<p className="mt-0.5 text-sm font-normal leading-snug text-muted-foreground">
					{subtitle}
				</p>
			</div>
		</div>
	);
};

export default CustomDialogHeader;
