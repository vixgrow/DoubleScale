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
		<div className="min-w-0 overflow-hidden rounded-xl border border-border bg-white">
			<div className="flex flex-col sm:flex-row justify-between items-center p-6 gap-4 sm:gap-0">
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
			<div className="min-w-0 overflow-hidden pb-6 px-6">{children}</div>
		</div>
	);
};

export default CardLayout;
