/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useRegisteredBlocks } from '../../stores/blocks-registry';
import { getBlockDefinition } from '../blocks/blockRegistryUtils';
import {
	GlobalEmailSettingsIcon,
	LayoutSettingsIcon,
} from '@quillcrm/components';
import GlobalEmailSettings from './GlobalEmailSettings';
import BackgroundSettings from './BackgroudSettings';
import ButtonSettings from './ButtonSettings';
import LayoutSettings from '../blocks/layout/LayoutSettings';

type ViewState = 'main' | 'background' | 'button' | 'layout';

const BlockEditor: React.FC = () => {
	const dispatch = useDispatch();
	const [currentView, setCurrentView] = useState<ViewState>('main');
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

	// Automatically reset view to 'main' when a block or section is selected
	useEffect(() => {
		if (selectedBlockId || selectedSectionId) {
			setCurrentView('main');
		}
	}, [selectedBlockId, selectedSectionId]);

	const handlePropsChange = (newProps: Record<string, any>) => {
		if (selectedBlock) {
			dispatch(STORE_KEY).updateBlock(selectedBlock.id, newProps);
		}
	};

	// Determine what to show in the header
	const isBlockSelected = !!selectedBlockId;
	const isSectionSelected = !!selectedSectionId;

	// Get block definition with fallback to UnknownBlock
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

	// Prepare props for the editor
	const editorProps =
		isUnknown && info
			? {
				originalType: info.originalType,
				originalProps: selectedBlock?.props || {},
			}
			: selectedBlock?.props;

	// Handle back navigation from settings
	const handleBackFromSettings = () => {
		setCurrentView('main');
	};

	return (
		<div className="w-80 bg-background border-l border-border rounded-l-xl h-full flex flex-col overflow-hidden">
			{/* Show background settings, button settings, layout settings, or regular content */}
			{currentView === 'background' ? (
				<BackgroundSettings onBack={handleBackFromSettings} />
			) : currentView === 'button' ? (
				<ButtonSettings onBack={handleBackFromSettings} />
			) : currentView === 'layout' ? (
				<LayoutSettings />
			) : (
				<>
					<div className="flex items-center justify-between border-b-2 px-4 pt-5 pb-4 flex-shrink-0">
						<div className="flex items-center gap-2">
							<div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg text-white">
								{isBlockSelected && blockDefinition?.icon ? (
									<blockDefinition.icon />
								) : isSectionSelected ? (
									<LayoutSettingsIcon />
								) : (
									<GlobalEmailSettingsIcon />
								)}
							</div>
							<h3 className="text-base font-semibold text-primary">
								{isBlockSelected && blockDefinition?.name
									? `${blockDefinition.name} ${__('Settings', 'quillcrm')}`
									: isSectionSelected
										? __('Layout Settings', 'quillcrm')
										: __(
											'Global Email Settings',
											'quillcrm'
										)}
							</h3>
						</div>
						{(isBlockSelected || isSectionSelected) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch(STORE_KEY).clearSelection()
								}
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>

					<div className="flex-1 overflow-auto">
						<div className="space-y-4 p-4">
							{isBlockSelected ? (
								// Show block-specific editor
								selectedBlock && blockDefinition?.Editor ? (
									<blockDefinition.Editor
										props={editorProps as any}
										onChange={handlePropsChange}
									/>
								) : (
									<p className="text-muted-foreground">
										{__(
											'No editor available for this block type.',
											'quillcrm'
										)}
									</p>
								)
							) : isSectionSelected ? (
								// Show LayoutSettings for all sections
								<LayoutSettings
									sectionId={selectedSectionId}
									onSettingsChange={(settings) => {
										// Convert LayoutSettingsData to section styles
										const sectionStyles = {
											backgroundColor:
												settings.backgroundColor,
											backgroundImage:
												settings.backgroundImage
													? `url(${settings.backgroundImage.url})`
													: undefined,
											backgroundRepeat:
												settings.backgroundRepeat,
											backgroundSize:
												settings.backgroundSize,
											backgroundPosition:
												settings.backgroundPosition,
											padding: `${settings.padding.top}px ${settings.padding.right}px ${settings.padding.bottom}px ${settings.padding.left}px`,
										};
										dispatch(STORE_KEY).updateSection(
											selectedSectionId,
											sectionStyles
										);
									}}
								/>
							) : (
								<GlobalEmailSettings
									onShowBackgroundSettings={() =>
										setCurrentView('background')
									}
									onShowButtonSettings={() =>
										setCurrentView('button')
									}
								/>
							)}
						</div>

						{isBlockSelected && selectedBlock && !isUnknown && (
							<div className="my-6 pt-4 px-4 border-t border-border">
								<Button
									variant="destructive"
									size="sm"
									className="w-full"
									onClick={() => {
										dispatch(STORE_KEY).deleteBlock(
											selectedBlock.id
										);
										dispatch(STORE_KEY).clearSelection();
									}}
								>
									{__('Delete Block', 'quillcrm')}
								</Button>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default BlockEditor;
