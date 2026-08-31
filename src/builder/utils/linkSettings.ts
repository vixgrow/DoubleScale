import type { LinkSettings } from '../../stores/email-builder/types';

export const DEFAULT_LINK_SETTINGS: LinkSettings = {
	font: 'Arial, sans-serif',
	size: 16,
	letterSpacing: '0px',
	color: '#458DC7',
	bold: false,
	italic: false,
	underline: true,
	strikethrough: false,
};

export const mergeLinkSettings = (
	partial?: Partial<LinkSettings> | null
): LinkSettings => ({
	...DEFAULT_LINK_SETTINGS,
	...(partial ?? {}),
});

export const getLinkTextDecoration = (settings: LinkSettings): string => {
	const parts = [
		settings.underline ? 'underline' : '',
		settings.strikethrough ? 'line-through' : '',
	].filter(Boolean);
	return parts.join(' ') || 'none';
};

export const getLinkCssDeclarations = (
	settings: LinkSettings,
	important = false
): string => {
	const suffix = important ? ' !important' : '';
	return [
		`font-family: ${settings.font}${suffix}`,
		`font-size: ${settings.size}px${suffix}`,
		`letter-spacing: ${settings.letterSpacing}${suffix}`,
		`color: ${settings.color}${suffix}`,
		`font-weight: ${settings.bold ? 'bold' : 'normal'}${suffix}`,
		`font-style: ${settings.italic ? 'italic' : 'normal'}${suffix}`,
		`text-decoration: ${getLinkTextDecoration(settings)}${suffix}`,
	].join('; ');
};

export const applyLinkThemeToElement = (
	element: HTMLElement,
	settings: LinkSettings
): void => {
	element.style.fontFamily = settings.font;
	element.style.fontSize = `${settings.size}px`;
	element.style.letterSpacing = settings.letterSpacing;
	element.style.color = settings.color;
	element.style.fontWeight = settings.bold ? 'bold' : 'normal';
	element.style.fontStyle = settings.italic ? 'italic' : 'normal';
	element.style.textDecoration = getLinkTextDecoration(settings);
};
