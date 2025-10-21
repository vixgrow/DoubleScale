import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { ButtonSettings, ButtonType } from '../../stores/email-builder/types';

/**
 * Custom hook to manage button settings
 * Now loads from campaign template data instead of separate API
 */
export const useButtonSettings = () => {
  const dispatch = useDispatch();

  // Get button settings from store
  const buttonSettings = useSelect(
    (select: any) => select(STORE_KEY).getAllButtonSettings(),
    []
  );

  // Get existing template data from campaign store (contains template_id)
  const existingTemplateData = useSelect(
    (select: any) => select('quillcrm/campaign').getStepData('template'),
    []
  );

  // Load button settings from template table
  useEffect(() => {
    const loadButtonSettings = async () => {
      if (!existingTemplateData?.template_id) {
        return;
      }

      try {
        const { getTemplate } = await import('../api/templates');
        const template = await getTemplate(existingTemplateData.template_id);
        const emailBody = template.email_body;

        if (emailBody?.type === 'builder' && emailBody.value?.buttonSettings) {
          dispatch(STORE_KEY).setButtonSettings(emailBody.value.buttonSettings);
        }
      } catch (error) {
        console.error('Failed to load button settings:', error);
      }
    };

    loadButtonSettings();
  }, [existingTemplateData?.template_id, dispatch]);

  // Helper function to update button settings
  const updateButtonSettings = (
    buttonType: ButtonType,
    settings: Partial<ButtonSettings>
  ) => {
    dispatch(STORE_KEY).updateButtonSettings(buttonType, settings);
  };

  // Helper function to get settings for a specific button type
  const getButtonSettings = (buttonType: ButtonType): ButtonSettings => {
    return buttonSettings[buttonType];
  };

  return {
    buttonSettings,
    updateButtonSettings,
    getButtonSettings,
  };
};
