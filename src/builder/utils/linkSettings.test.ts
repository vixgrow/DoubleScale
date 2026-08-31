import { describe, expect, it } from 'vitest';
import {
	DEFAULT_LINK_SETTINGS,
	getLinkCssDeclarations,
	getLinkTextDecoration,
	mergeLinkSettings,
} from './linkSettings';

describe('linkSettings helpers', () => {
	it('merges partial theme settings onto defaults', () => {
		expect(mergeLinkSettings({ color: '#111111', underline: false })).toEqual({
			...DEFAULT_LINK_SETTINGS,
			color: '#111111',
			underline: false,
		});
	});

	it('builds decoration from underline and strikethrough', () => {
		expect(getLinkTextDecoration(DEFAULT_LINK_SETTINGS)).toBe('underline');
		expect(
			getLinkTextDecoration({
				...DEFAULT_LINK_SETTINGS,
				underline: true,
				strikethrough: true,
			})
		).toBe('underline line-through');
		expect(
			getLinkTextDecoration({
				...DEFAULT_LINK_SETTINGS,
				underline: false,
				strikethrough: false,
			})
		).toBe('none');
	});

	it('emits CSS declarations for text-block links', () => {
		const css = getLinkCssDeclarations(DEFAULT_LINK_SETTINGS, true);
		expect(css).toContain('color: #458DC7 !important');
		expect(css).toContain('font-size: 16px !important');
		expect(css).toContain('text-decoration: underline !important');
	});
});
