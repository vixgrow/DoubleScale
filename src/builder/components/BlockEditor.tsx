/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import React from 'react';
import { X } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useRegisteredBlocks } from '@/stores/blocks-registry';
import { getBlockDefinition } from '../blocks/blockRegistryUtils';
import {
	GlobalEmailSettingsIcon,
	LayoutSettingsIcon,
} from '@doublescale/components';
import GlobalEmailSettings from './GlobalEmailSettings';
import LayoutSettings, {
	type LayoutSettingsData,
} from '../blocks/layout/LayoutSettings';

interface BlockEditorProps {
	/**
	 * Render inline inside the sidebar (no surrounding card border, dark
	 * theme). When set, the editor is part of the sidebar's "Settings"
	 * tab. When omitted/false, the editor is rendered as an overlay panel
	 * for a selected block/section.
	 */
	inline?: boolean;
	/**
	 * When provided, the editor shows a top-right X that calls this
	 * handler. Typically used to clear the current selection so the user
	 * is returned to the main sidebar.
	 */
	onClose?: () => void;
	/**
	 * Minimal sidebar panel header (title + X, no icon chip). Use with
	 * `inline` + `onClose` when the editor covers the tab content area.
	 */
	panel?: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
	inline,
	onClose,
	panel,
}) => {
	const dispatch = useDispatch();
	const blocksRegistry = useRegisteredBlocks();

	const selectedBlock = useSelect(
		(select) => select(STORE_KEY).getSelectedBlock(),
		[]
	);

	const selectedBlockId = useSelect(
		(select) => select(STORE_KEY).getSelectedBlockId(),
		[]
	);

	const selectedSectionId = useSelect(
		(select) => select(STORE_KEY).getSelectedSectionId(),
		[]
	);

	const selectedColumnId = useSelect(
		(select) => select(STORE_KEY).getSelectedColumnId(),
		[]
	);

	const handlePropsChange = (newProps: Record<string, any>) => {
		if (selectedBlock) {
			dispatch(STORE_KEY).updateBlock(selectedBlock.id, newProps);
		}
	};

	const isBlockSelected = !!selectedBlockId;
	const isColumnSelected =
		!!selectedColumnId && !!selectedSectionId && !selectedBlockId;
	const isSectionSelected =
		!!selectedSectionId && !selectedColumnId && !selectedBlockId;

	const layoutStylesFromSettings = (settings: LayoutSettingsData) => ({
		backgroundColor: settings.backgroundColor,
		backgroundImage: settings.backgroundImage
			? `url(${settings.backgroundImage.url})`
			: undefined,
		backgroundRepeat: settings.backgroundRepeat,
		backgroundSize: settings.backgroundSize,
		backgroundPosition: settings.backgroundPosition,
		padding: `${settings.padding.top}px ${settings.padding.right}px ${settings.padding.bottom}px ${settings.padding.left}px`,
		margin: `${settings.margin.top}px ${settings.margin.right}px ${settings.margin.bottom}px ${settings.margin.left}px`,
	});

	const handleLayoutSettingsChange = (settings: LayoutSettingsData) => {
		if (isColumnSelected && selectedSectionId && selectedColumnId) {
			dispatch(STORE_KEY).updateColumn(
				selectedSectionId,
				selectedColumnId,
				{ styles: layoutStylesFromSettings(settings) }
			);
			return;
		}
		if (isSectionSelected && selectedSectionId) {
			dispatch(STORE_KEY).updateSection(selectedSectionId, {
				styles: layoutStylesFromSettings(settings),
			});
		}
	};

	const {
		block: blockDefinition,
		isUnknown,
		info,
	} = selectedBlock
			? getBlockDefinition(
				selectedBlock.type,
				blocksRegistry,
				blocksRegistry.unknown
			)
			: { block: null, isUnknown: false, info: undefined };

	const editorProps =
		isUnknown && info
			? {
				originalType: info.originalType,
				originalProps: selectedBlock?.props || {},
			}
			: selectedBlock?.props;

	const usePanelHeader = Boolean(inline && panel && onClose);

	/** Settings tab global email view: no title row — content sits under tabs like Figma. */
	const isGlobalSettingsInlineMain =
		inline &&
		!usePanelHeader &&
		!isBlockSelected &&
		!isSectionSelected &&
		!isColumnSelected;

	const containerClass = cn(
		'h-full flex flex-col overflow-hidden rounded-lg',
		inline
			? 'bg-transparent'
			: 'w-full bg-background'
	);

	return (
		<div
			className={containerClass}
			style={
				!isGlobalSettingsInlineMain
					? { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
					: undefined
			}
		>
			<>
				{!isGlobalSettingsInlineMain && (
					<div
						className={cn(
							'flex flex-shrink-0 items-center justify-between',
							usePanelHeader
								? 'border-b border-white p-4'
								: inline
									? 'px-1 pb-3 pt-2'
									: 'border-b-2 px-4 pb-4 pt-5'
						)}
					>
						{usePanelHeader ? (
							isBlockSelected && blockDefinition?.icon ? (
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<div className="flex shrink-0 items-center justify-center text-white">
										<blockDefinition.icon width={32} height={32} />
									</div>
									<h3 className="min-w-0 text-base font-semibold text-white">
										{blockDefinition?.name
											? `${blockDefinition.name} ${__('Settings', 'doublescale')}`
											: __('Settings', 'doublescale')}
									</h3>
								</div>
							) : (
								<h3 className="min-w-0 flex-1 text-base font-semibold text-white">
									{isBlockSelected && blockDefinition?.name
										? `${blockDefinition.name} ${__('Settings', 'doublescale')}`
										: isColumnSelected
											? __('Column Settings', 'doublescale')
											: isSectionSelected
												? __('Layout Settings', 'doublescale')
												: __('Global Email Settings', 'doublescale')}
								</h3>
							)
						) : (
							<div className="flex items-center gap-2">
								<div
									className={cn(
										'rounded-lg p-2',
										inline
											? 'bg-white/10 text-white'
											: 'bg-gradient-to-r from-primary to-secondary text-white'
									)}
								>
									{isBlockSelected &&
										blockDefinition?.icon ? (
										<blockDefinition.icon />
									) : isSectionSelected || isColumnSelected ? (
										<LayoutSettingsIcon />
									) : (
										<GlobalEmailSettingsIcon />
									)}
								</div>
								<h3
									className={cn(
										'text-base font-semibold',
										inline
											? 'text-white'
											: 'text-primary'
									)}
								>
									{isBlockSelected && blockDefinition?.name
										? `${blockDefinition.name} ${__('Settings', 'doublescale')}`
										: isColumnSelected
											? __('Column Settings', 'doublescale')
											: isSectionSelected
												? __('Layout Settings', 'doublescale')
												: __('Global Email Settings', 'doublescale')}
								</h3>
							</div>
						)}
						{onClose && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								className={cn(
									inline
										? 'text-white hover:bg-white/10 hover:text-white'
										: ''
								)}
								aria-label={__(
									'Close editor',
									'doublescale'
								)}
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				)}

				{usePanelHeader ? (
					<div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar pb-6">
						<div className="px-4">
							<div className="space-y-4 py-4">
								{isBlockSelected ? (
									selectedBlock &&
										blockDefinition?.Editor ? (
										<blockDefinition.Editor
											props={editorProps as any}
											onChange={handlePropsChange}
										/>
									) : (
										<p className="text-muted-foreground">
											{__(
												'No editor available for this block type.',
												'doublescale'
											)}
										</p>
									)
								) : isColumnSelected ? (
									<LayoutSettings
										sectionId={selectedSectionId!}
										columnId={selectedColumnId!}
										onSettingsChange={handleLayoutSettingsChange}
									/>
								) : isSectionSelected ? (
									<LayoutSettings
										sectionId={selectedSectionId}
										onSettingsChange={handleLayoutSettingsChange}
									/>
								) : (
									<GlobalEmailSettings />
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="min-h-0 flex-1 overflow-auto">
						<div
							className={cn(
								'space-y-4',
								isGlobalSettingsInlineMain
									? 'px-0 py-0'
									: inline
										? 'px-1 py-3'
										: 'p-4'
							)}
						>
							{isBlockSelected ? (
								selectedBlock &&
									blockDefinition?.Editor ? (
									<blockDefinition.Editor
										props={editorProps as any}
										onChange={handlePropsChange}
									/>
								) : (
									<p className="text-muted-foreground">
										{__(
											'No editor available for this block type.',
											'doublescale'
										)}
									</p>
								)
							) : isColumnSelected ? (
								<LayoutSettings
									sectionId={selectedSectionId!}
									columnId={selectedColumnId!}
									onSettingsChange={handleLayoutSettingsChange}
								/>
							) : isSectionSelected ? (
								<LayoutSettings
									sectionId={selectedSectionId}
									onSettingsChange={handleLayoutSettingsChange}
								/>
							) : (
								<GlobalEmailSettings />
							)}
						</div>
					</div>
				)}
			</>
		</div>
	);
};

export default BlockEditor;
