import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from 'react';
import * as emailBuilderApi from '../../api/email-builder-api';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { ButtonSettings, ButtonType } from '../../stores/email-builder/types';

/**
 * Custom hook to manage button settings with auto-loading and debounced saving
 */
export const useButtonSettings = () => {
  const dispatch = useDispatch();
  const saveTimeoutRef = useRef<number | null>(null);

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

  // Debounced save when button settings change
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await emailBuilderApi.saveButtonSettings(buttonSettings);
      } catch (error) {
        console.error('Error saving button settings:', error);
      }
    }, 1000); // 1 second debounce

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [buttonSettings]);

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
