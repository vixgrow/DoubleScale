import { select, useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { getTemplate, saveTemplate } from '../api/templates';
import { BuilderData } from '../index';

interface UseAutoSaveOptions {
	interval?: number;
	enabled?: boolean;
	customSaveCallback?: (data: BuilderData) => Promise<void>;
}

interface SaveStatus {
	isSaving: boolean;
	lastSaved: Date | null;
	hasUnsavedChanges: boolean;
	error: string | null;
}

export const useAutoSave = (options: UseAutoSaveOptions = {}) => {
	const { interval = 10000, enabled = true, customSaveCallback } = options;

	const [saveStatus, setSaveStatus] = useState<SaveStatus>({
		isSaving: false,
		lastSaved: null,
		hasUnsavedChanges: false,
		error: null,
	});

	const autoSaveTimerRef = useRef<number | null>(null);
	const lastSavedStateRef = useRef<string>('');
	const isMountedRef = useRef(true);
	const hasInitializedRef = useRef(false);
	const initBaselineTimerRef = useRef<number | null>(null);

	// Get current builder state
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);
	const buttonSettings = useSelect(
		(select) => select(STORE_KEY).getAllButtonSettings(),
		[]
	);

	// Get campaign data
	const campaign = useSelect(
		(select) => select('doublescale/campaign').getCampaign(),
		[]
	);

	const { updateCampaign } = useDispatch('doublescale/campaign') as {
		updateCampaign: (payload: {
			settings?: Record<string, unknown>;
		}) => void;
	};

	// Create a serialized version of current state for comparison
	const currentState = JSON.stringify({
		sections,
		globalSettings,
		buttonSettings,
	});

	// Initialize baseline after initial hydration settles to avoid false diffs
	useEffect(() => {
		if (hasInitializedRef.current) {
			return;
		}

		// Require at least sections present to consider the builder hydrated
		if (!sections || sections.length === 0) {
			return;
		}

		// Debounce baseline initialization to the latest hydrated state
		if (initBaselineTimerRef.current) {
			clearTimeout(initBaselineTimerRef.current);
		}
		initBaselineTimerRef.current = window.setTimeout(() => {
			lastSavedStateRef.current = currentState;
			hasInitializedRef.current = true;
			initBaselineTimerRef.current = null;
		}, 50);

		return () => {
			if (initBaselineTimerRef.current) {
				clearTimeout(initBaselineTimerRef.current);
				initBaselineTimerRef.current = null;
			}
		};
	}, [sections, currentState]);

	// Simple: Detect changes after initialization
	useEffect(() => {
		if (!hasInitializedRef.current || !lastSavedStateRef.current) {
			return;
		}

		if (currentState !== lastSavedStateRef.current) {
			setSaveStatus((prev) => ({ ...prev, hasUnsavedChanges: true }));
		}
	}, [currentState]);

	// Save function
	const save = useCallback(async (): Promise<{
		success: boolean;
		templateId: number | null;
	}> => {
		if (!isMountedRef.current) {
			return { success: false, templateId: null };
		}

		// Get fresh state from store when saving (not from closure)
		// This ensures we always save the latest data
		const getFreshState = () => {
			// Access the store directly to get the latest state
			const store = select(STORE_KEY);
			if (!store) {
				// Fallback to currentState if store is not available
				return JSON.parse(currentState);
			}

			const freshSections = store.getSections();
			const freshGlobalSettings = store.getGlobalSettings();
			const freshButtonSettings = store.getAllButtonSettings();

			return {
				sections: freshSections,
				globalSettings: freshGlobalSettings,
				buttonSettings: freshButtonSettings,
			};
		};

		// If customSaveCallback is provided, use it instead of default save logic
		if (customSaveCallback) {
			try {
				setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

				const builderData = getFreshState();

				// Call custom save callback with complete builder data
				await customSaveCallback(builderData);

				if (isMountedRef.current) {
					const now = new Date();
					// Update the saved state reference with the fresh state
					const freshStateString = JSON.stringify(builderData);
					lastSavedStateRef.current = freshStateString;
					setSaveStatus({
						isSaving: false,
						lastSaved: now,
						hasUnsavedChanges: false,
						error: null,
					});
					return { success: true, templateId: null };
				}
				return { success: false, templateId: null };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to save';
				if (isMountedRef.current) {
					setSaveStatus((prev) => ({
						...prev,
						isSaving: false,
						error: errorMessage,
					}));
				}
				console.error('Save error:', error);
				return { success: false, templateId: null };
			}
		}

		// Default save logic (for campaign flow)
		if (!campaign) {
			return { success: false, templateId: null };
		}

		try {
			setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

			// Get fresh builder data from store
			const builderData = getFreshState();

			// Get template ID from campaign settings
			const templateId = campaign.settings?.template_ids?.[0];

			let savedTemplate;

			if (!templateId) {
				// Builder opened from scratch / ready-made layout without a DB template yet.
				// POST /templates/save creates the row and links campaign (see RestTemplateController::save_template).
				savedTemplate = await saveTemplate({
					name:
						(campaign.name && String(campaign.name).trim()) ||
						__('Email Template', 'doublescale'),
					type: 'email',
					body: JSON.stringify({
						type: 'builder',
						value: builderData,
					}),
					campaign_id: campaign.id,
					hidden: true,
				});
				const newId = savedTemplate?.id;
				if (!newId) {
					throw new Error(
						__('Could not create email template for this campaign.', 'doublescale')
					);
				}
				updateCampaign({
					settings: {
						...campaign.settings,
						template_ids: [newId],
					},
				});
			} else {
				// Fetch current template
				const template = await getTemplate(templateId);

				// Save template with updated builder body + campaign_id
				const templateWithCampaignId: typeof template & {
					campaign_id: number;
				} = {
					...template,
					body: JSON.stringify({
						type: 'builder',
						value: builderData,
					}),
					campaign_id: campaign.id,
					hidden: true, // Auto-save should be hidden from user templates
				};

				// Do not send legacy root subject/preview_text — they can overwrite settings.
				delete (templateWithCampaignId as { subject?: string }).subject;
				delete (templateWithCampaignId as { preview_text?: string })
					.preview_text;

				savedTemplate = await saveTemplate(templateWithCampaignId);
			}

			if (isMountedRef.current) {
				const now = new Date();
				// Update the saved state reference with the fresh state
				const freshStateString = JSON.stringify(builderData);
				lastSavedStateRef.current = freshStateString;
				setSaveStatus({
					isSaving: false,
					lastSaved: now,
					hasUnsavedChanges: false,
					error: null,
				});
				return { success: true, templateId: savedTemplate.id ?? null };
			}
			return { success: false, templateId: null };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to save';
			if (isMountedRef.current) {
				setSaveStatus((prev) => ({
					...prev,
					isSaving: false,
					error: errorMessage,
				}));
			}
			console.error('Save error:', error);
			return { success: false, templateId: null };
		}
	}, [campaign, customSaveCallback, updateCampaign]);

	// Auto-save effect
	useEffect(() => {
		if (!enabled || !saveStatus.hasUnsavedChanges) {
			return;
		}

		// Clear existing timer
		if (autoSaveTimerRef.current) {
			clearTimeout(autoSaveTimerRef.current);
		}

		// Set new timer
		autoSaveTimerRef.current = window.setTimeout(() => {
			save();
		}, interval);

		return () => {
			if (autoSaveTimerRef.current) {
				clearTimeout(autoSaveTimerRef.current);
			}
		};
	}, [enabled, saveStatus.hasUnsavedChanges, interval, save]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			if (autoSaveTimerRef.current) {
				clearTimeout(autoSaveTimerRef.current);
			}
		};
	}, []);

	return {
		...saveStatus,
		save,
		markAsSaved: () => {
			lastSavedStateRef.current = currentState;
			setSaveStatus((prev) => ({ ...prev, hasUnsavedChanges: false }));
		},
	};
};
