/**
 * Shared dnd-kit screen-reader copy so every kanban board translates the same.
 */

import { __ } from '@wordpress/i18n';

export const dndScreenReaderInstructions = {
	draggable: __(
		'To pick up a draggable item, press the space bar. While dragging, use the arrow keys to move the item. Press space again to drop the item in its new position, or press escape to cancel.',
		'doublescale'
	),
};
