/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
/**
 * external dependencies
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { blocksRegistry } from '../blocks/BlockRegister';
import { GlobalEmailSettingsIcon } from '@quillcrm/components';
import GlobalEmailSettings from './GlobalEmailSettings';
import BackgroundSettings from './BackgroudSettings';
import ButtonSettings from './ButtonSettings';

type ViewState = 'main' | 'background' | 'button';

const BlockEditor: React.FC = () => {
	const dispatch = useDispatch();
	const [currentView, setCurrentView] = useState<ViewState>('main');

	const selectedBlock = useSelect(
		(select) => select(STORE_KEY).getSelectedBlock(),
		[]
	);

	const selectedBlockId = useSelect(
		(select) => select(STORE_KEY).getSelectedBlockId(),
		[]
	);

	const handlePropsChange = (newProps: Record<string, any>) => {
		if (selectedBlock) {
			dispatch(STORE_KEY).updateBlock(selectedBlock.id, newProps);
		}
	};

	// Determine what to show in the header
	const isBlockSelected = !!selectedBlockId;
	const blockDefinition = selectedBlock
		? blocksRegistry[selectedBlock.type]
		: null;

	// Handle back navigation from settings
	const handleBackFromSettings = () => {
		setCurrentView('main');
	};

	return (
		<div className="w-80 bg-background border-l border-border rounded-l-xl">
			{/* Show background settings, button settings, or regular content */}
			{currentView === 'background' ? (
				<BackgroundSettings onBack={handleBackFromSettings} />
			) : currentView === 'button' ? (
				<ButtonSettings onBack={handleBackFromSettings} />
			) : (
				<>
					<div className="flex items-center justify-between border-b-2 px-4 pt-5 pb-4">
						<div className="flex items-center gap-2">
							<div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg text-white">
								{isBlockSelected && blockDefinition?.icon ? (
									<blockDefinition.icon />
								) : (
									<GlobalEmailSettingsIcon />
								)}
							</div>
							<h3 className="text-base font-semibold text-primary">
								{isBlockSelected && blockDefinition?.name
									? `${blockDefinition.name} ${__('Settings', 'quillcrm')}`
									: __('Global Email Settings', 'quillcrm')}
							</h3>
						</div>
						{isBlockSelected && (
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

					<div className="space-y-4 p-4">
						{isBlockSelected ? (
							// Show block-specific editor
							selectedBlock && blockDefinition?.Editor ? (
								<blockDefinition.Editor
									props={selectedBlock.props}
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

					{isBlockSelected && selectedBlock && (
						<div className="mt-6 pt-4 px-4 border-t border-border">
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
				</>
			)}
		</div>
	);
};

export default BlockEditor;
