import { useSelect } from '@wordpress/data';
import { useEffect, useState, useRef } from 'react';
import { STORE_KEY } from '../../../../stores/email-builder/constants';
import {
	EmailSection,
	EmailColumn,
} from '../../../../stores/email-builder/types';
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
	margin: PaddingValue;
}

interface UseSectionSettingsOptions {
	onSettingsChange?: (settings: LayoutSettingsData) => void;
	initialSettings?: Partial<LayoutSettingsData>;
	sectionId?: string;
	columnId?: string;
}

const parseSpacing = (value: string, fallback = 0) => {
	const defaults = {
		top: fallback,
		right: fallback,
		bottom: fallback,
		left: fallback,
	};
	const parts = value
		.split(' ')
		.map((p) => parseInt(p.replace('px', '')) || 0);
	if (parts.length === 1) {
		return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
	}
	if (parts.length === 2) {
		return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
	}
	if (parts.length === 4) {
		return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
	}
	return defaults;
};

const parsePadding = (padding: string) => parseSpacing(padding, 40);

const parseBackgroundImage = (bgImage: string): BackgroundImage | null => {
	if (!bgImage || bgImage === 'none') {
		return null;
	}
	const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
	if (urlMatch) {
		return { id: 0, name: 'Background Image', url: urlMatch[1], size: 0 };
	}
	return null;
};

const convertSectionStylesToSettings = (
	section: EmailSection
): Partial<LayoutSettingsData> => {
	if (!section?.styles) {
		return {};
	}
	const styles = section.styles;
	return {
		backgroundColor: styles.backgroundColor || 'transparent',
		backgroundImage: parseBackgroundImage(styles.backgroundImage),
		backgroundRepeat: styles.backgroundRepeat || 'no-repeat',
		backgroundSize: styles.backgroundSize || 'cover',
		backgroundPosition: styles.backgroundPosition || 'center',
		padding: parsePadding(styles.padding || '40px'),
		margin: parseSpacing(styles.margin || '0px'),
	};
};

const convertColumnStylesToSettings = (
	column: EmailColumn
): Partial<LayoutSettingsData> => {
	if (!column?.styles) {
		return {};
	}
	const styles = column.styles;
	return {
		backgroundColor: styles.backgroundColor || 'transparent',
		backgroundImage: parseBackgroundImage(styles.backgroundImage),
		backgroundRepeat: styles.backgroundRepeat || 'no-repeat',
		backgroundSize: styles.backgroundSize || 'cover',
		backgroundPosition: styles.backgroundPosition || 'center',
		padding: parsePadding(styles.padding || '0px'),
		margin: parseSpacing(styles.margin || '0px'),
	};
};

export const useSectionSettings = ({
	onSettingsChange,
	initialSettings = {},
	sectionId,
	columnId,
}: UseSectionSettingsOptions) => {
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const currentSection = sectionId
		? sections.find((s) => s.id === sectionId)
		: null;
	const currentColumn =
		currentSection && columnId
			? currentSection.columns.find((c) => c.id === columnId)
			: null;

	const syncSource = columnId ? currentColumn : currentSection;
	const convertStyles = columnId
		? convertColumnStylesToSettings
		: convertSectionStylesToSettings;

	const previousKeyRef = useRef<string>(`${sectionId ?? ''}-${columnId ?? ''}`);

	const defaultPadding = columnId
		? { top: 0, right: 0, bottom: 0, left: 0 }
		: { top: 40, right: 40, bottom: 40, left: 40 };
	const defaultMargin = { top: 0, right: 0, bottom: 0, left: 0 };

	const [settings, setSettings] = useState<LayoutSettingsData>(() => {
		const defaultSettings: LayoutSettingsData = {
			backgroundColor: 'transparent',
			backgroundImage: null,
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			padding: defaultPadding,
			margin: defaultMargin,
		};

		if (syncSource) {
			const sourceSettings = convertStyles(
				syncSource as EmailSection & EmailColumn
			);
			return { ...defaultSettings, ...sourceSettings };
		}

		return { ...defaultSettings, ...initialSettings };
	});

	useEffect(() => {
		const currentKey = `${sectionId ?? ''}-${columnId ?? ''}`;
		if (previousKeyRef.current !== currentKey) {
			previousKeyRef.current = currentKey;

			const sectionToSync = sectionId
				? sections.find((s) => s.id === sectionId)
				: null;
			const columnToSync =
				sectionToSync && columnId
					? sectionToSync.columns.find((c) => c.id === columnId)
					: null;
			const sourceToSync = columnId ? columnToSync : sectionToSync;

			const syncDefaultSettings: LayoutSettingsData = {
				backgroundColor: 'transparent',
				backgroundImage: null,
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				padding: defaultPadding,
				margin: defaultMargin,
			};

			if (sourceToSync) {
				const sourceSettings = convertStyles(
					sourceToSync as EmailSection & EmailColumn
				);
				setSettings(() => ({ ...syncDefaultSettings, ...sourceSettings }));
			} else if (initialSettings && Object.keys(initialSettings).length > 0) {
				setSettings(() => ({ ...syncDefaultSettings, ...initialSettings }));
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sectionId, columnId]);

	const handleInputChange = (
		field: keyof LayoutSettingsData,
		value: unknown
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

	const handleMarginChange = (margin: PaddingValue) => {
		const newSettings = { ...settings, margin };
		setSettings(newSettings);
		onSettingsChange?.(newSettings);
	};

	return {
		settings,
		handleInputChange,
		handlePaddingChange,
		handleMarginChange,
	};
};
