import * as React from 'react';

/**
 * Above nested dialogs (contact page z-[140000], deal modal z-[1800000]).
 * Applied to [data-radix-popper-content-wrapper] — inner z-index classes
 * do not lift that wrapper.
 */
export const FLOATING_LAYER_Z_INDEX = 2_000_000;

export function liftRadixPopper(
	node: HTMLElement | null,
	zIndex: number = FLOATING_LAYER_Z_INDEX
) {
	if (!node) {
		return;
	}
	const apply = () => {
		const wrapper = node.closest(
			'[data-radix-popper-content-wrapper]'
		) as HTMLElement | null;
		if (wrapper) {
			wrapper.style.setProperty('z-index', String(zIndex), 'important');
			wrapper.style.setProperty('pointer-events', 'auto');
		}
	};
	apply();
	requestAnimationFrame(apply);
}

export function mergeNodeRefs<T>(
	...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
	return (node) => {
		for (const ref of refs) {
			if (!ref) {
				continue;
			}
			if (typeof ref === 'function') {
				ref(node);
			} else {
				(ref as React.MutableRefObject<T | null>).current = node;
			}
		}
	};
}
