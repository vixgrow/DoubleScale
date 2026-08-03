/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import type { FC, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 * internal dependencies
 */
import {
	AddContactIcon,
	DashboardContentCard,
	ExternalLinkIcon,
	NewAutomationIcon,
	NewCampaignIcon,
	NewDealIcon,
	NewFormIcon,
} from '@doublescale/components';
import { getToLink } from '@doublescale/navigation';
import config from '@doublescale/config';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import { cn } from '@/lib/utils';


type QuickLinkItem = {
	label: string;
	to: string;
	icon: ReactNode;
};

export const QuickLinks: FC = () => {
	const navigate = useNavigate();

	const links: QuickLinkItem[] = [
		{
			label: __('Create Contact', 'doublescale'),
			to: getToLink('contacts'),
			icon: <AddContactIcon color='#0D9DFC' width={27} height={27} />,
		},
		// Sales Pipeline is a Pro-only route — hide the deal shortcut on Free
		// (same gate as the sidebar entry) or when the module is toggled off.
		...(config.isModuleToggleEnabled('deals') && isProActive()
			? [
					{
						label: __('Create Deal', 'doublescale'),
						to: getToLink('sales-pipeline'),
						icon: <NewDealIcon color='#0D9DFC' width={27} height={27} />,
					},
			  ]
			: []),
		{
			label: __('Create Campaign', 'doublescale'),
			to: getToLink('campaigns'),
			icon: <NewCampaignIcon color='#0D9DFC' width={27} height={27} />,
		},
		{
			label: __('Create Automation', 'doublescale'),
			to: getToLink('automations'),
			icon: <NewAutomationIcon color='#0D9DFC' width={27} height={27} />,
		},
		{
			label: __('Create Forms', 'doublescale'),
			to: getToLink('forms'),
			icon: <NewFormIcon color='#0D9DFC' width={27} height={27} />,
		},
	];

	return (
		<DashboardContentCard
			title={__('Quick Links', 'doublescale')}
			cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
			contentClassName="flex min-h-0 flex-1 flex-col"
			headerContent={__('(Most Used Functions)', 'doublescale')}
		>
			<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
				{links.map(({ label, to, icon }) => (
					<button
						key={to}
						type="button"
						onClick={() => navigate(to)}
						className={cn(
							'group flex w-full flex-col gap-3 rounded-xl border border-border bg-[#F7F8FA] p-3.5 text-left',
							'transition-shadow hover:border-border hover:shadow-sm',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
						)}
					>
						<div className="flex w-full items-start justify-between gap-2">
							<div className="flex text-brandPrimary h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white">
								{icon}
							</div>
							<ExternalLinkIcon/>
						</div>
						<span className=" text-sm font-medium text-primaryText">
							{label}
						</span>
					</button>
				))}
			</div>
		</DashboardContentCard>
	);
};
