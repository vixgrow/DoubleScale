import { useSelect } from '@wordpress/data';
import { useEffect, useState, useRef } from 'react';
import { STORE_KEY } from '../../../../stores/email-builder/constants';
import { EmailSection } from '../../../../stores/email-builder/types';
import { PaddingValue } from '../../basic/shared';

interface BackgroundImage {
  id: number;
  name: string;
  url: string;
  size: number;
}

export interface LayoutSettingsData {
  backgroundColor: string;
  backgroundImage: BackgroundImage | null;
  backgroundRepeat: string;
  backgroundSize: string;
  backgroundPosition: string;
  padding: PaddingValue;
}

interface UseSectionSettingsOptions {
  onSettingsChange?: (settings: LayoutSettingsData) => void;
  initialSettings?: Partial<LayoutSettingsData>;
  sectionId?: string;
}

const convertSectionStylesToSettings = (
  section: EmailSection
): Partial<LayoutSettingsData> => {
  if (!section?.styles) return {};

  const styles = section.styles;
  const padding = styles.padding || '40px';

  let paddingValues = { top: 40, right: 40, bottom: 40, left: 40 };
  if (typeof padding === 'string') {
    const paddingArray = padding
      .split(' ')
      .map((p) => parseInt(p.replace('px', '')) || 0);
    if (paddingArray.length === 1) {
      paddingValues = {
        top: paddingArray[0],
        right: paddingArray[0],
        bottom: paddingArray[0],
        left: paddingArray[0],
      };
    } else if (paddingArray.length === 2) {
      paddingValues = {
        top: paddingArray[0],
        right: paddingArray[1],
        bottom: paddingArray[0],
        left: paddingArray[1],
      };
    } else if (paddingArray.length === 4) {
      paddingValues = {
        top: paddingArray[0],
        right: paddingArray[1],
        bottom: paddingArray[2],
        left: paddingArray[3],
      };
    }
  }

  let backgroundImage: BackgroundImage | null = null;
  if (styles.backgroundImage && styles.backgroundImage !== 'none') {
    const urlMatch = styles.backgroundImage.match(
      /url\(['"]?([^'"]+)['"]?\)/
    );
    if (urlMatch) {
      backgroundImage = {
        id: 0,
        name: 'Background Image',
        url: urlMatch[1],
        size: 0,
      };
    }
  }

  return {
    backgroundColor: styles.backgroundColor || '#ffffff',
    backgroundImage,
    backgroundRepeat: styles.backgroundRepeat || 'no-repeat',
    backgroundSize: styles.backgroundSize || 'cover',
    backgroundPosition: styles.backgroundPosition || 'center',
    padding: paddingValues,
  };
};

export const useSectionSettings = ({
  onSettingsChange,
  initialSettings = {},
  sectionId,
}: UseSectionSettingsOptions) => {
  const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
  const currentSection = sectionId
    ? sections.find((s) => s.id === sectionId)
    : null;

  // Track previous sectionId to only sync when switching sections
  const previousSectionIdRef = useRef<string | undefined>(sectionId);

  const [settings, setSettings] = useState<LayoutSettingsData>(() => {
    const defaultSettings: LayoutSettingsData = {
      backgroundColor: '#ffffff',
      backgroundImage: null,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40,
      },
    };

    if (currentSection) {
      const sectionSettings =
        convertSectionStylesToSettings(currentSection);
      return { ...defaultSettings, ...sectionSettings };
    }

    return { ...defaultSettings, ...initialSettings };
  });

  // Only sync from store when sectionId changes (switching sections), 
  // not when section data changes (which would overwrite user changes)
  useEffect(() => {
    // Only sync if sectionId actually changed
    if (previousSectionIdRef.current !== sectionId) {
      previousSectionIdRef.current = sectionId;
      
      // Get the current section at the time of the effect
      // Using sections from closure - it will have the latest value when sectionId changes
      const sectionToSync = sectionId
        ? sections.find((s) => s.id === sectionId)
        : null;
      
      if (sectionToSync) {
        const sectionSettings =
          convertSectionStylesToSettings(sectionToSync);
        setSettings((prev) => {
          const defaultSettings: LayoutSettingsData = {
            backgroundColor: '#ffffff',
            backgroundImage: null,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: {
              top: 40,
              right: 40,
              bottom: 40,
              left: 40,
            },
          };
          return { ...defaultSettings, ...sectionSettings };
        });
      } else if (initialSettings && Object.keys(initialSettings).length > 0) {
        setSettings((prev) => {
          const defaultSettings: LayoutSettingsData = {
            backgroundColor: '#ffffff',
            backgroundImage: null,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: {
              top: 40,
              right: 40,
              bottom: 40,
              left: 40,
            },
          };
          return { ...defaultSettings, ...initialSettings };
        });
      }
    }
    // Only depend on sectionId, not sections or currentSection, to avoid overwriting user changes
    // When sectionId changes, sections will have the latest value from the closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const handleInputChange = (
    field: keyof LayoutSettingsData,
    value: any
  ) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handlePaddingChange = (padding: PaddingValue) => {
    const newSettings = { ...settings, padding };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return {
    settings,
    handleInputChange,
    handlePaddingChange,
  };
};

