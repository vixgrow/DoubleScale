/**
 * Template Actions Hook
 * 
 * Custom hook that encapsulates template-related business logic.
 * This demonstrates extracting complex logic from components.
 */

import type { EmailTemplate } from '@/client/types';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { STORE_KEY } from '../../stores/email-builder/constants';
import {
  createTemplate,
  saveEmailAsTemplate,
  updateTemplate,
} from '../api/templates';

interface UseTemplateActionsReturn {
  saveTemplate: (templateId?: number) => Promise<EmailTemplate>;
  saveAsTemplate: (templateName: string, thumbnailUrl?: string, templateId?: number) => Promise<EmailTemplate>;
  isSaving: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for template save operations
 * 
 * @example
 * const { saveTemplate, saveAsTemplate, isSaving } = useTemplateActions();
 * 
 * // Save existing template
 * await saveTemplate(123);
 * 
 * // Save as new template
 * await saveAsTemplate('My Template');
 */
export const useTemplateActions = (): UseTemplateActionsReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();

  // Select data from store
  const { sections, globalSettings, buttonSettings } = useSelect((select: any) => ({
    sections: select(STORE_KEY).getSections(),
    globalSettings: select(STORE_KEY).getGlobalSettings(),
    buttonSettings: select(STORE_KEY).getAllButtonSettings(),
  }), []);

  /**
   * Prepares builder data for saving
   */
  const prepareBuilderData = useCallback(() => {
    return {
      sections,
      globalSettings,
      buttonSettings,
    };
  }, [sections, globalSettings, buttonSettings]);

  /**
   * Saves the current template
   */
  const saveTemplate = useCallback(
    async (templateId?: number): Promise<EmailTemplate> => {
      setIsSaving(true);
      setError(null);

      try {
        const builderData = prepareBuilderData();

        const templateData = {
          body: {
            type: 'builder' as const,
            value: builderData,
          },
          hidden: true, // Regular save should be hidden from user templates
        };

        let savedTemplate: EmailTemplate;

        if (templateId) {
          // Update existing template
          savedTemplate = await updateTemplate(templateId, templateData);
        } else {
          // Create new template
          savedTemplate = await createTemplate(templateData);
        }

        // Update store with saved template
        dispatch(STORE_KEY).setLastSaved(new Date());
        dispatch(STORE_KEY).setHasUnsavedChanges(false);

        return savedTemplate;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : __('Failed to save template', 'quillcrm');

        setError(errorMessage);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [prepareBuilderData, dispatch]
  );

  /**
   * Saves current email as a new template in the library or updates existing one
   */
  const saveAsTemplate = useCallback(
    async (templateName: string, thumbnailUrl?: string, templateId?: number): Promise<EmailTemplate> => {
      setIsSaving(true);
      setError(null);

      try {
        const builderData = prepareBuilderData();

        let savedTemplate: EmailTemplate;

        if (templateId) {
          // Update existing template - only update the body, keep name and thumbnail unchanged
          const bodyData = {
            type: 'builder',
            value: builderData,
          };

          savedTemplate = await updateTemplate(templateId, {
            body: JSON.stringify(bodyData),
          });
        } else {
          // Create new template
          if (!templateName || templateName.trim() === '') {
            throw new Error(__('Template name is required', 'quillcrm'));
          }

          savedTemplate = await saveEmailAsTemplate(
            templateName.trim(),
            builderData,
            thumbnailUrl
          );
        }

        return savedTemplate;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : __('Failed to save as template', 'quillcrm');

        setError(errorMessage);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [prepareBuilderData]
  );

  /**
   * Clears any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saveTemplate,
    saveAsTemplate,
    isSaving,
    error,
    clearError,
  };
};

