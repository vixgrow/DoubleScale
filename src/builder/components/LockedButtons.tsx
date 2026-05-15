/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { ChevronRight } from 'lucide-react';
/**
 * Internal dependencies
 */
import { ButtonsIcon, PremiumIcon } from '../../components';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';
import { cn } from '@/lib/utils';

const shellClass =
	'flex w-full items-center justify-between rounded-xl bg-white/[0.05] px-4 py-4 text-sm text-white transition-colors';

const LockedButtons: React.FC = () => {
	const { isInstalling, isActivating, handleUpgradeClick, isProActive } =
		useProUpgrade();

	return (
		<button
			type="button"
			className={cn(
				shellClass,
				'cursor-pointer hover:bg-white/[0.16]'
			)}
			onClick={() => handleUpgradeClick()}
			disabled={isInstalling || isActivating}
		>
			<div className="flex min-w-0 items-center gap-3">
				<span className="inline-flex shrink-0 text-white">
					<ButtonsIcon width={32} height={32} />
				</span>
				<span className="flex min-w-0 items-center gap-2 font-medium">
					{__('Buttons', 'doublescale')}
					{!isProActive ? (
						<span
							className="inline-flex shrink-0 items-center rounded-md bg-white/10 px-1.5 py-0.5"
							title={__('Pro feature', 'doublescale')}
							aria-hidden
						>
							<PremiumIcon width={16} height={16} />
						</span>
					) : null}
				</span>
			</div>
			<ChevronRight className="h-6 w-6 shrink-0 text-white" aria-hidden />
		</button>
	);
};

export default LockedButtons;
