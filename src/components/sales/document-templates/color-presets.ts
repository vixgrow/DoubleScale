/**
 * Propovoice-aligned accent color presets for document templates.
 */

export const TEMPLATE_COLOR_NONE = null;

export interface TemplateColorPreset {
	id: string;
	label: string;
	value: string | null;
}

export const TEMPLATE_COLOR_PRESETS: TemplateColorPreset[] = [
	{ id: 'none', label: 'Default', value: TEMPLATE_COLOR_NONE },
	{ id: 'red', label: 'Red', value: '#f16063' },
	{ id: 'orange', label: 'Orange', value: '#f68a0b' },
	{ id: 'blue', label: 'Blue', value: '#4c6fff' },
	{ id: 'green', label: 'Green', value: '#0ba24b' },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const normalizeTemplateColor = (value: unknown): string | null => {
	if (value === null || value === undefined || value === '' || value === 'none') {
		return null;
	}
	const color = String(value).trim();
	return HEX_RE.test(color) ? color.toLowerCase() : null;
};

export const isPresetColor = (value: string | null): boolean => {
	if (!value) {
		return true;
	}
	return TEMPLATE_COLOR_PRESETS.some((p) => p.value === value);
};

export const getCustomColorValue = (value: string | null): string => {
	if (value && !isPresetColor(value)) {
		return value;
	}
	return '#4c6fff';
};
