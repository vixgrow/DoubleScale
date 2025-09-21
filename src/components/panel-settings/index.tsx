import { cn } from '../../lib/utils';
import PanelSettingsHeader from '../panel-settings-header';

const PanelSettings: React.FC<{
	title: string;
	description: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	iconVariant?: 'default' | 'white';
	className?: string;
}> = ({
	title,
	description,
	icon,
	children,
	iconVariant = 'default',
	className,
}) => {
	return (
		<div className={cn('rounded-lg', className)}>
			<PanelSettingsHeader
				title={title}
				description={description}
				icon={icon}
				iconVariant={iconVariant}
			/>
			<div className=" rounded-b-2xl px-8 border border-t-0 border-gray-200 py-4">
				{children}
			</div>
		</div>
	);
};

export default PanelSettings;
