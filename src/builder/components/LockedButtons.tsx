/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PremiumIcon } from '../../components';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

/**
 * Shown inside the Buttons accordion when Pro is not active.
 */
const LockedButtons: React.FC = () => {
	const { isInstalling, isActivating, handleUpgradeClick } = useProUpgrade();

	return (
		<div className="flex flex-col items-center justify-center gap-4 px-2 py-8 text-center">
			<div className="rounded-full bg-[#FAEADF] p-2">
				<PremiumIcon width={30} height={30} />
			</div>
			<p className="max-w-xs text-sm font-medium text-white">
				{__(
					'Unlock button theme settings with Pro',
					'doublescale'
				)}
			</p>
			<div className="relative w-full max-w-xs rounded-lg">
				<svg
					className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-lg text-white/45"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden
				>
					<rect
						x="0.5"
						y="0.5"
						width="calc(100% - 1px)"
						height="calc(100% - 1px)"
						rx="7"
						ry="7"
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
						strokeDasharray="10 8"
						vectorEffect="nonScalingStroke"
					/>
				</svg>
				<button
					type="button"
					className="relative z-10 flex h-11 w-full items-center justify-center rounded-lg border-0 bg-transparent text-sm font-medium text-white/90 shadow-none transition-colors hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50"
					onClick={() => handleUpgradeClick()}
					disabled={isInstalling || isActivating}
				>
					{__('Upgrade to Pro', 'doublescale')}
				</button>
			</div>
		</div>
	);
};

export default LockedButtons;
