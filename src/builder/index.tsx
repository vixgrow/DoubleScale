/**
 * external dependencies
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import DragOverlayRenderer from './components/DragOverlayRenderer';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_KEY } from '../stores/email-builder/constants';
import {
	useButtonSettings,
	getButtonSettingsVersion,
} from './hooks/useButtonSettings';
import { useCollisionDetection } from './hooks/useCollisionDetection';
import { useDragHandlers } from './hooks/useDragHandlers';
import {
	EmailSection,
	GlobalSettings,
	ButtonSettings,
	ButtonType,
	EmailAttachment,
} from './types/common';
import { DialogLayerContext } from '@/components/ui/dialog-layer-context';

export interface BuilderData {
	sections: EmailSection[];
	globalSettings: GlobalSettings;
	buttonSettings: Record<ButtonType, ButtonSettings>;
	attachments?: EmailAttachment[];
}

// The email builder canvas needs desktop real estate; below 1024px we show a
// notice instead of the (unusable) drag-and-drop surface.
function useIsBelowDesktop() {
	const [isBelowDesktop, setIsBelowDesktop] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia('(max-width: 1023px)');
		const onChange = () => setIsBelowDesktop(mql.matches);
		mql.addEventListener('change', onChange);
		setIsBelowDesktop(mql.matches);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return isBelowDesktop;
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
	/** When true (e.g. Pro OpenBuilder “pre-built templates” path), open My Templates in the sidebar on mount. */
	openTemplates?: boolean;
	/**
	 * When set, shows "Send test email" while the builder is embedded (onSave
	 * mode) — e.g. the automation "Send Email" action. Supplies the subject/from
	 * values that accompany the current builder content.
	 */
	getTestEmailContext?: () => {
		subject?: string;
		from_name?: string;
		from_email?: string;
		reply_to?: string;
	};
}

