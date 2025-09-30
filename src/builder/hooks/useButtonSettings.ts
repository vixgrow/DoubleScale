import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import * as emailBuilderApi from '../../api/email-builder-api';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { ButtonSettings, ButtonType } from '../../stores/email-builder/types';

/**
 * Custom hook to manage button settings
 */
export const useButtonSettings = () => {
  const dispatch = useDispatch();

  // Get button settings from store
  const buttonSettings = useSelect(
    (select: any) => select(STORE_KEY).getAllButtonSettings(),
    []
  );

  // Load button settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await emailBuilderApi.getButtonSettings();
        if (response && response.settings) {
          dispatch(STORE_KEY).setButtonSettings(response.settings);
        }
      } catch (error) {
        console.error('Error loading button settings:', error);
      }
    };

    loadSettings();
  }, [dispatch]);

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
