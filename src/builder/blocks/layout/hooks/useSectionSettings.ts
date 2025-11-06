import { useSelect } from '@wordpress/data';
import { useEffect, useState } from 'react';
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
  const padding = styles.padding || '20px';

  let paddingValues = { top: 20, right: 20, bottom: 20, left: 20 };
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

  const [settings, setSettings] = useState<LayoutSettingsData>(() => {
    const defaultSettings: LayoutSettingsData = {
      backgroundColor: '#ffffff',
      backgroundImage: null,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    };

    if (currentSection) {
      const sectionSettings =
        convertSectionStylesToSettings(currentSection);
      return { ...defaultSettings, ...sectionSettings };
    }

    return { ...defaultSettings, ...initialSettings };
  });

  useEffect(() => {
    if (currentSection) {
      const sectionSettings =
        convertSectionStylesToSettings(currentSection);
      setSettings((prev) => ({
        ...prev,
        ...sectionSettings,
      }));
    } else if (initialSettings) {
      setSettings((prev) => ({
        ...prev,
        ...initialSettings,
      }));
    }
  }, [initialSettings, currentSection]);

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

