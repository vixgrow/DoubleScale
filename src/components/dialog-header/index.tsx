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
		<div className="flex items-center gap-4 p-0">
			<span className="bg-[#E8E2FB] p-3 rounded-xl">{icon}</span>

			<div>
				<p className="text-[#29292E] font-bold !text-2xl">{title}</p>
				<p className="text-[#6B6C76] !text-base font-normal">{subtitle}</p>
			</div>
		</div>
	);
};

export default CustomDialogHeader;
