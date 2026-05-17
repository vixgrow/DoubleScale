/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	automationDialogAccentBarClassName,
	automationDialogBodyClassName,
	automationDialogHeaderClassName,
	automationDialogSurfaceCompact,
} from '../../client/pages/automation/steps/workflow/automation-dialog-presets';
import './style.scss';
import config from '@doublescale/config';
import { RocketIcon } from '@/components/icons';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

interface ProAutomationModalProps {
	visible: boolean;
	onClose: () => void;
	featureName: string;
}

export const ProAutomationModal: React.FC<ProAutomationModalProps> = ({
	visible,
	onClose,
	featureName,
}) => {
	const upgradeUrl = config.getUrlDoubleScalePro();
	const { isInstalling, isActivating, handleUpgradeClick, getUpgradeButtonText } = useProUpgrade();
	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={cn(
					automationDialogSurfaceCompact,
					'doublescale-pro-modal gap-0 p-0'
				)}
			>
				<div
					className={automationDialogAccentBarClassName}
					aria-hidden
				/>
				<DialogHeader
					className={cn(automationDialogHeaderClassName, 'space-y-1')}
				>
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						{__('Pro', 'doublescale')}
					</p>
					<DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
						<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/5 text-indigo-700 ring-1 ring-indigo-950/10">
							<Lock className="h-4 w-4" />
						</span>
						{__('This is a PRO Feature', 'doublescale')}
					</DialogTitle>
				</DialogHeader>

				<div className={cn(automationDialogBodyClassName, 'space-y-6')}>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{__(
							"We're sorry, this feature is not available on your plan. Please upgrade to the PRO plan to unlock all these awesome features.",
							'doublescale'
						)}
					</p>
					<div className="doublescale-pro-modal__feature-info">
						<div className="flex items-start gap-3 rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/90 to-sky-50/50 p-4 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-slate-900/30">
							<Lock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
							<div>
								<div className="mb-1 font-semibold text-indigo-950 dark:text-indigo-100">
									{featureName}
								</div>
								<div className="text-sm text-indigo-800/90 dark:text-indigo-200/80">
									{__('Available in PRO version', 'doublescale')}
								</div>
							</div>
						</div>
					</div>

					<div className="doublescale-pro-modal__actions flex flex-col gap-3 sm:flex-row">
						<Button
							variant="outline"
							onClick={onClose}
							className="flex-1 sm:flex-initial"
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<div className="doublescale-pro-modal__action flex-1">
							<Button
								onClick={() => {
									handleUpgradeClick(upgradeUrl);
								}}
								className="w-full bg-gradient-to-r from-indigo-700 to-sky-600 text-white shadow-sm hover:from-indigo-800 hover:to-sky-700"
								disabled={isInstalling || isActivating}
							>
								<RocketIcon />
								{getUpgradeButtonText()}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ProAutomationModal;
