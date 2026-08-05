/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { IntegrationsIcon } from '@doublescale/components/icons/index';
import { cn } from '@/lib/utils';

const ActiveCategoryBorder = () => (
	<svg
		className="pointer-events-none absolute inset-0 h-full w-full text-primary"
		aria-hidden="true"
	>
		<rect
			x="1"
			y="1"
			width="calc(100% - 2px)"
			height="calc(100% - 2px)"
			rx="10"
			ry="10"
			fill="none"
			stroke="currentColor"
			strokeWidth="1"
			strokeDasharray="20 10"
		/>
	</svg>
);

interface CategoryData {
	[key: string]: {
		image: React.ReactNode;
		description: string;
	};
}

interface ActionSelectorCardProps {
	sidebarCategories: ReadonlyArray<readonly [string, { label?: string }]>;
	selectedCategory: string;
	setSelectedCategory: (category: string) => void;
	categoryData: CategoryData;
}

const ActionSelectorCard: React.FC<ActionSelectorCardProps> = ({
	sidebarCategories,
	selectedCategory,
	setSelectedCategory,
	categoryData,
}) => {
	return (
		<div
			role="tablist"
			aria-orientation="vertical"
			aria-label={__('Action category', 'doublescale')}
			className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 max-h-[calc(100dvh-320px)] min-h-[320px] overflow-y-auto"
		>
			{map(sidebarCategories, ([categoryKey, action]) => {
				const isActive = selectedCategory === categoryKey;
				const meta = categoryData[categoryKey];

				return (
					<button
						key={categoryKey}
						type="button"
						role="tab"
						aria-selected={isActive}
						onClick={() => setSelectedCategory(categoryKey)}
						className={cn(
							'relative flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-colors',
							'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
							isActive
								? 'border-1 border-transparent bg-[#EEEEFF]'
								: 'border-1 border-transparent hover:bg-neutral-50'
						)}
					>
						{isActive ? <ActiveCategoryBorder /> : null}
						<span className="relative flex shrink-0 items-center justify-center overflow-hidden bg-transparent [&_svg]:max-h-[28px] [&_svg]:max-w-[28px]">
							{meta?.image ?? (
								<IntegrationsIcon width={22} height={22} />
							)}
						</span>
						<span className="relative min-w-0 flex-1 truncate text-sm font-medium text-foreground">
							{action.label}
						</span>
					</button>
				);
			})}
		</div>
	);
};

export default ActionSelectorCard;
