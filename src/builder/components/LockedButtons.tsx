/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ChevronRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { ButtonsIcon } from '../../components';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

const LockecButtons: React.FC = () => {
	const { isInstalling, isActivating, handleUpgradeClick } = useProUpgrade();

	return (
		<button
			type="button"
			className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-white/[0.05] px-4 py-4 text-sm text-white transition-colors hover:bg-white/[0.16]"
			onClick={() => handleUpgradeClick()}
			disabled={isInstalling || isActivating}
		>
			<div className="flex items-center gap-3">
				<span className="inline-flex shrink-0 text-white">
					<ButtonsIcon width={32} height={32} />
				</span>
				<span>{__('Buttons', 'doublescale')}</span>
			</div>
			<ChevronRight className="h-6 w-6 shrink-0 text-white" aria-hidden />
		</button>
	);
};

export default LockecButtons;
