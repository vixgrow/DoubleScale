/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { cn } from '@/lib/utils';
import GridIcon from '@/components/icons/grid';
import ListIcon from '@/components/icons/list';

export type ConnectionsViewMode = 'table' | 'card';

export type ConnectionsViewToggleProps = {
	value: ConnectionsViewMode;
	onChange: (next: ConnectionsViewMode) => void;
	className?: string;
};

/**
 * Card vs table layout switcher for SMTP connections (single source of styling).
 */
export function ConnectionsViewToggle({
	value,
	onChange,
	className,
}: ConnectionsViewToggleProps) {
	return (
		<div
			className={cn('inline-flex', className)}
			role="group"
			aria-label={__('Connections layout', 'doublescale')}
		>
			<button
				type="button"
				className={cn(
					'relative flex h-9 w-10 shrink-0 items-center justify-center bg-white transition-colors focus-visible:z-[11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandPrimary/35 focus-visible:ring-offset-2',
					value === 'card'
						? 'z-10 rounded-l-[10px] border border-brandPrimary text-brandPrimary'
						: 'z-0 rounded-l-[10px] border-t border-b border-l border-[#D0D0D0] border-r-0 text-[#A8A8B3]'
				)}
				aria-pressed={value === 'card'}
				aria-label={__('Card view', 'doublescale')}
				onClick={() => onChange('card')}
			>
				<GridIcon width={20} height={20} />
			</button>
			<button
				type="button"
				className={cn(
					'-ml-px relative flex h-9 w-10 shrink-0 items-center justify-center bg-white transition-colors focus-visible:z-[11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandPrimary/35 focus-visible:ring-offset-2',
					value === 'table'
						? 'z-10 rounded-r-[10px] border border-brandPrimary text-brandPrimary'
						: 'z-0 rounded-r-[10px] border-t border-b border-r border-[#D0D0D0] border-l-0 text-[#A8A8B3]'
				)}
				aria-pressed={value === 'table'}
				aria-label={__('Table view', 'doublescale')}
				onClick={() => onChange('table')}
			>
				<ListIcon width={20} height={20} />
			</button>
		</div>
	);
}
