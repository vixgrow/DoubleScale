/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PremiumIcon, RocketIcon } from '../../components';
import { Button } from '@/components/ui/button';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

/**
 * Component to display locked library placeholder for Pro features
 */
const LockecButtons = () => {
	const { isInstalling, isActivating, handleUpgradeClick, getUpgradeButtonText } = useProUpgrade();

	return (
		<div className="rounded-2xl bg-white shadow-[0_2px_2px_0_rgba(0,106,98,0.10)]">
			<button
				type="button"
				className="flex justify-between items-center border rounded-lg p-4 text-[#616161] text-base cursor-pointer w-full hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-center gap-[14px]">
					<div className="border rounded-lg border-[#616161] p-1.5">
						<div className="border-t border-[#616161] w-[18px]"></div>
					</div>
					<div>{__('Buttons', 'doublescale')}</div>
				</div>
				<PremiumIcon />
			</button>

			<div className="text-center p-6 space-y-2">
				<h3 className="text-base text-[#333333] font-medium">
					{__(
						'Unlock advanced features with Pro upgrade',
						'doublescale'
					)}
				</h3>
				<Button
					size="lg"
					className="w-full max-w-xs [&_svg]:size-6"
					onClick={() => handleUpgradeClick()}
					disabled={isInstalling || isActivating}
				>
					<RocketIcon />
					{getUpgradeButtonText()}
				</Button>
			</div>
		</div>
	);
};

export default LockecButtons;
