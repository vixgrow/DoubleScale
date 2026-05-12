import { Button } from '@/components/ui/button';
import { EditIcon } from '@doublescale/components';
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
		<div className="bg-white rounded-xl border border-border">
			<div className="flex justify-between items-center p-6">
				<div className="flex items-center gap-2 text-foreground font-semibold text-lg">
					<div className="rounded-full p-1 border border-border bg-[#F7F8FA] text-[#0D9DFC]">{icon}</div>
					{header}
				</div>

				{button && (
					<Button variant="secondary" onClick={onButtonClick}>
						{buttonIcon && buttonIcon}
						{buttonText && buttonText}
					</Button>
				)}
			</div>
			<div className="pb-6 px-6">{children}</div>
		</div>
	);
};

export default CardLayout;
