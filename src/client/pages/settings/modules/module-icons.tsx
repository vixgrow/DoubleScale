import {
	AutomationsIcon,
	BookingIcon,
	CampaignIcon,
	FormsIcon,
	HelpdeskIcon,
	IntegrationsIcon,
	PipelineIcon,
	ProjectsIcon,
	SalesIcon,
	SmtpIcon,
	TaskIcon,
} from '@doublescale/components';

const ICON_COLOR = '#0D9DFC';
const ICON_BG = '#E8F4FD';

const SIZE_MAP = {
	md: { className: 'doublescale-module-icon--md', icon: 20 },
	sm: { className: 'doublescale-module-icon--sm', icon: 16 },
} as const;

type ModuleIconProps = {
	slug: string;
	size?: keyof typeof SIZE_MAP;
};

export function ModuleIcon({ slug, size = 'md' }: ModuleIconProps) {
	const { className: sizeClass, icon: dim } = SIZE_MAP[size];

	const icon = (() => {
		switch (slug) {
			case 'smtp':
				return <SmtpIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'sales':
				return <SalesIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'deals':
				return <PipelineIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'documents':
			case 'contracts':
			case 'credit_notes':
				return <SalesIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'forms':
				return <FormsIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'automations':
				return <AutomationsIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'tasks':
				return <TaskIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'projects':
				return <ProjectsIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'campaigns':
				return <CampaignIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'booking':
				return <BookingIcon width={dim} height={dim} color={ICON_COLOR} />;
			case 'support':
				return <HelpdeskIcon width={dim} height={dim} color={ICON_COLOR} />;
			default:
				return <IntegrationsIcon width={dim} height={dim} color={ICON_COLOR} />;
		}
	})();

	return (
		<span
			className={`doublescale-module-icon ${sizeClass}`}
			style={{ backgroundColor: ICON_BG, color: ICON_COLOR }}
		>
			{icon}
		</span>
	);
}
