/**
 * external dependencies
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
	DndContext,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
	TouchSensor,
	KeyboardSensor,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
/**
 * internal dependencies
 */
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BlockEditor from './components/BlockEditor';
import DragOverlayRenderer from './components/DragOverlayRenderer';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_KEY } from '../stores/email-builder/constants';
import { useButtonSettings } from './hooks/useButtonSettings';
import { useCollisionDetection } from './hooks/useCollisionDetection';
import { useDragHandlers } from './hooks/useDragHandlers';
import {
	EmailSection,
	GlobalSettings,
	ButtonSettings,
	ButtonType,
} from './types/common';

export interface BuilderData {
	sections: EmailSection[];
	globalSettings: GlobalSettings;
	buttonSettings: Record<ButtonType, ButtonSettings>;
}

export interface BuilderProps {
	initialData?: BuilderData;
	onSave?: (data: BuilderData) => Promise<void>;
	onClose?: () => void;
	autoSave?:
		| boolean
		| {
				enabled: boolean;
				interval?: number;
		  };
	handleNavigate?: (href: string) => void;
}

const BuilderContent: React.FC<BuilderProps> = ({
	initialData,
	onSave,
	onClose,
	autoSave = true,
	handleNavigate,
}) => {
	const dispatch = useDispatch();
	const [sidebarCloseTrigger, setSidebarCloseTrigger] = useState(0);
	const [templatesRefreshTrigger, setTemplatesRefreshTrigger] = useState(0);

	// Parse autoSave prop into enabled/interval
	const autoSaveConfig =
		typeof autoSave === 'boolean'
			? { enabled: autoSave, interval: 10000 }
			: {
					enabled: autoSave.enabled,
					interval: autoSave.interval ?? 10000,
				};

	const existingTemplateData = useSelect(
		(select: any) => select('doublescale/campaign').getStepData('template'),
		[]
	);

	useButtonSettings();

	const customCollisionDetection = useCollisionDetection();

	const onDragEndCallback = useCallback(() => {
		// Trigger sidebar close after drop
		setSidebarCloseTrigger((prev) => prev + 1);
	}, []);

	const { activeItem, handleDragStart, handleDragEnd } =
		useDragHandlers(onDragEndCallback);

	// Handle opening global settings by clearing selection
	const handleOpenGlobalSettings = () => {
		dispatch(STORE_KEY).clearSelection();
	};

	// Function to load template data
	const loadTemplateData = useCallback(async () => {
		if (initialData) {
			dispatch(STORE_KEY).setLoading(true);
			dispatch(STORE_KEY).resetBuilder();

			const { sections, globalSettings, buttonSettings } = initialData;

			if (sections?.length) {
				dispatch(STORE_KEY).setBuilderState(sections);
			}
			if (globalSettings) {
				dispatch(STORE_KEY).updateGlobalSettings(globalSettings);
			}
			if (buttonSettings) {
				Object.entries(buttonSettings).forEach(([type, settings]) => {
					dispatch(STORE_KEY).updateButtonSettings(type, settings);
				});
			}

			// Set loading to false after a brief delay to ensure UI updates
			setTimeout(() => {
				dispatch(STORE_KEY).setLoading(false);
			}, 100);
			return;
		}

		// Load from campaign template if available
		if (!existingTemplateData?.template_id) {
			dispatch(STORE_KEY).resetBuilder();
			return;
		}

		const loadTemplate = async () => {
			try {
				dispatch(STORE_KEY).setLoading(true);
				const { getTemplate } = await import('./api/templates');
				const template = await getTemplate(
					existingTemplateData.template_id
				);

				const body =
					typeof template.body === 'string'
						? JSON.parse(template.body)
						: template.body;

				if (body?.type === 'builder' && body.value) {
					// Reset before loading template data
					dispatch(STORE_KEY).resetBuilder();

					const { sections, globalSettings, buttonSettings } =
						body.value;

					if (sections?.length) {
						dispatch(STORE_KEY).setBuilderState(sections);
					}
					if (globalSettings) {
						dispatch(STORE_KEY).updateGlobalSettings(
							globalSettings
						);
					}
					if (buttonSettings) {
						Object.entries(buttonSettings).forEach(
							([type, settings]) => {
								dispatch(STORE_KEY).updateButtonSettings(
									type,
									settings
								);
							}
						);
					}
				} else {
					dispatch(STORE_KEY).resetBuilder();
				}
			} catch (error) {
				console.error('Failed to load template:', error);
				// If template loading fails, start fresh
				dispatch(STORE_KEY).resetBuilder();
			} finally {
				// Always set loading to false when done
				dispatch(STORE_KEY).setLoading(false);
			}
		};

		loadTemplate();
	}, [initialData, existingTemplateData?.template_id, dispatch]);

	// Initial load
	useEffect(() => {
		loadTemplateData();
	}, [loadTemplateData]);

	// Handle visibility change to refetch when user returns to tab
	useEffect(() => {
		const handleVisibilityChange = () => {
			// Only refetch if tab becomes visible and we have template data to load
			if (
				!document.hidden &&
				(existingTemplateData?.template_id || initialData)
			) {
				loadTemplateData();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange
			);
		};
	}, [loadTemplateData, existingTemplateData?.template_id, initialData]);

	// Cleanup: Reset builder state when component unmounts
	useEffect(() => {
		return () => {
			// Clean up the store when component unmounts
			dispatch(STORE_KEY).resetBuilder();
		};
	}, [dispatch]);

	// Disable scrolling on the background page when builder is mounted
	useEffect(() => {
		// Save original overflow values
		const originalOverflow = document.body.style.overflow;
		const originalHTMLOverflow = document.documentElement.style.overflow;

		// Disable scrolling
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';

		// Re-enable scrolling on cleanup
		return () => {
			document.body.style.overflow = originalOverflow;
			document.documentElement.style.overflow = originalHTMLOverflow;
		};
	}, []);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor)
	);

	// Custom drop animation to make items disappear after drop (no return animation)
	const dropAnimation = {
		duration: 0, // Instant disappear, no animation back to original position
		easing: 'ease',
	};

	return (
		<>
			{/* Builder-specific styles */}
			<style>{`
				/* Hide background scrollbars when builder is active */
				body:has(#doublescale-email-builder),
				html:has(#doublescale-email-builder) {
					overflow: hidden !important;
				}

				/* Increase z-index for all Radix UI portals when used in builder */
				body:has(#doublescale-email-builder) [data-radix-portal] {
					z-index: 160020 !important;
				}
				
				/* Specific overrides for dialog/popover content */
				body:has(#doublescale-email-builder) [role="dialog"],
				body:has(#doublescale-email-builder) [role="alertdialog"],
				body:has(#doublescale-email-builder) [data-radix-popper-content-wrapper] {
					z-index: 160021 !important;
				}
			`}</style>
			<div
				id="doublescale-email-builder"
				className="flex flex-col fixed inset-0 bg-primary-foreground overflow-hidden"
				style={{
					zIndex: 160000,
					width: '100vw',
					height: '100vh',
				}}
			>
				<Header
					onSave={onSave}
					onClose={onClose}
					autoSaveEnabled={autoSaveConfig.enabled}
					autoSaveInterval={autoSaveConfig.interval}
					onTemplatesSaved={() =>
						setTemplatesRefreshTrigger((prev) => prev + 1)
					}
					handleNavigate={handleNavigate}
				/>
				<div
					className="flex flex-1 overflow-hidden"
					style={{ backgroundColor: '#e6eff7' }}
				>
					<DndContext
						sensors={sensors}
						collisionDetection={customCollisionDetection}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
						modifiers={[snapCenterToCursor]}
					>
						<Sidebar
							sidebarCloseTrigger={sidebarCloseTrigger}
							templatesRefreshKey={templatesRefreshTrigger}
							openGlobalSettings={handleOpenGlobalSettings}
						/>
						<Canvas />

						<DragOverlay dropAnimation={dropAnimation}>
							<DragOverlayRenderer activeItem={activeItem} />
						</DragOverlay>
					</DndContext>
					<BlockEditor />
				</div>
			</div>
		</>
	);
};

const Builder: React.FC<BuilderProps> = (props) => {
	return <BuilderContent {...props} />;
};

export default Builder;
