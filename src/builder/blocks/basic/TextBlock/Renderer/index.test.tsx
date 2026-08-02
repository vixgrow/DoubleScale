/**
 * Regression test for the email-builder autosave bug.
 *
 * Bug: the canvas text editor is an uncontrolled contentEditable that only
 * pushed its content to the store on `blur`. Autosave snapshots the store on a
 * timer, so an edit made while the user was still typing (no blur yet) was
 * never in the snapshot — autosave silently persisted the previous content and
 * the block reverted on the next hydration.
 *
 * Fix: commit on `input` (debounced), with `blur` as an immediate flush. These
 * tests lock in that "typing reaches the store before blur" guarantee.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TextRenderer } from './index';
import { TextBlockProps } from '..';

// Minimal valid props — built inline so the test does not import the TextBlock
// index (which would pull in the Editor/icon and their dependencies).
const baseProps: TextBlockProps = {
	content: '',
	hyperlink: 'https://',
	fontSize: 16,
	color: '#333',
	align: 'left',
	fontFamily: 'Arial',
	bold: false,
	italic: false,
	underline: false,
	'line-through': false,
	lineHeight: '1.5',
	letterSpacing: '0px',
	borderRadius: '0px',
	borderWidth: '0px',
	linkColor: '#333',
	backgroundColor: 'transparent',
	textAlign: 'left',
	textDirection: 'ltr',
	listType: 'none',
	headingStyle: 'p',
	padding: { top: 4, right: 8, bottom: 4, left: 8 },
	isProActivated: false,
	isPro: false,
};

describe('TextRenderer canvas editing → store commit', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
	});

	it('commits typed content to the store on input, before any blur', () => {
		const onCanvasContentChange = vi.fn();
		render(
			<TextRenderer
				props={{ ...baseProps, content: '' }}
				canvasEditable
				onCanvasContentChange={onCanvasContentChange}
			/>
		);

		const editor = screen.getByRole('textbox', { name: 'Edit text' });

		// Simulate the user focusing and typing — NO blur.
		fireEvent.focus(editor);
		editor.innerHTML = '<p>Hello typed</p>';
		fireEvent.input(editor);

		// Debounced: nothing committed until the interval elapses.
		expect(onCanvasContentChange).not.toHaveBeenCalled();

		vi.advanceTimersByTime(400);

		// The edit reached the store WITHOUT a blur — this is what autosave reads.
		expect(onCanvasContentChange).toHaveBeenCalledTimes(1);
		expect(onCanvasContentChange.mock.calls[0][0]).toContain('Hello typed');
	});

	it('flushes the latest content immediately on blur and cancels the pending debounce', () => {
		const onCanvasContentChange = vi.fn();
		render(
			<TextRenderer
				props={{ ...baseProps, content: '' }}
				canvasEditable
				onCanvasContentChange={onCanvasContentChange}
			/>
		);

		const editor = screen.getByRole('textbox', { name: 'Edit text' });

		fireEvent.focus(editor);
		editor.innerHTML = '<p>Quick edit</p>';
		fireEvent.input(editor); // schedules a debounced commit
		fireEvent.blur(editor); // should flush now and cancel the debounce

		expect(onCanvasContentChange).toHaveBeenCalledTimes(1);
		expect(onCanvasContentChange.mock.calls[0][0]).toContain('Quick edit');

		// The cancelled debounce must NOT produce a second, duplicate commit.
		vi.advanceTimersByTime(400);
		expect(onCanvasContentChange).toHaveBeenCalledTimes(1);
	});

	it('debounces rapid input into a single commit with the final content', () => {
		const onCanvasContentChange = vi.fn();
		render(
			<TextRenderer
				props={{ ...baseProps, content: '' }}
				canvasEditable
				onCanvasContentChange={onCanvasContentChange}
			/>
		);

		const editor = screen.getByRole('textbox', { name: 'Edit text' });
		fireEvent.focus(editor);

		editor.innerHTML = '<p>One</p>';
		fireEvent.input(editor);
		vi.advanceTimersByTime(100);

		editor.innerHTML = '<p>One two</p>';
		fireEvent.input(editor);
		vi.advanceTimersByTime(100);

		editor.innerHTML = '<p>One two three</p>';
		fireEvent.input(editor);

		// Only the trailing edit, after the debounce settles, is committed.
		expect(onCanvasContentChange).not.toHaveBeenCalled();
		vi.advanceTimersByTime(400);
		expect(onCanvasContentChange).toHaveBeenCalledTimes(1);
		expect(onCanvasContentChange.mock.calls[0][0]).toContain('One two three');
	});
});