const BuilderContent: React.FC<BuilderProps> = ({
	initialData,
	onSave,
	onClose,
	autoSave = true,
	handleNavigate,
	openTemplates = false,
	getTestEmailContext,
}) => {
	const dispatch = useDispatch();
	const [sidebarCloseTrigger, setSidebarCloseTrigger] = useState(0);
	const [templatesRefreshTrigger, setTemplatesRefreshTrigger] = useState(0);
	const [overlayLayerEl, setOverlayLayerEl] =
		useState<HTMLDivElement | null>(null);
	const hasLoadedTemplateRef = useRef(false);
	const isBelowDesktop = useIsBelowDesktop();

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

	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	);

	const campaignLoading = useSelect(
		(select: any) => select('doublescale/campaign').isLoading(),
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

	const hydrateBuilder = useCallback(
		(data: BuilderData) => {
			dispatch(STORE_KEY).setLoading(true);
			dispatch(STORE_KEY).resetBuilder();

			const { sections, globalSettings, buttonSettings, attachments } = data;

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
			if (attachments) {
				dispatch(STORE_KEY).setAttachments(attachments);
			}

			setTimeout(() => dispatch(STORE_KEY).setLoading(false), 100);
		},
		[dispatch]
	);

	// Load template once: session (email-templates step) → parent initialData → campaign template API
	const loadTemplateData = useCallback(async () => {
		if (hasLoadedTemplateRef.current) {
			return;
		}

		const campaignId = campaign?.id;
		const storageKey = campaignId
			? `doublescale_campaign_builder_initial_${campaignId}`
			: null;
		const pendingData = storageKey
			? sessionStorage.getItem(storageKey)
			: null;

		if (pendingData) {
			try {
				const data = JSON.parse(pendingData) as BuilderData;
				sessionStorage.removeItem(storageKey!);
				hydrateBuilder(data);
				hasLoadedTemplateRef.current = true;
				return;
			} catch (e) {
				console.error('Failed to parse pending template data:', e);
			}
		}

		if (initialData?.sections?.length) {
			hydrateBuilder(initialData);
			hasLoadedTemplateRef.current = true;
			return;
		}

		const templateId =
			campaign?.settings?.template_ids?.[0] ??
			existingTemplateData?.template_id;

		// Wait until campaign fetch finishes so we don't reset to empty on refresh.
		if (campaignId && campaignLoading) {
			return;
		}

		if (!templateId) {
			if (campaignId && campaign) {
				dispatch(STORE_KEY).resetBuilder();
				hasLoadedTemplateRef.current = true;
			}
			return;
		}

		const loadTemplate = async () => {
			const versionBeforeFetch = getButtonSettingsVersion();

			try {
				dispatch(STORE_KEY).setLoading(true);
				const { getTemplate } = await import('./api/templates');
				const template = await getTemplate(templateId);

				if (getButtonSettingsVersion() !== versionBeforeFetch) {
					return;
				}

				const body =
					typeof template.body === 'string'
						? JSON.parse(template.body)
						: template.body;

				if (body?.type === 'builder' && body.value) {
					const builderData = body.value as BuilderData;
					if (
						!builderData.attachments?.length &&
						template.settings?.attachments?.length
					) {
						builderData.attachments = template.settings.attachments;
					}
					hydrateBuilder(builderData);
				} else {
					dispatch(STORE_KEY).resetBuilder();
				}
			} catch (error) {
				console.error('Failed to load template:', error);
				dispatch(STORE_KEY).resetBuilder();
			} finally {
				dispatch(STORE_KEY).setLoading(false);
				hasLoadedTemplateRef.current = true;
			}
		};

		loadTemplate();
	}, [
		initialData,
		existingTemplateData?.template_id,
		campaign,
		campaign?.id,
		campaign?.settings?.template_ids,
		campaignLoading,
		dispatch,
		hydrateBuilder,
	]);

	// Parent may pass initialData after async fetch (e.g. refresh on builder tab).
	useEffect(() => {
		if (hasLoadedTemplateRef.current) {
			return;
		}
		if (!initialData?.sections?.length) {
			return;
		}
		hydrateBuilder(initialData);
		hasLoadedTemplateRef.current = true;
	}, [initialData, hydrateBuilder]);

	// Initial load
	useEffect(() => {
		loadTemplateData();
	}, [loadTemplateData]);

	// Disabled: refetch on tab visibility caused template to revert to stale data

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

				/*
				 * The builder shell is z-index 160030 (campaign tab and automation
				 * portal alike). Dialogs, popovers, and wp.media portal to <body> at
				 * the default layer (~51 / 160000) and would render behind it.
				 * Raise those overlays whenever the builder is open. Keep the
				 * automation editor below the canvas so it cannot cover the builder.
				 */
				body:has(#doublescale-email-builder) [data-doublescale-dialog-layer]:not(:has(#doublescale-automation-editor-dialog)) {
					z-index: 160050 !important;
				}

				body:has(#doublescale-email-builder) [data-radix-popper-content-wrapper] {
					z-index: 2000000 !important;
					pointer-events: auto !important;
				}

				body:has(#doublescale-email-builder) .media-modal-backdrop {
					z-index: 160080 !important;
					pointer-events: auto !important;
				}

				body:has(#doublescale-email-builder) .media-modal {
					z-index: 160090 !important;
					pointer-events: auto !important;
				}
			`}</style>
			<DialogLayerContext.Provider value={overlayLayerEl}>
				<div
					ref={setOverlayLayerEl}
					id="doublescale-email-builder-layer"
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 160030,
						width: '100vw',
						height: '100vh',
						pointerEvents: 'auto',
					}}
				>
					<div
						id="doublescale-email-builder"
						className="flex h-full flex-col bg-primary-foreground overflow-hidden"
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
							getTestEmailContext={getTestEmailContext}
						/>
						{isBelowDesktop ? (
							<div
								className="flex flex-1 items-center justify-center overflow-auto p-6"
								style={{ backgroundColor: '#e6eff7' }}
							>
								<p className="max-w-md text-center text-base font-medium text-foreground">
									{__(
										'The email builder is available on desktop only. Please open it on a larger screen (1024px or wider) to start designing.',
										'doublescale'
									)}
								</p>
							</div>
						) : (
							<div
								className="flex flex-1 overflow-hidden"
								style={{ backgroundColor: '#e6eff7' }}
							>
								<DndContext
									sensors={sensors}
									collisionDetection={
										customCollisionDetection
									}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
									modifiers={[snapCenterToCursor]}
								>
									<Sidebar
										sidebarCloseTrigger={
											sidebarCloseTrigger
										}
										openGlobalSettings={
											handleOpenGlobalSettings
										}
										openTemplatesOnMount={openTemplates}
									/>
									<Canvas />

									<DragOverlay
										dropAnimation={dropAnimation}
									>
										<DragOverlayRenderer
											activeItem={activeItem}
										/>
									</DragOverlay>
								</DndContext>
							</div>
						)}
					</div>
				</div>
			</DialogLayerContext.Provider>
		</>
	);
};

const Builder: React.FC<BuilderProps> = (props) => {
	return <BuilderContent {...props} />;
};

export default Builder;
