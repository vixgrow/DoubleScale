import React, { createContext, useContext, useState, useEffect } from 'react';

type ButtonType = 'primary' | 'secondary' | 'tertiary';

interface ButtonSettings {
    font: string;
    size: number;
    letterSpacing: string;
    borderRadius: number;
    textColor: string;
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    bold: boolean;
    italic: boolean;
    underline: boolean;
}

interface ButtonSettingsContextType {
    buttonSettings: Record<ButtonType, ButtonSettings>;
    updateButtonSettings: (buttonType: ButtonType, settings: Partial<ButtonSettings>) => void;
    getButtonSettings: (buttonType: ButtonType) => ButtonSettings;
}

const defaultSettings: ButtonSettings = {
    font: 'Arial',
    size: 14,
    letterSpacing: '0px',
    borderRadius: 0,
    textColor: '#FFFFFF',
    backgroundColor: '#1E3A8A',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    padding: {
        top: 4,
        right: 8,
        bottom: 4,
        left: 8,
    },
    bold: false,
    italic: false,
    underline: false,
};

const ButtonSettingsContext = createContext<ButtonSettingsContextType | undefined>(undefined);

export const ButtonSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [buttonSettings, setButtonSettings] = useState<Record<ButtonType, ButtonSettings>>({
        primary: defaultSettings,
        secondary: defaultSettings,
        tertiary: defaultSettings,
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('quillcrm-button-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setButtonSettings(parsed);
            } catch (error) {
                console.error('Failed to parse button settings from localStorage:', error);
            }
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('quillcrm-button-settings', JSON.stringify(buttonSettings));
    }, [buttonSettings]);

    const updateButtonSettings = (buttonType: ButtonType, settings: Partial<ButtonSettings>) => {
        setButtonSettings(prev => ({
            ...prev,
            [buttonType]: {
                ...prev[buttonType],
                ...settings,
            },
        }));
    };

    const getButtonSettings = (buttonType: ButtonType): ButtonSettings => {
        return buttonSettings[buttonType];
    };

    return (
        <ButtonSettingsContext.Provider
            value={{
                buttonSettings,
                updateButtonSettings,
                getButtonSettings,
            }}
        >
            {children}
        </ButtonSettingsContext.Provider>
    );
};

export const useButtonSettings = () => {
    const context = useContext(ButtonSettingsContext);
    if (!context) {
        throw new Error('useButtonSettings must be used within a ButtonSettingsProvider');
    }
    return context;
};
