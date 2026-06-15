/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { InstallIcon } from '@doublescale/components';
import CheckTrue from '@doublescale/shared/icons/checkTrue';
import { cn } from '@/lib/utils';
import ConfigAPI from '@doublescale/config';
import { useImportContext } from '../contexts';
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
			className="mt-2 h-8 shrink-0 rounded-lg px-2.5 text-[10px] font-semibold uppercase tracking-wide"
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

	return (
		<div className="import-modal__sources-panel shrink-0">
			<div className="import-modal__sources-grid max-sm:grid-cols-1 max-lg:grid-cols-3">
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
									'import-modal__source-card group relative',
									isSelected && 'is-selected',
									s.disabled && 'is-disabled',
									isLocked && 'is-locked cursor-not-allowed opacity-50',
									!s.disabled &&
										!isLocked &&
										'cursor-pointer'
								)}
							>
								{isSelected && (
									<span className="import-modal__selected-badge">
										<CheckTrue width={22} height={22} />
									</span>
								)}
								<div className="import-modal__source-icon">
									{s.icon}
								</div>
								<h3 className="text-base font-semibold leading-7 text-foreground">
									{s.label}
								</h3>
								<p className=" line-clamp-2 text-base leading-7 text-muted-foreground">
									{getSourceSubtitle(s)}
								</p>
								{s.disabled && (
									<DisabledImporterInstallButton slug={s.value} />
								)}
							</div>
						);
				})}
			</div>
		</div>
	);
};

export default SourceGrid;
