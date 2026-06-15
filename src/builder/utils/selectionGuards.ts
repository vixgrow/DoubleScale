/**
 * True when there is an active (non-collapsed) text selection in the document.
 *
 * Builder layout containers (column/section) consult this before turning a
 * click into a layout selection: a drag to select text inside a block can end
 * with its mouseup/click landing on the surrounding column or section. Selecting
 * the layout there would deselect the block, unmount its contentEditable editor
 * and — during that teardown — discard the user's text. While a text selection
 * is active we ignore the layout click; a genuine layout click first collapses
 * the selection on mousedown, so this does not block normal selection.
 */
export const hasActiveTextSelection = (): boolean => {
	if (typeof window === 'undefined' || !window.getSelection) {
		return false;
	}
	const selection = window.getSelection();
	return (
		!!selection &&
		!selection.isCollapsed &&
		selection.toString().trim().length > 0
	);
};
