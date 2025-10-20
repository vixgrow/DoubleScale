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

const BuilderContent: React.FC = () => {
	const dispatch = useDispatch();
	const [sidebarCloseTrigger, setSidebarCloseTrigger] = useState(0);

	const existingTemplateData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('template'),
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

	useEffect(() => {
		const loadTemplateData = async () => {
			// Reset builder state first to ensure clean slate
			dispatch(STORE_KEY).resetBuilder();

			if (!existingTemplateData?.template_id) {
				return;
			}

			try {
				const { getTemplate } = await import('./api/templates');
				const template = await getTemplate(
					existingTemplateData.template_id
				);
				const emailBody = template.email_body;

				if (emailBody?.type === 'builder' && emailBody.value) {
					const { sections, globalSettings, buttonSettings } =
						emailBody.value;

					// Load sections
					if (sections && sections.length > 0) {
						dispatch(STORE_KEY).setBuilderState(sections);
					}

					// Load global settings
					if (globalSettings) {
						dispatch(STORE_KEY).updateGlobalSettings(
							globalSettings
						);
					}

					// Load button settings if they exist
					if (buttonSettings) {
						// Update each button type's settings
						Object.entries(buttonSettings).forEach(
							([buttonType, settings]) => {
								dispatch(STORE_KEY).updateButtonSettings(
									buttonType,
									settings
								);
							}
						);
					}
				}
			} catch (error) {
				console.error('Failed to load template:', error);
			}
		};

		loadTemplateData();

		// Cleanup function: reset builder when component unmounts
		return () => {
			dispatch(STORE_KEY).resetBuilder();
		};
	}, [existingTemplateData?.template_id, dispatch]);

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
				body:has(#quillcrm-email-builder),
				html:has(#quillcrm-email-builder) {
					overflow: hidden !important;
				}

				/* Increase z-index for all Radix UI portals when used in builder */
				body:has(#quillcrm-email-builder) [data-radix-portal] {
					z-index: 100020 !important;
				}
				
				/* Specific overrides for dialog/popover content */
				body:has(#quillcrm-email-builder) [role="dialog"],
				body:has(#quillcrm-email-builder) [role="alertdialog"],
				body:has(#quillcrm-email-builder) [data-radix-popper-content-wrapper] {
					z-index: 100021 !important;
				}
			`}</style>
			<div
				id="quillcrm-email-builder"
				className="flex flex-col fixed inset-0 bg-primary-foreground overflow-hidden"
				style={{
					zIndex: 100000,
					width: '100vw',
					height: '100vh',
				}}
			>
				<Header />
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
						<Sidebar sidebarCloseTrigger={sidebarCloseTrigger} />
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

const Builder: React.FC = () => {
	return <BuilderContent />;
};

export default Builder;
