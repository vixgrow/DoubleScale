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
import { ButtonsIcon, RocketIcon } from '../../components';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

interface LockedButtonsProps {
	inline?: boolean;
}

const LockecButtons: React.FC<LockedButtonsProps> = ({ inline = false }) => {
	const {
		isInstalling,
		isActivating,
		handleUpgradeClick,
		getUpgradeButtonText,
	} = useProUpgrade();

	const themeRowClass = (isInline: boolean) =>
		cn(
			'flex w-full cursor-pointer items-center justify-between px-4 py-4 text-sm transition-colors',
			isInline
				? 'rounded-xl text-white hover:bg-white/[0.16]'
				: 'rounded-lg border border-border/60 text-foreground hover:bg-muted/40'
		);

	if (inline) {
		return (
			<button
				type="button"
				className={themeRowClass(true)}
				style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
				onClick={() => handleUpgradeClick()}
				disabled={isInstalling || isActivating}
			>
				<div className="flex items-center gap-3">
					<span className="inline-flex shrink-0 text-white">
						<ButtonsIcon width={32} height={32} />
					</span>
					<span>{__('Buttons', 'doublescale')}</span>
				</div>
				<ChevronRight
					className="h-6 w-6 shrink-0 text-white"
					aria-hidden
				/>
			</button>
		);
	}

	return (
		<div
			className={cn(
				'rounded-2xl',
				'bg-white shadow-[0_2px_2px_0_rgba(0,106,98,0.10)]'
			)}
		>
			<button
				type="button"
				className={themeRowClass(false)}
				style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
				onClick={() => handleUpgradeClick()}
				disabled={isInstalling || isActivating}
			>
				<div className="flex items-center gap-3">
					<span className="inline-flex shrink-0 text-[#616161]">
						<ButtonsIcon width={32} height={32} />
					</span>
					<span>{__('Buttons', 'doublescale')}</span>
				</div>
				<ChevronRight
					className="h-6 w-6 shrink-0 text-muted-foreground"
					aria-hidden
				/>
			</button>

			<div className="space-y-2 p-6 text-center">
				<h3 className={cn('text-base font-medium text-[#333333]')}>
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
