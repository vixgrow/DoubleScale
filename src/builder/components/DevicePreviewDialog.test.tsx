/**
 * Device preview dialog.
 *
 * The point of this dialog is that switching device actually changes the
 * viewport the email is rendered into — the mobile frame must be narrow enough
 * for the email's own `max-width: 480px` media query to apply, otherwise the
 * preview silently shows a desktop layout and is worse than no preview at all.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DevicePreviewDialog } from './DevicePreviewDialog';

const HTML = '<p>hello</p>';

function renderDialog(props: Record<string, unknown> = {}) {
	const onOpenChange = vi.fn();
	render(
		<DevicePreviewDialog
			open
			onOpenChange={onOpenChange}
			html={HTML}
			{...props}
		/>
	);
	return { onOpenChange };
}

function frame(): HTMLIFrameElement {
	return screen.getByTitle('Email preview') as HTMLIFrameElement;
}

describe('DevicePreviewDialog', () => {
	afterEach(() => cleanup());

	it('renders the email inside an iframe (so the email CSS applies in isolation)', () => {
		renderDialog();

		// srcDoc, not innerHTML: a real document is what makes media queries work.
		expect(frame().getAttribute('srcdoc')).toBe(HTML);
	});

	it('opens on desktop width', () => {
		renderDialog();
		expect(frame().style.width).toBe('900px');
	});

	it('switches to a tablet viewport', () => {
		renderDialog();

		fireEvent.click(screen.getByRole('button', { name: 'Tablet' }));

		expect(frame().style.width).toBe('768px');
	});

	it('switches to a mobile viewport BELOW the 480px email breakpoint', () => {
		renderDialog();

		fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));

		const width = Number.parseInt(frame().style.width, 10);
		expect(width).toBeLessThan(480);
	});

	it('can switch back to desktop', () => {
		renderDialog();

		fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
		fireEvent.click(screen.getByRole('button', { name: 'Desktop' }));

		expect(frame().style.width).toBe('900px');
	});

	it('marks the active device as pressed for assistive tech', () => {
		renderDialog();

		fireEvent.click(screen.getByRole('button', { name: 'Tablet' }));

		expect(
			screen.getByRole('button', { name: 'Tablet' })
		).toHaveAttribute('aria-pressed', 'true');
		expect(
			screen.getByRole('button', { name: 'Desktop' })
		).toHaveAttribute('aria-pressed', 'false');
	});

	it('shows a spinner instead of a stale frame while loading', () => {
		renderDialog({ loading: true });

		expect(screen.queryByTitle('Email preview')).toBeNull();
	});

	it('shows the error and a retry action instead of a blank frame', () => {
		const onRetry = vi.fn();
		renderDialog({ error: 'Render failed', onRetry });

		expect(screen.getByText('Render failed')).toBeTruthy();
		expect(screen.queryByTitle('Email preview')).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});
});
