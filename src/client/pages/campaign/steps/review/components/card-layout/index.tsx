import { Button } from '@/components/ui/button';
import { EditIcon } from '@doublescale/components/icons';
import { __ } from '@wordpress/i18n';

interface CardLayoutProps {
	icon: React.ReactNode;
	header: string;
	buttonIcon?: React.ReactNode;
	buttonText?: string;
	children: React.ReactNode;
	onButtonClick?: () => void;
	button?: boolean;
}
const CardLayout: React.FC<CardLayoutProps> = ({
	icon,
	header,
	buttonIcon = <EditIcon />,
	buttonText = __('Edit', 'doublescale'),
	children,
	onButtonClick,
	button = true,
}) => {
	return (
		<div className="bg-white rounded-lg border border-gray-200">
			<div className="flex justify-between items-center border-b border-gray-200 p-4">
				<div className="flex items-center gap-2 text-[#660FF1] font-bold text-lg">
					{icon}
					{header}
				</div>

				{button && (
					<Button variant="secondary" onClick={onButtonClick}>
						{buttonIcon && buttonIcon}
						{buttonText && buttonText}
					</Button>
				)}
			</div>
			<div className="p-4">{children}</div>
		</div>
	);
};

export default CardLayout;
