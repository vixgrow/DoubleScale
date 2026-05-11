import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { ButtonSettings, ButtonType } from '../../stores/email-builder/types';

/**
 * Monotonic version counter incremented when a template is applied from the
 * sidebar so async template fetches can detect stale responses.
 */
let settingsVersion = 0;

export const setSkipButtonSettingsReload = (skip: boolean) => {
	if (skip) {
		settingsVersion++;
	}
};

export const getButtonSettingsVersion = (): number => settingsVersion;

/**
 * Button settings in the email-builder store. Initial load is handled by
 * `loadTemplateData` in `builder/index.tsx` only — this hook does not fetch.
 */
export const useButtonSettings = () => {
	const dispatch = useDispatch();

	const buttonSettings = useSelect(
		(select: any) => select(STORE_KEY).getAllButtonSettings(),
		[]
	);

	const updateButtonSettings = (
		buttonType: ButtonType,
		settings: Partial<ButtonSettings>
	) => {
		dispatch(STORE_KEY).updateButtonSettings(buttonType, settings);
	};

	const defaultButtonSettings: ButtonSettings = {
		font: 'Arial, sans-serif',
		size: 16,
		letterSpacing: '0px',
		borderRadius: 4,
		textColor: '#ffffff',
		backgroundColor: '#1e398a',
		borderWidth: 0,
		borderColor: '#1e398a',
		padding: { top: 6, right: 8, bottom: 6, left: 8 },
		bold: false,
		italic: false,
		underline: false,
		strikethrough: false,
	};

	const getButtonSettings = (buttonType: ButtonType): ButtonSettings => {
		return buttonSettings?.[buttonType] ?? defaultButtonSettings;
	};

	return {
		buttonSettings,
		updateButtonSettings,
		getButtonSettings,
	};
};
