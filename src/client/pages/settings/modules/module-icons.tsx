import {
	AutomationsIcon,
	BookingIcon,
	CampaignIcon,
	FormsIcon,
	IntegrationsIcon,
	PipelineIcon,
	TaskIcon,
} from '@doublescale/components';

const ICON_COLOR = '#0D9DFC';
const ICON_BG = '#D9E9F3';

type ModuleIconProps = {
	slug: string;
	size?: 'md' | 'sm';
};

export function ModuleIcon({ slug, size = 'md' }: ModuleIconProps) {
	const dim = size === 'sm' ? 20 : 28;
	const padding = size === 'sm' ? 'p-0.5' : 'p-1';

	const icon = (() => {
		switch (slug) {
			case 'smtp':
				return <IntegrationsIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'sales':
				return <PipelineIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'deals':
				return <PipelineIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'forms':
				return <FormsIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'automations':
				return <AutomationsIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'tasks':
				return <TaskIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'campaigns':
				return <CampaignIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'booking':
				return <BookingIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'support':
				return <IntegrationsIcon width={dim} height={dim} color={ICON_COLOR} />;
			default:
				return <IntegrationsIcon width={dim} height={dim} color={ICON_COLOR} />;
		}
	})();

	return (
		<span
			className={`inline-flex shrink-0 items-center justify-center rounded-lg ${padding}`}
			style={{ backgroundColor: ICON_BG, color: ICON_COLOR }}
		>
			{icon}
		</span>
	);
}
