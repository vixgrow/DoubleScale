/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
/**
 * external dependencies
 */
import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import {
	BackgroundIcon,
	InfoIcon,
	ButtonsIcon,
	PremiumIcon,
} from '@doublescale/components';
import { cn } from '@/lib/utils';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';
import { STORE_KEY } from '../../stores/email-builder/constants';
import LockedButtons from './LockedButtons';
import BackgroundSettings from './BackgroudSettings';

type ThemePanel = 'background' | 'buttons' | null;

const GlobalEmailSettings: React.FC = () => {
	const dispatch = useDispatch();
	const [themePanel, setThemePanel] = useState<ThemePanel>(null);
	const { isProActive } = useProUpgrade();

	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);

	const ThemeButtonsExpanded = applyFilters(
		'doublescale_builder_theme_buttons_expanded',
		LockedButtons
	) as React.ComponentType<Record<string, never>>;

	const themeAccordionTriggerClass = cn(
		'flex w-full items-center justify-between bg-white/[0.05] px-4 py-4 text-left text-sm text-white transition-colors hover:bg-white/[0.08]'
	);

	const themeAccordionShell = cn(
		'overflow-hidden rounded-xl',
		'bg-[rgba(255,255,255,0.05)]'
	);

	const themeAccordionBodyClass =
		'border-t border-white px-4 py-4';

	return (
		<div className="grid gap-6">
			<div className="flex flex-col gap-2">
				<div className="text-sm font-medium text-white">
					{__('Canvas Width', 'doublescale')}
				</div>
				<Input
					type="number"
					min={1}
					className="h-11 w-full !rounded-lg !border-none !ring-0 !ring-offset-0 text-base !text-white !shadow-none placeholder:text-white"
					style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
					placeholder={__('Canvas Width', 'doublescale')}
					value={globalSettings.canvasWidth}
					onChange={(e) =>
						dispatch(STORE_KEY).updateGlobalSettings({
							canvasWidth:
								Number.parseInt(e.target.value, 10) || 900,
						})
					}
				/>
				<div className="flex items-center gap-2 text-white">
					<InfoIcon />
					<p className="text-sm">
						{__(
							'We recommend using a 800-900px width',
							'doublescale'
						)}
					</p>
				</div>
			</div>

			<div className="h-px bg-white" />

			<div className="flex flex-col gap-4">
				<div className="text-sm text-white">
					{__('Theme settings', 'doublescale')}
				</div>

				<div className={themeAccordionShell}>
					<button
						type="button"
						className={cn(
							themeAccordionTriggerClass,
							themePanel === 'background' &&
							'border-b border-white px-4'
						)}
						onClick={() =>
							setThemePanel((p) =>
								p === 'background' ? null : 'background'
							)
						}
					>
						<div className="flex items-center gap-3">
							<span className="inline-flex shrink-0 text-white">
								<BackgroundIcon width={32} height={32} />
							</span>
							<span>{__('Background', 'doublescale')}</span>
						</div>
						{themePanel === 'background' ? (
							<ChevronDown className="h-6 w-6 shrink-0 text-white" />
						) : (
							<ChevronRight className="h-6 w-6 shrink-0 text-white" />
						)}
					</button>
					{themePanel === 'background' && (
						<div className={themeAccordionBodyClass}>
							<BackgroundSettings />
						</div>
					)}
				</div>

				<div className={themeAccordionShell}>
					<button
						type="button"
						className={cn(
							themeAccordionTriggerClass,
							themePanel === 'buttons' &&
							'border-b border-white/10'
						)}
						onClick={() =>
							setThemePanel((p) =>
								p === 'buttons' ? null : 'buttons'
							)
						}
					>
						<div className="flex items-center gap-3">
							<span className="inline-flex shrink-0 text-white">
								<ButtonsIcon width={32} height={32} />
							</span>
							<span className="flex items-center gap-2">
								{__('Buttons', 'doublescale')}
								{!isProActive ? (
									<div className="rounded-full bg-[#FAEADF] p-1">
										<PremiumIcon width={16} height={16} />
									</div>
								) : null}
							</span>
						</div>
						{themePanel === 'buttons' ? (
							<ChevronDown className="h-6 w-6 shrink-0 text-white" />
						) : (
							<ChevronRight className="h-6 w-6 shrink-0 text-white" />
						)}
					</button>
					{themePanel === 'buttons' && (
						<div className={themeAccordionBodyClass}>
							<ThemeButtonsExpanded />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
export default GlobalEmailSettings;
