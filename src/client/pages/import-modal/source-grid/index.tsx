/**
 * wordpress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { InstallIcon } from '@doublescale/components';
import { cn } from '@/lib/utils';
import { useImportContext } from '../contexts';
import ConfigAPI from '@doublescale/config';
import {
	buildImporterSourcesList,
	getImporterDisabledInstallPath,
	getSourceSubtitle,
	type ImporterSourceItem,
} from '../source-definitions';

const DisabledImporterInstallButton: React.FC<{ slug: string }> = ({
	slug,
}) => {
	const installPath = getImporterDisabledInstallPath(slug);
	if (!installPath) {
		return null;
	}
	return (
		<Button
			size="sm"
			variant="secondary"
			className="h-8 shrink-0 rounded-lg px-2.5 text-[10px] font-semibold uppercase tracking-wide"
			onClick={(e) => {
				e.stopPropagation();
				const base = ConfigAPI.getAdminUrl() || '';
				window.open(
					`${base}${installPath}`,
					'_blank',
					'noopener,noreferrer'
				);
			}}
		>
			<InstallIcon />
			{__('Install', 'doublescale')}
		</Button>
	);
};

const SourceGrid: React.FC = () => {
	const { state, dispatch } = useImportContext();
	const { source, importing } = state;
	const sources = buildImporterSourcesList();

	const applySource = (newSource: string) => {
		if (importing) return;
		dispatch({ type: 'SET_SOURCE_DATA', payload: null });
		dispatch({ type: 'SET_IS_FETCHING', payload: false });
		dispatch({ type: 'SET_SOURCE', payload: newSource });
		dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
		dispatch({ type: 'SET_VALUES', payload: {} });
		dispatch({ type: 'SET_CREDENTIALS', payload: {} });
		if (newSource !== 'csv') {
			dispatch({ type: 'SET_FILE_DATA', payload: null });
		}
	};

	const handleContinue = () => {
		if (!source || importing) return;
		dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
		dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
				<div className="mx-auto max-w-5xl">
					<p className="mb-5 text-sm leading-relaxed text-muted-foreground sm:mb-6 sm:text-left">
						{__(
							'Select a platform. CSV and API-connected sources use three steps (source → connect or upload → map). Other sources use two steps.',
							'doublescale'
						)}
					</p>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
						{sources.map((s: ImporterSourceItem) => {
							const isSelected = source === s.value;
							const isLocked = importing && !isSelected;
							return (
								<div
									key={s.value}
									role="button"
									tabIndex={s.disabled || importing ? -1 : 0}
									onClick={() =>
										!s.disabled && !importing && applySource(s.value)
									}
									onKeyDown={(e) => {
										if (
											(e.key === 'Enter' || e.key === ' ') &&
											!s.disabled &&
											!importing
										) {
											e.preventDefault();
											applySource(s.value);
										}
									}}
									className={cn(
										'group relative flex flex-col rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-5',
										isSelected &&
											'border-primary shadow-md ring-2 ring-primary/25',
										!s.disabled &&
											!isLocked &&
											'cursor-pointer',
										!isSelected &&
											!s.disabled &&
											!isLocked &&
											'hover:border-primary/40 hover:shadow-md',
										s.disabled &&
											'cursor-not-allowed border-dashed border-muted-foreground/30 bg-muted/15 opacity-[0.72]',
										isLocked && 'cursor-not-allowed opacity-50'
									)}
								>
									<div className="mb-4 flex items-start justify-between gap-2">
										<div
											className={cn(
												'flex h-14 w-14 items-center justify-center rounded-xl border bg-muted/40 transition-colors sm:h-16 sm:w-16',
												isSelected &&
													'border-primary/30 bg-primary/[0.08]'
											)}
										>
											{s.icon}
										</div>
										{s.disabled && (
											<DisabledImporterInstallButton slug={s.value} />
										)}
									</div>
									<h3 className="text-base font-semibold leading-snug text-foreground">
										{s.label}
									</h3>
									<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
										{getSourceSubtitle(s)}
									</p>
									{isSelected && (
										<div className="pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary shadow-sm ring-2 ring-background" />
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="shrink-0 border-t border-border/60 bg-muted/10 px-4 py-4 sm:px-8 sm:py-5">
				<div className="mx-auto flex max-w-5xl flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center sm:gap-4">
					<p className="flex-1 text-left text-sm leading-snug text-muted-foreground">
						{!source
							? __('Pick a source above to enable continue.', 'doublescale')
							: sprintf(
									/* translators: %s: selected importer name */
									__('Selected: %s', 'doublescale'),
									sources.find((x) => x.value === source)?.label ?? source
								)}
					</p>
					<Button
						size="lg"
						className="min-w-[200px] shrink-0 gap-2 bg-violet-400 text-white hover:bg-violet-500 sm:min-w-[220px]"
						disabled={!source || importing}
						onClick={handleContinue}
					>
						{__('Continue', 'doublescale')}
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SourceGrid;
