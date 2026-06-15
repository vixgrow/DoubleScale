/**
 * Regression test: the font-size input must be freely editable.
 *
 * Bug: min/max clamping ran on every change and rewrote the field, so typing a
 * digit on the way to a larger number (e.g. "1" toward "12", or "7" toward
 * "70") instantly snapped to the min (8) — the field could not be edited at
 * all. Clamping must happen on blur/Enter, not on change.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FontControl } from './FontControl';

const MIN = 8;
const MAX = 72;

function renderControl(fontSize = 16) {
	const onFontSizeChange = vi.fn();
	const onFontFamilyChange = vi.fn();
	render(
		<FontControl
			fontFamily="Arial, sans-serif"
			fontSize={fontSize}
			onFontSizeChange={onFontSizeChange}
			onFontFamilyChange={onFontFamilyChange}
		/>
	);
	const input = screen.getByRole('spinbutton') as HTMLInputElement;
	return { input, onFontSizeChange };
}

describe('FontControl font-size input', () => {
	afterEach(() => cleanup());

	it('does NOT clamp while typing a below-min digit (keeps the field editable)', () => {
		const { input, onFontSizeChange } = renderControl(16);

		// Typing "1" on the way to e.g. "12" must stay "1", not snap to 8.
		fireEvent.change(input, { target: { value: '1' } });

		expect(input.value).toBe('1');
		expect(onFontSizeChange).not.toHaveBeenCalledWith(MIN);
		// Below-min partial value is not applied live either.
		expect(onFontSizeChange).not.toHaveBeenCalled();
	});

	it('live-applies a complete, in-range value as it is typed', () => {
		const { input, onFontSizeChange } = renderControl(16);

		fireEvent.change(input, { target: { value: '24' } });

		expect(input.value).toBe('24');
		expect(onFontSizeChange).toHaveBeenLastCalledWith(24);
	});

	it('clamps to the min on blur', () => {
		const { input, onFontSizeChange } = renderControl(16);

		fireEvent.change(input, { target: { value: '1' } });
		fireEvent.blur(input);

		expect(input.value).toBe(String(MIN));
		expect(onFontSizeChange).toHaveBeenLastCalledWith(MIN);
	});

	it('clamps to the max on blur', () => {
		const { input, onFontSizeChange } = renderControl(16);

		fireEvent.change(input, { target: { value: '999' } });
		// Out-of-range value is not applied live...
		expect(onFontSizeChange).not.toHaveBeenCalledWith(999);

		fireEvent.blur(input);
		// ...but is clamped on blur.
		expect(input.value).toBe(String(MAX));
		expect(onFontSizeChange).toHaveBeenLastCalledWith(MAX);
	});
});
