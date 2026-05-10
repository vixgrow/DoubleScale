import { cn } from '@/lib/utils';

const PanelSettingsHeader: React.FC<{
	title: string;
	description: string;
	icon: React.ReactNode;
	iconVariant?: 'default' | 'white';
}> = ({ title, description, icon, iconVariant = 'default' }) => {
	return (
		<div className="flex items-center gap-2 bg-sidebar-accent text-white py-4 px-8 rounded-t-2xl">
			<div
				className={
					cn(
						iconVariant === 'default'
							? 'border border-white'
							: 'bg-white'
					) + ' p-2 rounded-lg'
				}
			>
				{icon}
			</div>
			<div>
				<p className="text-2xl font-normal">{title}</p>
				<p>{description}</p>
			</div>
		</div>
	);
};

export default PanelSettingsHeader;
