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

interface CategoryData {
	[key: string]: {
		image: React.ReactNode;
		description: string;
	};
}

interface ActionSelectorCardProps {
	automationActions: Record<string, any>;
	selectedCategory: string;
	setSelectedCategory: (category: string) => void;
	categoryData: CategoryData;
}

const ActionSelectorCard: React.FC<ActionSelectorCardProps> = ({
	automationActions,
	selectedCategory,
	setSelectedCategory,
	categoryData,
}) => {
	return (
		<div
			role="tablist"
			aria-orientation="vertical"
			aria-label={__('Action category', 'doublescale')}
			className="flex max-h-[calc(100dvh-300px)] min-h-[420px] flex-col gap-1.5 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2"
		>
			{map(automationActions, (action, index) => {
				const categoryKey = String(index);
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
							'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
							'focus:outline-none focus-visible:ring-2 focus-visible:ring-brandPrimary/20',
							isActive
								? 'border-2 border-dashed border-brandPrimary/60 bg-brandPrimary/5'
								: 'border-2 border-transparent hover:bg-neutral-50'
						)}
					>
						<span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white [&_svg]:max-h-[28px] [&_svg]:max-w-[28px]">
							{meta?.image ?? (
								<IntegrationsIcon width={22} height={22} />
							)}
						</span>
						<span
							className={cn(
								'min-w-0 flex-1 truncate text-sm font-medium',
								isActive
									? 'text-brandPrimary'
									: 'text-neutral-800'
							)}
						>
							{action.label}
						</span>
					</button>
				);
			})}
		</div>
	);
};

export default ActionSelectorCard;
