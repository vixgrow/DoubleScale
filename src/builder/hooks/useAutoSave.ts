import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { CAMPAIGN_STATUS } from '../../client/types';
import { STORE_KEY } from '../../stores/email-builder/constants';

interface UseAutoSaveOptions {
  interval?: number; // Auto-save interval in milliseconds (default: 30000 = 30 seconds)
  enabled?: boolean; // Enable/disable auto-save
}

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

export const useAutoSave = (options: UseAutoSaveOptions = {}) => {
  const { interval = 30000, enabled = true } = options;

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
    (select: any) => select('quillcrm/campaign').getCampaign(),
    []
  );
  const existingTemplateData = useSelect(
    (select: any) => select('quillcrm/campaign').getStepData('template'),
    []
  );
  const { saveCampaignStep } = useDispatch('quillcrm/campaign');

  // Create a serialized version of current state for comparison
  const currentState = JSON.stringify({
    sections,
    globalSettings,
    buttonSettings,
  });

  // Simple: Initialize baseline when store has data
  useEffect(() => {
    // Only run once
    if (hasInitializedRef.current) {
      return;
    }

    // Wait for store to have data (at least sections array exists)
    if (sections && sections.length > 0) {
      lastSavedStateRef.current = currentState;
      hasInitializedRef.current = true;

      // Set last modified date if available
      if (existingTemplateData?.template?.updated_at) {
        setSaveStatus((prev) => ({
          ...prev,
          lastSaved: new Date(existingTemplateData.template.updated_at),
        }));
      }

    }
  }, [sections, currentState, existingTemplateData]);

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
  const save = useCallback(async () => {
    if (!campaign || !isMountedRef.current) {
      return false;
    }

    try {
      setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

      // Create the builder data
      const builderData = {
        sections: JSON.parse(currentState).sections,
        globalSettings: JSON.parse(currentState).globalSettings,
        buttonSettings: JSON.parse(currentState).buttonSettings,
      };

      // Get template_id from existing template data
      if (!existingTemplateData?.template_id) {
        throw new Error('No template ID found. Please save template first.');
      }

      // Import template API functions
      const { getTemplate, updateTemplate, createTemplate } = await import('../api/templates');

      const isDraft = campaign.status === CAMPAIGN_STATUS.DRAFT;

      if (isDraft) {
        // Campaign is draft → Update existing template
        const existingTemplate = await getTemplate(existingTemplateData.template_id);
        await updateTemplate(existingTemplateData.template_id, {
          ...existingTemplate,
          email_body: {
            type: 'builder',
            value: builderData,
          },
        });
      } else {
        // Campaign is sent/scheduled → Create new template to preserve original
        const existingTemplate = await getTemplate(existingTemplateData.template_id);
        const newTemplate = await createTemplate({
          ...existingTemplate,
          name: `${existingTemplate.name}`,
          email_body: {
            type: 'builder',
            value: builderData,
          },
        });

        // Add new template to campaign template_ids array
        await saveCampaignStep('template', {
          template_id: newTemplate.id,
        });
      }

      if (isMountedRef.current) {
        const now = new Date();
        lastSavedStateRef.current = currentState;
        setSaveStatus({
          isSaving: false,
          lastSaved: now,
          hasUnsavedChanges: false,
          error: null,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      if (isMountedRef.current) {
        setSaveStatus((prev) => ({
          ...prev,
          isSaving: false,
          error: error.message || 'Failed to save',
        }));
      }
      console.error('Save error:', error);
      return false;
    }
  }, [campaign, currentState, existingTemplateData, saveCampaignStep]);

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
