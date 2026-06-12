/**
 * Regression test for the email-builder "text disappears" bug.
 *
 * Repro: select text inside a block; the mouseup/click ends over the column or
 * section, which selected the layout, deselected the block, tore down its
 * editor and wiped the text. Layout click handlers now bail via
 * hasActiveTextSelection() while a text selection is active.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasActiveTextSelection } from './selectionGuards';

function mockSelection(
	value: Partial<Selection> & { text?: string } | null
): void {
	vi.spyOn(window, 'getSelection').mockImplementation(() => {
		if (!value) return null;
		return {
			isCollapsed: value.isCollapsed ?? true,
			toString: () => value.text ?? '',
		} as unknown as Selection;
	});
}

describe('hasActiveTextSelection', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('is true for a non-collapsed selection with text (a real highlight)', () => {
		mockSelection({ isCollapsed: false, text: 'highlighted words' });
		expect(hasActiveTextSelection()).toBe(true);
	});

	it('is false for a collapsed selection (just a caret / plain click)', () => {
		mockSelection({ isCollapsed: true, text: '' });
		expect(hasActiveTextSelection()).toBe(false);
	});

	it('is false when there is no selection', () => {
		mockSelection(null);
		expect(hasActiveTextSelection()).toBe(false);
	});

	it('is false for a non-collapsed but whitespace-only selection', () => {
		mockSelection({ isCollapsed: false, text: '   ' });
		expect(hasActiveTextSelection()).toBe(false);
	});
});
