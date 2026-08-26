import { describe, expect, it } from 'vitest';
import { stripListInlineTextAlign } from './stripRichTextChromeColors';

describe('stripListInlineTextAlign', () => {
	it('removes text-align from ol/ul/li so block alignment can inherit', () => {
		const html =
			'<ol style="text-align: left; margin: 10px 0"><li style="text-align: left">One</li></ol>';
		const out = stripListInlineTextAlign(html);
		expect(out).not.toMatch(/text-align/i);
		expect(out).toContain('margin: 10px 0');
		expect(out).toContain('<li');
		expect(out).toContain('One');
	});

	it('leaves paragraph text-align alone', () => {
		const html = '<p style="text-align: center">Hello</p>';
		expect(stripListInlineTextAlign(html)).toBe(html);
	});
});
