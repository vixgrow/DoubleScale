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
import { BackgroundIcon, InfoIcon, ButtonsIcon } from '@doublescale/components';
import { cn } from '@/lib/utils';
import { STORE_KEY } from '../../stores/email-builder/constants';
import LockedButtons from './LockedButtons';
import BackgroundSettings from './BackgroudSettings';

type ThemePanel = 'background' | 'buttons' | null;

interface GlobalEmailSettingsProps {
	onShowBackgroundSettings: () => void;
	onShowButtonSettings: () => void;
	/**
	 * When true, render with dark sidebar styling (light text on dark
	 * gradient background). Otherwise fall back to the legacy light
	 * styling for compatibility.
	 */
	inline?: boolean;
}

const GlobalEmailSettings: React.FC<GlobalEmailSettingsProps> = ({
	onShowBackgroundSettings,
	onShowButtonSettings,
	inline = false,
}) => {
	const dispatch = useDispatch();
	const [themePanel, setThemePanel] = useState<ThemePanel>(null);

	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);

	const ButtonSettingsContent = applyFilters(
		'doublescale_builder_button_settings',
		LockedButtons,
		{ onShowButtonSettings, inline }
	) as React.ComponentType<any>;

	const ThemeButtonsExpanded = applyFilters(
		'doublescale_builder_theme_buttons_expanded',
		LockedButtons
	) as React.ComponentType<{ embedded?: boolean; inline?: boolean }>;

	const themeRowClass = cn(
		'flex w-full cursor-pointer items-center justify-between px-4 py-4 text-sm transition-colors',
		inline
			? 'rounded-xl text-white hover:bg-white/[0.16]'
			: 'rounded-lg border border-border/60 text-foreground hover:bg-muted/40'
	);

	const themeAccordionTriggerClass = cn(
		'flex w-full items-center justify-between px-4 py-4 text-left text-sm text-white transition-colors hover:bg-white/[0.08]'
	);

	const themeAccordionShell = cn(
		'overflow-hidden rounded-xl border border-white/10',
		'bg-[rgba(255,255,255,0.05)]'
	);

	const themeAccordionBodyClass =
		'border-t border-white/10 px-4 py-4 max-h-[min(60vh,520px)] overflow-y-auto custom-scrollbar';

	const openBackground = () => {
		if (!inline) {
			onShowBackgroundSettings();
			return;
		}
		setThemePanel((p) => (p === 'background' ? null : 'background'));
	};

	const openButtons = () => {
		if (!inline) {
			onShowButtonSettings();
			return;
		}
		setThemePanel((p) => (p === 'buttons' ? null : 'buttons'));
	};

	return (
		<div className={cn('grid', inline ? 'gap-6' : 'gap-5')}>
			<div className="flex flex-col gap-2">
				<div
					className={cn(
						'text-sm font-medium',
						inline ? 'text-white' : 'text-sm text-[#333333]'
					)}
				>
					{__('Canvas Width', 'doublescale')}
				</div>
				<Input
					type="number"
					min={1}
					className={cn(
						'h-11 w-full rounded-lg text-base shadow-none',
						inline
							? '!text-white !border-none !shadow-none'
							: 'border border-input bg-transparent'
					)}
					style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
					placeholder={__('Canvas Width', 'doublescale')}
					value={globalSettings.canvasWidth}
					onChange={(e) =>
						dispatch(STORE_KEY).updateGlobalSettings({
							canvasWidth:
								Number.parseInt(e.target.value, 10) || 900,
						})
					}
				/>
				<div
					className={cn(
						'flex items-center gap-2',
						inline ? 'text-white' : 'text-muted-foreground'
					)}
				>
					<InfoIcon />
					<p className="text-sm">
						{__(
							'We recommend using a 800-900px width',
							'doublescale'
						)}
					</p>
				</div>
			</div>

			<div
				className={cn(
					'h-px',
					inline ? 'bg-white' : 'bg-[#E5E7EB]'
				)}
			/>

			<div className="flex flex-col gap-4">
				<div
					className={cn(
						'text-sm',
						inline ? 'text-white' : 'text-sm text-[#333333]'
					)}
				>
					{__('Theme settings', 'doublescale')}
				</div>

				{inline ? (
					<>
						<div className={themeAccordionShell}>
							<button
								type="button"
								className={cn(
									themeAccordionTriggerClass,
									themePanel === 'background' &&
									'border-b border-white/10'
								)}
								style={{
									backgroundColor:
										'rgba(255, 255, 255, 0.05)',
								}}
								onClick={openBackground}
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
									<BackgroundSettings
										embedded
										inline
									/>
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
								style={{
									backgroundColor:
										'rgba(255, 255, 255, 0.05)',
								}}
								onClick={openButtons}
							>
								<div className="flex items-center gap-3">
									<span className="inline-flex shrink-0 text-white">
										<ButtonsIcon width={32} height={32} />
									</span>
									<span>{__('Buttons', 'doublescale')}</span>
								</div>
								{themePanel === 'buttons' ? (
									<ChevronDown className="h-6 w-6 shrink-0 text-white" />
								) : (
									<ChevronRight className="h-6 w-6 shrink-0 text-white" />
								)}
							</button>
							{themePanel === 'buttons' && (
								<div className={themeAccordionBodyClass}>
									<ThemeButtonsExpanded
										embedded
										inline
									/>
								</div>
							)}
						</div>
					</>
				) : (
					<>
						<button
							type="button"
							className={themeRowClass}
							onClick={onShowBackgroundSettings}
							style={{
								backgroundColor: 'rgba(255, 255, 255, 0.05)',
							}}
						>
							<div className="flex items-center gap-3">
								<span
									className={cn(
										'inline-flex shrink-0',
										inline
											? 'text-white'
											: 'text-[#616161]'
									)}
								>
									<BackgroundIcon width={32} height={32} />
								</span>
								<span>{__('Background', 'doublescale')}</span>
							</div>
							<ChevronRight
								className={cn(
									'h-6 w-6 shrink-0',
									inline
										? 'text-white'
										: 'text-muted-foreground'
								)}
							/>
						</button>
						<ButtonSettingsContent
							onShowButtonSettings={onShowButtonSettings}
							inline={inline}
						/>
					</>
				)}
			</div>
		</div>
	);
};
export default GlobalEmailSettings;
