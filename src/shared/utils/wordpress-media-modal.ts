/**
 * Helpers for WordPress core media modal inside Radix/shadcn dialogs.
 */

export const isWordPressMediaElement = (
	target: HTMLElement | null
): boolean => {
	if (!target) {
		return false;
	}

	return !!(
		target.closest('.media-modal') ||
		target.closest('.media-modal-backdrop') ||
		target.closest('.media-frame') ||
		target.closest('.uploader-editor') ||
		target.closest('.supports-drag-drop')
	);
};

/**
 * Raise the WP media modal above app dialogs and stop pointer events bubbling
 * to Radix dismiss handlers. Returns a cleanup function.
 */
export const elevateWordPressMediaModal = (
	zIndex = '160010'
): (() => void) => {
	const modal = document.querySelector('.media-modal') as HTMLElement | null;
	const backdrop = document.querySelector(
		'.media-modal-backdrop'
	) as HTMLElement | null;

	const previousModalZ = modal?.style.zIndex ?? '';
	const previousBackdropZ = backdrop?.style.zIndex ?? '';

	if (modal) {
		modal.style.zIndex = zIndex;
	}
	if (backdrop) {
		backdrop.style.zIndex = String(Number(zIndex) - 1);
	}

	const stopPointerPropagation = (event: Event) => {
		event.stopPropagation();
	};

	modal?.addEventListener('mousedown', stopPointerPropagation, true);
	modal?.addEventListener('pointerdown', stopPointerPropagation, true);

	return () => {
		if (modal) {
			modal.style.zIndex = previousModalZ;
		}
		if (backdrop) {
			backdrop.style.zIndex = previousBackdropZ;
		}
		modal?.removeEventListener('mousedown', stopPointerPropagation, true);
		modal?.removeEventListener(
			'pointerdown',
			stopPointerPropagation,
			true
		);
	};
};
